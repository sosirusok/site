/**
 * 영수증 접수 파이프라인: 표준화 → 중복 조회 → 인식 → 매장 매칭 → 판정 → 저장(+누적 반영).
 */
import type { ReasonCode } from "../config";
import { tx } from "../db";
import { applyApprovedSpend, countMemberReceiptsToday, getMember, insertReceipt, probeDuplicates, type Receipt, getReceipt } from "../db/queries";
import { rateLimit } from "../rate-limit";
import { getRules, tierFor } from "../settings";
import { giftStoresFor } from "../stores";
import { hammingDistance, normalizeImage } from "./image";
import { matchStore } from "./match";
import { OcrRefusedError, OcrUnavailableError, recognizeReceipt, type ReceiptOcr } from "./ocr";
import { decide, type DedupFlags } from "./rules";

export type SubmitResult = {
  receipt: Receipt;
  /** 승인된 경우 고를 수 있는 매장 id */
  giftStoreIds: string[];
  /** 인식 결과 요약(화면 표시용) */
  read: {
    merchant: string | null;
    paidAt: string | null;
    amount: number | null;
    approvalNo: string | null;
    items: { name: string; qty: number | null; amount: number | null }[];
  } | null;
};

export class SubmitError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

export async function submitReceipt(p: { memberId: string; file: Buffer; now?: Date }): Promise<SubmitResult> {
  const now = p.now ?? new Date();
  const member = await getMember(p.memberId);
  if (!member) throw new SubmitError("로그인이 필요합니다.", 401);
  if (!(await rateLimit(`upload:${member.id}`, 12, 600))) throw new SubmitError("잠시 후 다시 시도해 주세요. (요청이 너무 잦습니다)", 429);

  const rules = await getRules();
  let img;
  try {
    img = await normalizeImage(p.file);
  } catch {
    throw new SubmitError("이미지를 읽을 수 없습니다. JPG/PNG/HEIC 사진을 올려 주세요.");
  }

  // 1) 같은 사진이 이미 접수(approved/review)돼 있는지. 반려됐던 사진은 다시 판정한다(기록은 남김).
  const pre = await probeDuplicates({ sha256: img.sha256, approvalNo: null, storeId: null, receiptAt: null, amount: null, sinceForHashes: new Date(now.getTime() - Math.max(rules.receiptValidHours, 24) * 2 * 3600 * 1000) });
  const exactImage = Boolean(pre.exact);
  const todayCount = await countMemberReceiptsToday(member.id, now);

  // 2) 인식
  let ocr: ReceiptOcr | null = null;
  let ocrFailure: "unavailable" | "error" | null = null;
  if (!exactImage && rules.eventActive && todayCount < rules.dailyLimitPerMember) {
    try {
      ocr = await recognizeReceipt(img.buffer, now);
    } catch (e) {
      ocrFailure = e instanceof OcrUnavailableError ? "unavailable" : "error";
      if (!(e instanceof OcrUnavailableError) && !(e instanceof OcrRefusedError)) console.error("[receipt] OCR error", e);
    }
  }

  // 3) 매장 매칭 + 중복 조회
  const match = ocr ? matchStore(ocr) : { storeId: null, score: 0, evidence: [] as string[] };
  const approvalNo = ocr?.approval_number?.replace(/\s/g, "") || null;
  const paidAt = ocr ? (await import("./ocr")).parsePaidAt(ocr.paid_at) : null;
  const probe = await probeDuplicates({ sha256: img.sha256, approvalNo, storeId: match.storeId, receiptAt: paidAt, amount: ocr?.total_amount ?? null, sinceForHashes: pre.recentHashes.length ? new Date(0) : new Date(0) });
  const similar = pre.recentHashes.some((h) => hammingDistance(h.dhash, img.dhash) <= rules.similarHashThreshold);
  const dedup: DedupFlags = { exactImage, similarImage: similar, sameApproval: probe.approvalHit, sameFingerprint: probe.fingerprintHit };

  // 4) 판정
  let decision = decide({ now, rules, ocr, ocrFailure, matchedStore: match.storeId, dedup, todayCount });

  // 5) 저장 (+ 승인 시 누적 반영). 동시 업로드 경쟁으로 유니크 제약에 걸리면 중복으로 판정해 다시 저장.
  const persist = () => tx(async (q) => {
    const id = await insertReceipt(q, {
      memberId: member.id,
      storeId: decision.storeId,
      status: decision.status,
      reasons: decision.reasons,
      image: img.buffer,
      imageMime: img.mime,
      sha256: img.sha256,
      dhash: img.dhash,
      ocr: ocr ? { ...ocr, _match: match } : null,
      receiptAt: decision.receiptAt,
      amount: decision.amount,
      approvalNo: decision.approvalNo,
      cardLast4: decision.cardLast4,
    });
    if (decision.status === "approved") {
      const total = member.totalSpend + (decision.amount ?? 0);
      await applyApprovedSpend(q, { memberId: member.id, storeId: decision.storeId, receiptId: id, amount: decision.amount, tierKey: tierFor(total, rules).key });
    }
    return id;
  });
  let receiptId: string;
  try {
    receiptId = await persist();
  } catch (e) {
    const err = e as { code?: string; constraint?: string };
    if (err?.code !== "23505") throw e;
    const code: ReasonCode = err.constraint === "receipts_approval_live_uq" ? "DUPLICATE_RECEIPT" : "DUPLICATE_IMAGE";
    decision = { ...decision, status: "rejected", reasons: [code] };
    receiptId = await persist();
  }

  const receipt = (await getReceipt(receiptId))!;
  return {
    receipt,
    giftStoreIds: decision.status === "approved" && decision.storeId ? giftStoresFor(decision.storeId).map((s) => s.id) : [],
    read: ocr
      ? { merchant: ocr.merchant_name, paidAt: ocr.paid_at, amount: ocr.total_amount, approvalNo: ocr.approval_number, items: ocr.items.slice(0, 12) }
      : null,
  };
}

/** 관리자 판정: review → approved/rejected. 승인 시 누적 반영. */
export async function adminDecideReceipt(p: { receiptId: string; approve: boolean; adminId: string; note: string | null; storeId?: string | null; amount?: number | null; receiptAt?: Date | null }): Promise<Receipt> {
  const rules = await getRules();
  const r = await getReceipt(p.receiptId);
  if (!r) throw new SubmitError("영수증을 찾을 수 없습니다.", 404);
  if (r.status === "approved") throw new SubmitError("이미 승인된 영수증입니다.");
  const member = await getMember(r.memberId);
  if (!member) throw new SubmitError("회원을 찾을 수 없습니다.", 404);
  const storeId = (p.storeId ?? r.storeId) as Receipt["storeId"];
  if (p.approve && !storeId) throw new SubmitError("승인하려면 매장을 지정해야 합니다.");
  const amount = p.amount ?? r.amount;
  const reasons: ReasonCode[] = [p.approve ? "MANUAL_APPROVED" : "MANUAL_REJECTED"];
  await tx(async (q) => {
    const { setReceiptDecision } = await import("../db/queries");
    await setReceiptDecision(q, { id: r.id, status: p.approve ? "approved" : "rejected", reasons, reviewedBy: p.adminId, note: p.note, storeId, amount, receiptAt: p.receiptAt ?? null });
    if (p.approve) {
      const total = member.totalSpend + (amount ?? 0);
      await applyApprovedSpend(q, { memberId: member.id, storeId, receiptId: r.id, amount, tierKey: tierFor(total, rules).key });
    }
  });
  return (await getReceipt(r.id))!;
}
