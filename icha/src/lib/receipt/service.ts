/**
 * 영수증 접수 파이프라인: 표준화 → 중복 조회 → 인식 → 매장 매칭 → 판정 → 저장(+누적 반영).
 *
 * 비용·남용 방어(인식 호출 한 번이 곧 비용이다):
 *  - 회원당 업로드 속도 제한(12회/10분) + 하루 인증 한도(승인·대기) + 하루 시도 한도(반려 포함)
 *  - 사이트 전체 하루 OCR 상한(rules.dailyOcrLimit). 넘으면 인식 없이 직원 확인으로 접수
 *  - IP 단위 제한은 API 라우트(/api/receipts)에서
 *  - 한도 검사는 저장 트랜잭션 안에서 회원 단위 advisory lock 을 잡고 다시 센다 (동시 업로드로 한도 초과 방지)
 */
import type { ReasonCode } from "../config";
import { tx } from "../db";
import { applyApprovedSpend, countMemberReceiptsToday, getMember, insertReceipt, isUuid, probeDuplicates, kstDayStart, setReceiptDecision, type Receipt, getReceipt } from "../db/queries";
import { rateLimit } from "../rate-limit";
import { getRules } from "../settings";
import { giftStoresFor, getStore } from "../stores";
import { hammingDistance, normalizeImage } from "./image";
import { matchStore } from "./match";
import { OcrRefusedError, OcrUnavailableError, parsePaidAt, recognizeReceipt, type ReceiptOcr } from "./ocr";
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

/** 오늘(KST) 날짜 키 — 전체 OCR 상한의 윈도 키 */
function kstDayKey(now: Date): string {
  return kstDayStart(now).toISOString().slice(0, 10);
}

export async function submitReceipt(p: { memberId: string; file: Buffer; now?: Date }): Promise<SubmitResult> {
  const now = p.now ?? new Date();
  const member = await getMember(p.memberId);
  if (!member) throw new SubmitError("로그인이 필요합니다.", 401);
  if (!(await rateLimit(`upload:${member.id}`, 12, 600))) throw new SubmitError("요청이 너무 많습니다. 잠시 후 다시 시도해 주십시오.", 429);

  const rules = await getRules();
  let img;
  try {
    img = await normalizeImage(p.file);
  } catch {
    throw new SubmitError("이미지를 읽을 수 없습니다. JPG 또는 PNG 사진을 올려 주세요.");
  }

  // 1) 같은 사진이 이미 접수(approved/review)돼 있는지. 반려됐던 사진은 다시 판정한다(기록은 남김).
  const pre = await probeDuplicates({ sha256: img.sha256, approvalNo: null, storeId: null, receiptAt: null, amount: null, sinceForHashes: new Date(now.getTime() - Math.max(rules.receiptValidHours, 24) * 2 * 3600 * 1000) });
  const exactImage = Boolean(pre.exact);
  const [todayCount, todayAttempts] = await Promise.all([countMemberReceiptsToday(member.id, now), countMemberReceiptsToday(member.id, now, { all: true })]);
  const underLimit = todayCount < rules.dailyLimitPerMember && (rules.dailyAttemptLimit <= 0 || todayAttempts < rules.dailyAttemptLimit);

  // 2) 인식 — 한도 안이고 이벤트 중일 때만 호출한다. 전체 하루 상한을 넘으면 호출하지 않고 직원 확인으로.
  let ocr: ReceiptOcr | null = null;
  let ocrFailure: "unavailable" | "error" | null = null;
  if (!exactImage && rules.eventActive && underLimit) {
    const budgetOk = rules.dailyOcrLimit <= 0 || (await rateLimit(`ocr-global:${kstDayKey(now)}`, rules.dailyOcrLimit, 86400));
    if (!budgetOk) {
      ocrFailure = "unavailable";
      console.warn("[receipt] daily OCR limit reached", rules.dailyOcrLimit);
    } else {
      try {
        ocr = await recognizeReceipt(img.buffer, now);
      } catch (e) {
        ocrFailure = e instanceof OcrUnavailableError ? "unavailable" : "error";
        if (!(e instanceof OcrUnavailableError) && !(e instanceof OcrRefusedError)) console.error("[receipt] OCR error", e);
      }
    }
  }

  // 3) 매장 매칭 + 중복 조회 (해시 목록은 1차 조회 것을 재사용)
  const match = ocr ? matchStore(ocr) : { storeId: null, score: 0, evidence: [] as string[] };
  const approvalNo = ocr?.approval_number?.replace(/\s/g, "") || null;
  const paidAt = ocr ? parsePaidAt(ocr.paid_at) : null;
  const probe = await probeDuplicates({ sha256: img.sha256, approvalNo, storeId: match.storeId, receiptAt: paidAt, amount: ocr?.total_amount ?? null, sinceForHashes: now, withHashes: false });
  const similar = pre.recentHashes.some((h) => hammingDistance(h.dhash, img.dhash) <= rules.similarHashThreshold);
  const dedup: DedupFlags = { exactImage, similarImage: similar, sameApproval: probe.approvalHit, sameFingerprint: probe.fingerprintHit };

  // 4) 판정
  let decision = decide({ now, rules, ocr, ocrFailure, matchedStore: match.storeId, dedup, todayCount, todayAttempts });

  // 5) 저장 (+ 승인 시 누적 반영). 회원 단위 잠금 안에서 한도를 다시 센다. 동시 업로드 경쟁으로 유니크 제약에 걸리면 중복으로 판정해 다시 저장.
  const persist = () => tx(async (q) => {
    await q.query(`select pg_advisory_xact_lock(hashtext($1))`, [member.id]);
    if (decision.status !== "rejected") {
      const [n, all] = await Promise.all([countMemberReceiptsToday(member.id, now, { q }), countMemberReceiptsToday(member.id, now, { all: true, q })]);
      if (n >= rules.dailyLimitPerMember || (rules.dailyAttemptLimit > 0 && all >= rules.dailyAttemptLimit)) {
        decision = { ...decision, status: "rejected", reasons: ["DAILY_LIMIT"] };
      }
    }
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
      await applyApprovedSpend(q, { memberId: member.id, storeId: decision.storeId, receiptId: id, amount: decision.amount, rules });
    }
    return id;
  });
  let receiptId: string;
  try {
    receiptId = await persist();
  } catch (e) {
    const err = e as { code?: string; constraint?: string };
    if (err?.code !== "23505") throw e;
    const code: ReasonCode = err.constraint === "receipts_approval_store_live_uq" ? "DUPLICATE_RECEIPT" : "DUPLICATE_IMAGE";
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

type LockedReceiptRow = { id: string; status: Receipt["status"]; member_id: string; store_id: string | null; amount: number | null; sha256: string; approval_no: string | null; receipt_at: unknown };

/**
 * 관리자 판정: review/rejected → approved/rejected. 승인 시 누적 반영.
 * 한 트랜잭션에서 영수증 행을 `for update` 로 잠근 뒤 상태를 확인하고 조건부 update 하므로, 두 직원이 동시에 승인해도 한 번만 반영된다.
 * 승인 전에 같은 사진·같은 승인번호의 살아 있는 영수증이 있는지 확인해 사람이 읽을 수 있는 메시지로 막는다.
 */
export async function adminDecideReceipt(p: {
  receiptId: string;
  approve: boolean;
  adminId: string;
  note: string | null;
  storeId?: string | null;
  amount?: number | null;
  receiptAt?: Date | null;
  /** 직원 계정이면 자기 매장 id — 다른 매장 영수증은 처리 불가, 매장 변경 불가 */
  restrictToStore?: string | null;
}): Promise<Receipt> {
  if (!isUuid(p.receiptId)) throw new SubmitError("영수증을 찾을 수 없습니다.", 404);
  const rules = await getRules();
  const reasons: ReasonCode[] = [p.approve ? "MANUAL_APPROVED" : "MANUAL_REJECTED"];
  try {
    await tx(async (q) => {
      const locked = (await q.query<LockedReceiptRow>(`select id, status, member_id, store_id, amount, sha256, approval_no, receipt_at from receipts where id=$1 for update`, [p.receiptId]))[0];
      if (!locked) throw new SubmitError("영수증을 찾을 수 없습니다.", 404);
      if (locked.status === "approved") throw new SubmitError("이미 승인된 영수증입니다.");
      if (p.restrictToStore) {
        if (locked.store_id && locked.store_id !== p.restrictToStore) throw new SubmitError(`${getStore(locked.store_id)?.shortName ?? "다른 매장"} 영수증은 그 매장 직원이나 총괄 관리자가 처리합니다.`, 403);
        if (p.storeId && p.storeId !== p.restrictToStore) throw new SubmitError("직원 계정은 매장을 바꿀 수 없습니다. 총괄 관리자에게 넘겨 주세요.", 403);
      }
      const storeId = (p.storeId ?? locked.store_id) as Receipt["storeId"];
      if (p.approve && !storeId) throw new SubmitError("승인하려면 매장을 지정해야 합니다.");
      const amount = p.amount ?? (locked.amount == null ? null : Number(locked.amount));
      if (p.approve) {
        // 같은 사진 / 같은 매장의 같은 승인번호가 살아 있으면 승인할 수 없다 (유니크 인덱스에 걸리기 전에 사람이 읽을 메시지로)
        const probe = await probeDuplicates({ sha256: locked.sha256, approvalNo: locked.approval_no, storeId, receiptAt: null, amount: null, sinceForHashes: new Date(), withHashes: false, excludeId: locked.id, q });
        if (probe.exact) throw new SubmitError(`같은 사진의 영수증이 이미 접수돼 있습니다 (${probe.exact.id.slice(0, 8)}, ${probe.exact.status === "approved" ? "승인됨" : "확인 대기"}). 그 건을 처리하세요.`);
        if (probe.approvalHit) throw new SubmitError(`같은 승인번호(${locked.approval_no})의 영수증이 이미 접수돼 있습니다. 이 건은 반려하세요.`);
      }
      const ok = await setReceiptDecision(q, { id: locked.id, status: p.approve ? "approved" : "rejected", reasons, reviewedBy: p.adminId, note: p.note, storeId, amount, receiptAt: p.receiptAt ?? null });
      if (!ok) throw new SubmitError("이미 승인된 영수증입니다.");
      if (p.approve) {
        await applyApprovedSpend(q, { memberId: locked.member_id, storeId, receiptId: locked.id, amount, rules });
      }
    });
  } catch (e) {
    const err = e as { code?: string; constraint?: string };
    if (err?.code === "23505") {
      throw new SubmitError(err.constraint === "receipts_approval_store_live_uq" ? "같은 승인번호의 영수증이 이미 접수돼 있어 승인할 수 없습니다." : "같은 사진의 영수증이 이미 접수돼 있어 승인할 수 없습니다.");
    }
    throw e;
  }
  return (await getReceipt(p.receiptId))!;
}
