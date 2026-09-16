/**
 * 관리자 화면 시연 데이터 — 회원 여러 명, 매장별 승인/대기/반려 영수증(최근 14일에 분산), 쿠폰(사용 가능/사용/만료/취소), 직원 계정.
 * 파일 DB 를 쓰는 dev 서버를 잠시 내린 뒤 같은 PGLITE_DIR 로 실행한다 (PGlite 파일 DB 는 한 프로세스만 연다).
 *   PGLITE_DIR=/path/to/pg ADMIN_INITIAL_PASSWORD=Seomyeon2026owner npx tsx scripts/demo-admin.ts
 * 결과로 화면 확인에 쓸 id 를 JSON 으로 출력한다.
 */
import { createHash } from "node:crypto";
import sharp from "sharp";
import { getDb, query, tx } from "../src/lib/db";
import { applyApprovedSpend, audit, createAdmin, findOrCreateMember, getAdmin, insertReceipt, listMenu, updateMemberMemo, upsertMenuItem, type MenuItem } from "../src/lib/db/queries";
import { issueManualCoupons, issueSideCoupon, redeemCoupon, voidCoupon } from "../src/lib/coupons";
import { hashPassword } from "../src/lib/auth/password";
import { getRules } from "../src/lib/settings";
import { STORE_BY_ID, giftStoresFor } from "../src/lib/stores";
import type { StoreId } from "../src/lib/config";
import { computeDHash } from "../src/lib/receipt/image";

const DEMO_GIFTS: Record<StoreId, { name: string; price: number; description: string }[]> = {
  joseon: [
    { name: "김치전", price: 12000, description: "묵은지로 부친 전. 통막걸리와 같이 나가는 기본 안주." },
    { name: "두부김치", price: 13000, description: "따뜻한 두부와 볶은 김치." },
    { name: "계란말이", price: 9000, description: "두툼하게 말아 썰어 내는 계란말이." },
  ],
  tokyo: [
    { name: "오이사라다", price: 5900, description: "얇게 썬 오이에 참깨 드레싱." },
    { name: "에다마메", price: 4900, description: "소금 뿌린 삶은 풋콩." },
    { name: "타코와사비", price: 6900, description: "문어 와사비 절임. 하이볼과." },
  ],
  wareureu: [
    { name: "계란찜", price: 7000, description: "뚝배기에 부풀린 계란찜." },
    { name: "소시지 야채볶음", price: 11000, description: "소주 안주의 기본." },
    { name: "골뱅이무침", price: 12000, description: "새콤한 골뱅이무침, 소면 곁들임." },
  ],
};

const H = 3600 * 1000;
const ago = (h: number) => new Date(Date.now() - h * H);
function kst(d: Date): string {
  const k = new Date(d.getTime() + 9 * H);
  const p = (n: number) => String(n).padStart(2, "0");
  return `${k.getUTCFullYear()}-${p(k.getUTCMonth() + 1)}-${p(k.getUTCDate())} ${p(k.getUTCHours())}:${p(k.getUTCMinutes())}`;
}

async function receiptImage(lines: string[], seed: string): Promise<{ buf: Buffer; sha: string; dhash: string }> {
  const esc = (t: string) => t.replace(/&/g, "&amp;").replace(/</g, "&lt;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="${160 + lines.length * 46}">
    <rect width="100%" height="100%" fill="#fbf8f1"/>
    <text x="36" y="70" font-family="WenQuanYi Zen Hei" font-size="22" fill="#8a8178">${esc(seed)}</text>
    ${lines.map((l, i) => `<text x="36" y="${120 + i * 46}" font-family="WenQuanYi Zen Hei Mono, monospace" font-size="27" fill="#1a1714">${esc(l)}</text>`).join("")}
  </svg>`;
  const buf = await sharp(Buffer.from(svg)).jpeg({ quality: 80 }).toBuffer();
  return { buf, sha: createHash("sha256").update(buf).digest("hex"), dhash: await computeDHash(buf) };
}

function slipLines(storeId: StoreId, amount: number, at: Date, approval: string, items: { name: string; amount: number }[]): string[] {
  const s = STORE_BY_ID[storeId];
  return [
    s.name,
    s.address || "부산 부산진구 서면",
    "------------------------------",
    ...items.map((it) => `${it.name.padEnd(12, " ")} ${it.amount.toLocaleString("ko-KR").padStart(9, " ")}`),
    "------------------------------",
    `합    계   ${amount.toLocaleString("ko-KR")}원`,
    `거래일시   ${kst(at)}`,
    `승인번호   ${approval}`,
    "카드번호   ****-****-****-1188",
    "감사합니다",
  ];
}

async function ensureGifts(storeId: StoreId): Promise<MenuItem[]> {
  let items = await listMenu(storeId, { giftOnly: true });
  if (items.length) return items;
  let sort = (await listMenu(storeId, { includeInactive: true })).length;
  for (const g of DEMO_GIFTS[storeId]) await upsertMenuItem({ storeId, name: g.name, price: g.price, description: g.description, isGift: true, active: true, sort: sort++ });
  items = await listMenu(storeId, { giftOnly: true });
  console.error(`[demo] ${storeId}: 무료 사이드 후보가 없어 시연용 메뉴 ${items.length}개를 넣었습니다.`);
  return items;
}

type ApprovedOpts = { memberId: string; storeId: StoreId; amount: number; at: Date; approval: string; items?: { name: string; amount: number }[]; createdHoursAfter?: number };
async function approved(o: ApprovedOpts): Promise<string> {
  const items = o.items ?? [{ name: "주문", amount: o.amount }];
  const img = await receiptImage(slipLines(o.storeId, o.amount, o.at, o.approval, items), `demo ${o.approval}`);
  const rules = await getRules();
  const id = await tx(async (q) => {
    const id = await insertReceipt(q, {
      memberId: o.memberId, storeId: o.storeId, status: "approved", reasons: [], image: img.buf, imageMime: "image/jpeg", sha256: img.sha, dhash: img.dhash,
      ocr: {
        is_receipt: true, document_type: "card_slip", merchant_name: STORE_BY_ID[o.storeId].name, business_number: null, merchant_phone: null, merchant_address: STORE_BY_ID[o.storeId].address || null,
        paid_at: kst(o.at).replace(" ", "T") + ":00", total_amount: o.amount, approval_number: o.approval, card_last4: "1188", payment_method: "card",
        items: items.map((it) => ({ name: it.name, qty: 1, amount: it.amount })), matched_store: o.storeId, is_reprint: false, looks_like_screen_photo: false, is_cancellation: false, suspicious_text: false, quality_notes: [],
        confidence: { merchant: 0.97, paid_at: 0.93, total_amount: 0.95, approval_number: 0.9 },
        raw_text: slipLines(o.storeId, o.amount, o.at, o.approval, items).join("\n"),
        _match: { storeId: o.storeId, score: 70, evidence: ["상호 일치", "모델 판단 일치"] },
      },
      receiptAt: o.at, amount: o.amount, approvalNo: o.approval, cardLast4: "1188",
    });
    await applyApprovedSpend(q, { memberId: o.memberId, storeId: o.storeId, receiptId: id, amount: o.amount, rules });
    return id;
  });
  const created = new Date(o.at.getTime() + (o.createdHoursAfter ?? 0.3) * H);
  await query(`update receipts set created_at=$2 where id=$1`, [id, created.toISOString()]);
  await query(`update spend_ledger set at=$2 where receipt_id=$1`, [id, created.toISOString()]);
  return id;
}

async function main() {
  await getDb();
  const marker = await query<{ n: number }>(`select count(*)::int as n from members where memo like '[demo]%'`);
  if ((marker[0]?.n ?? 0) > 0) console.error("[demo] 이미 시연 데이터가 있습니다. 초기화하려면 PGLITE_DIR 폴더를 지우고 다시 실행하십시오.");

  const gifts = { joseon: await ensureGifts("joseon"), tokyo: await ensureGifts("tokyo"), wareureu: await ensureGifts("wareureu") };
  const gift = (receiptStore: StoreId, i: number): MenuItem => {
    const target = giftStoresFor(receiptStore)[i % 2]!.id;
    const item = gifts[target][i % gifts[target].length];
    if (!item) throw new Error(`${target} 에 무료 사이드가 없습니다`);
    return item;
  };

  // 직원 계정
  if (!(await getAdmin("tokyo1"))) await createAdmin({ id: "tokyo1", name: "김민지", storeId: "tokyo", role: "staff", pwHash: await hashPassword("staff1234") });
  if (!(await getAdmin("joseon1"))) await createAdmin({ id: "joseon1", name: "박준호", storeId: "joseon", role: "staff", pwHash: await hashPassword("staff1234") });
  if (!(await getAdmin("wareureu1"))) {
    await createAdmin({ id: "wareureu1", name: "이서연", storeId: "wareureu", role: "staff", pwHash: await hashPassword("staff1234") });
    await query(`update admins set active=false where id='wareureu1'`);
  }

  // 회원들 (번호, 가입 며칠 전)
  const phones: [string, number][] = [
    ["01012345678", 40], ["01023456789", 33], ["01034567890", 30], ["01045678901", 21], ["01056789012", 14],
    ["01067890123", 12], ["01078901234", 9], ["01089012345", 6], ["01090123456", 3], ["01011112222", 1], ["01033334444", 0.5],
  ];
  const members: Record<string, string> = {};
  for (const [phone, days] of phones) {
    const m = await findOrCreateMember(phone);
    members[phone] = m.id;
    await query(`update members set created_at=$2, last_login_at=$3 where id=$1`, [m.id, ago(days * 24).toISOString(), ago(Math.random() * days * 24).toISOString()]);
  }
  await updateMemberMemo(members["01012345678"]!, "[demo] 단체 예약 자주 함. 영수증 분쟁 없음.");
  await updateMemberMemo(members["01023456789"]!, "[demo] 지난달 같은 영수증 두 번 올려 안내함.");

  let seq = 30100000;
  const ap = () => String(seq++);
  const stores: StoreId[] = ["joseon", "tokyo", "wareureu"];
  const menusFor: Record<StoreId, { name: string; amount: number }[]> = {
    joseon: [{ name: "바지락칼국수", amount: 9000 }, { name: "통막걸리", amount: 12000 }, { name: "김치전", amount: 12000 }],
    tokyo: [{ name: "하이볼", amount: 7000 }, { name: "생맥주", amount: 5500 }, { name: "가라아게", amount: 12000 }],
    wareureu: [{ name: "참이슬", amount: 5000 }, { name: "소시지 야채볶음", amount: 11000 }, { name: "골뱅이무침", amount: 12000 }],
  };

  // 승인 영수증: 14일에 걸쳐 분산, 일부는 쿠폰 발급/사용
  const out: Record<string, string> = {};
  let usedCount = 0;
  let k = 0;
  for (const [phone, days] of phones) {
    const memberId = members[phone]!;
    const n = Math.max(1, Math.min(6, Math.round(days / 5) + 1));
    for (let i = 0; i < n; i++) {
      const storeId = stores[(k + i) % 3]!;
      const hoursAgo = Math.min(days * 24 - 1, 4 + Math.floor(((k * 7 + i * 31) % 13) * 24 + ((k + i) % 5) * 3));
      const at = ago(Math.max(2, hoursAgo));
      const picks = menusFor[storeId];
      const chosen = [picks[0]!, picks[(i + 1) % picks.length]!, ...(i % 2 ? [picks[2]!] : [])];
      const amount = chosen.reduce((a, b) => a + b.amount, 0) * (1 + (i % 2));
      const rid = await approved({ memberId, storeId, amount, at, approval: ap(), items: chosen.map((c) => ({ ...c, amount: c.amount * (1 + (i % 2)) })) });
      if (i === 0) out[`approvedPickable_${phone}`] = rid;
      if (i % 3 !== 0) {
        const item = gift(storeId, k + i);
        const c = await issueSideCoupon({ memberId, receiptId: rid, menuItemId: item.id });
        await query(`update coupons set issued_at=$2 where id=$1`, [c.id, new Date(at.getTime() + 0.5 * H).toISOString()]);
        if ((k + i) % 2 === 0) {
          const via = (k + i) % 4 === 0 ? { memberId } : { adminId: "tokyo1", storeId: null as StoreId | null };
          if ("adminId" in via && item.storeId !== "tokyo") via.storeId = null;
          await redeemCoupon({ couponId: c.id, by: via });
          await query(`update coupons set used_at=$2 where id=$1`, [c.id, new Date(at.getTime() + ((k + i) % 3) * 24 * H + 2 * H).toISOString()]);
          usedCount++;
        } else if (i === 1) {
          out[`activeCoupon_${phone}`] = c.code;
        }
      }
    }
    k++;
  }

  // 확인 대기 3건 — 신뢰도 낮음(읽은 값 풍부), 자동 인식 불가, 상호 못 읽음
  const m1 = members["01034567890"]!;
  const at1 = ago(1.5);
  const items1 = [{ name: "하이볼", amount: 14000 }, { name: "가라아게", amount: 12000 }, { name: "오이사라다", amount: 5900 }, { name: "생맥주", amount: 11000 }];
  const lines1 = slipLines("tokyo", 42900, at1, "30177421", items1);
  const img1 = await receiptImage(lines1, "demo review-1 (금액 줄 접힘)");
  const r1 = await tx((q) =>
    insertReceipt(q, {
      memberId: m1, storeId: "tokyo", status: "review", reasons: ["LOW_CONFIDENCE"], image: img1.buf, imageMime: "image/jpeg", sha256: img1.sha, dhash: img1.dhash,
      ocr: {
        is_receipt: true, document_type: "card_slip", merchant_name: "도쿄스탠드 서면점", business_number: "6078812345", merchant_phone: "0518021234", merchant_address: "부산 부산진구 서면로68번길",
        paid_at: kst(at1).replace(" ", "T") + ":00", total_amount: 42900, approval_number: "30177421", card_last4: "1188", payment_method: "card",
        items: items1.map((it) => ({ name: it.name, qty: 1, amount: it.amount })), matched_store: "tokyo", is_reprint: false, looks_like_screen_photo: false, is_cancellation: false, suspicious_text: false,
        quality_notes: ["합계 줄이 접혀 일부 흐림", "오른쪽 위 빛 반사"],
        confidence: { merchant: 0.94, paid_at: 0.52, total_amount: 0.48, approval_number: 0.9 },
        raw_text: lines1.join("\n"),
        _match: { storeId: "tokyo", score: 70, evidence: ["상호 일치", "모델 판단 일치"] },
      },
      receiptAt: at1, amount: 42900, approvalNo: "30177421", cardLast4: "1188",
    }),
  );
  out.reviewLowConfidence = r1;

  const img2 = await receiptImage(["(사진이 어두워 읽지 못함)", "", "", ""], "demo review-2");
  const r2 = await tx((q) =>
    insertReceipt(q, {
      memberId: members["01078901234"]!, storeId: null, status: "review", reasons: ["OCR_UNAVAILABLE"], image: img2.buf, imageMime: "image/jpeg", sha256: img2.sha, dhash: img2.dhash,
      ocr: null, receiptAt: null, amount: null, approvalNo: null, cardLast4: null,
    }),
  );
  await query(`update receipts set created_at=$2 where id=$1`, [r2, ago(0.4).toISOString()]);
  out.reviewNoOcr = r2;

  const at3 = ago(5);
  const lines3 = ["(상호 부분 잘림)", "부산 부산진구 동천로85번길 14", "------------------------------", "합    계   28,000원", `거래일시   ${kst(at3)}`, "승인번호   30177999"];
  const img3 = await receiptImage(lines3, "demo review-3");
  const r3 = await tx((q) =>
    insertReceipt(q, {
      memberId: members["01011112222"]!, storeId: null, status: "review", reasons: ["STORE_UNKNOWN"], image: img3.buf, imageMime: "image/jpeg", sha256: img3.sha, dhash: img3.dhash,
      ocr: {
        is_receipt: true, document_type: "card_slip", merchant_name: null, business_number: null, merchant_phone: null, merchant_address: "부산 부산진구 동천로85번길 14",
        paid_at: kst(at3).replace(" ", "T") + ":00", total_amount: 28000, approval_number: "30177999", card_last4: null, payment_method: "card", items: [],
        matched_store: "none", is_reprint: false, looks_like_screen_photo: false, is_cancellation: false, suspicious_text: false, quality_notes: ["상단이 잘려 상호가 보이지 않음"],
        confidence: { merchant: 0.1, paid_at: 0.9, total_amount: 0.92, approval_number: 0.88 }, raw_text: lines3.join("\n"),
        _match: { storeId: null, score: 25, evidence: ["주소 키워드 '동천로85번길'"] },
      },
      receiptAt: at3, amount: 28000, approvalNo: "30177999", cardLast4: null,
    }),
  );
  await query(`update receipts set created_at=$2 where id=$1`, [r3, ago(4.5).toISOString()]);
  out.reviewStoreUnknown = r3;

  // 반려 3건
  const rejects: [string, StoreId, string[], number, number][] = [
    ["01045678901", "joseon", ["EXPIRED"], 25000, 50],
    ["01056789012", "wareureu", ["SCREEN_PHOTO"], 31000, 20],
    ["01023456789", "tokyo", ["DUPLICATE_RECEIPT"], 18000, 70],
  ];
  for (const [phone, storeId, reasons, amount, h] of rejects) {
    const at = ago(h);
    const img = await receiptImage(slipLines(storeId, amount, at, ap(), [{ name: "주문", amount }]), `demo rejected ${reasons[0]}`);
    const id = await tx((q) =>
      insertReceipt(q, {
        memberId: members[phone]!, storeId, status: "rejected", reasons, image: img.buf, imageMime: "image/jpeg", sha256: img.sha, dhash: img.dhash,
        ocr: null, receiptAt: at, amount, approvalNo: null, cardLast4: "1188",
      }),
    );
    await query(`update receipts set created_at=$2 where id=$1`, [id, new Date(at.getTime() + 0.5 * H).toISOString()]);
    out[`rejected_${reasons[0]}`] = id;
  }

  // 관리자 판정 기록이 있는 반려 1건
  const at4 = ago(30);
  const img4 = await receiptImage(slipLines("joseon", 15000, at4, "30170001", [{ name: "바지락칼국수", amount: 9000 }, { name: "공기밥", amount: 1000 }]), "demo manual-rejected");
  const r4 = await tx((q) =>
    insertReceipt(q, {
      memberId: members["01067890123"]!, storeId: "joseon", status: "rejected", reasons: ["MANUAL_REJECTED"], image: img4.buf, imageMime: "image/jpeg", sha256: img4.sha, dhash: img4.dhash,
      ocr: null, receiptAt: at4, amount: 15000, approvalNo: "30170001", cardLast4: "1188",
    }),
  );
  await query(`update receipts set created_at=$2, reviewed_at=$3, reviewed_by='owner', review_note='다른 동네 지점 영수증(해운대점)' where id=$1`, [r4, new Date(at4.getTime() + 0.5 * H).toISOString(), new Date(at4.getTime() + 3 * H).toISOString()]);

  // 수동/등급 쿠폰: 만료 1, 취소 1, 등급 혜택 몇 장
  await issueManualCoupons({ adminId: "owner", target: { memberId: members["01012345678"]! }, useStoreId: "joseon", menuItemId: gifts.joseon[0]?.id ?? null, menuName: gifts.joseon[0]?.name ?? "사이드 한 접시", validDays: 1, note: "오픈 기념", kind: "manual" });
  const exp = await query<{ id: string }>(`select id from coupons where member_id=$1 and kind='manual' order by issued_at desc limit 1`, [members["01012345678"]]);
  await query(`update coupons set issued_at=$2, expires_at=$3 where id=$1`, [exp[0]!.id, ago(24 * 20).toISOString(), ago(24 * 19).toISOString()]);
  await issueManualCoupons({ adminId: "owner", target: { memberId: members["01034567890"]! }, useStoreId: "wareureu", menuItemId: null, menuName: "사이드 한 접시", validDays: 7, note: null, kind: "manual" });
  const vd = await query<{ id: string }>(`select id from coupons where member_id=$1 and kind='manual' and status='active' order by issued_at desc limit 1`, [members["01034567890"]]);
  await voidCoupon({ couponId: vd[0]!.id, adminId: "owner", note: "직원 착오로 이중 발급" });
  const rules = await getRules();
  const topTier = rules.tiers[rules.tiers.length - 1]!;
  const n = await issueManualCoupons({ adminId: "owner", target: { tierKey: rules.tiers[0]!.key }, useStoreId: "tokyo", menuItemId: gifts.tokyo[1]?.id ?? null, menuName: gifts.tokyo[1]?.name ?? "사이드 한 접시", validDays: 14, note: "추석 감사", kind: "vip" });

  await audit("owner", "admin.login", null, { ip: "127.0.0.1" });
  await audit("tokyo1", "admin.login", null, { ip: "10.0.0.12" });

  const active = await query<{ code: string }>(`select code from coupons where status='active' and expires_at > now() order by issued_at desc limit 1`);
  const used = await query<{ code: string }>(`select code from coupons where status='used' order by used_at desc limit 1`);
  console.log(JSON.stringify({ ...out, members, staff: { tokyo1: "staff1234", joseon1: "staff1234" }, activeCode: active[0]?.code, usedCode: used[0]?.code, usedCount, tierCouponsIssued: n, topTier: topTier.name }, null, 2));
}

main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
