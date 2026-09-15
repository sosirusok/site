/**
 * 타입이 붙은 데이터 접근 함수 모음. 화면/API 는 SQL 대신 이 함수들을 쓴다.
 */
import { formatPhone, type StoreId } from "../config";
import { one, query, toBuffer, toDate, type Queryable } from "./index";

/* ───────────────────────── 회원 ───────────────────────── */

export type Member = {
  id: string;
  phone: string;
  createdAt: Date;
  lastLoginAt: Date | null;
  totalSpend: number;
  visitCount: number;
  tier: string;
  memo: string | null;
};

type MemberRow = {
  id: string; phone: string; created_at: unknown; last_login_at: unknown;
  total_spend: number; visit_count: number; tier: string; memo: string | null;
};

const mapMember = (r: MemberRow): Member => ({
  id: r.id,
  phone: r.phone,
  createdAt: toDate(r.created_at) ?? new Date(0),
  lastLoginAt: toDate(r.last_login_at),
  totalSpend: Number(r.total_spend),
  visitCount: Number(r.visit_count),
  tier: r.tier,
  memo: r.memo,
});

export async function findOrCreateMember(phone: string): Promise<Member> {
  const rows = await query<MemberRow>(
    `insert into members (phone, last_login_at) values ($1, now())
     on conflict (phone) do update set last_login_at = now()
     returning *`,
    [phone],
  );
  return mapMember(rows[0]!);
}

export async function getMember(id: string): Promise<Member | null> {
  const r = await one<MemberRow>(`select * from members where id=$1`, [id]);
  return r ? mapMember(r) : null;
}

export async function getMemberByPhone(phone: string): Promise<Member | null> {
  const r = await one<MemberRow>(`select * from members where phone=$1`, [phone]);
  return r ? mapMember(r) : null;
}

export async function listMembers(opts: { q?: string; tier?: string; limit?: number; offset?: number } = {}): Promise<{ items: Member[]; total: number }> {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (opts.q) {
    params.push(`%${opts.q.replace(/\D/g, "")}%`);
    conds.push(`phone like $${params.length}`);
  }
  if (opts.tier) {
    params.push(opts.tier);
    conds.push(`tier = $${params.length}`);
  }
  const where = conds.length ? `where ${conds.join(" and ")}` : "";
  const total = (await one<{ n: number }>(`select count(*)::int as n from members ${where}`, params))?.n ?? 0;
  params.push(opts.limit ?? 50, opts.offset ?? 0);
  const rows = await query<MemberRow>(
    `select * from members ${where} order by total_spend desc, created_at desc limit $${params.length - 1} offset $${params.length}`,
    params,
  );
  return { items: rows.map(mapMember), total };
}

export async function updateMemberMemo(id: string, memo: string | null): Promise<void> {
  await query(`update members set memo=$2 where id=$1`, [id, memo]);
}

/* ───────────────────────── 영수증 ───────────────────────── */

export type ReceiptStatus = "approved" | "review" | "rejected";

export type Receipt = {
  id: string;
  memberId: string;
  memberPhone?: string;
  storeId: StoreId | null;
  status: ReceiptStatus;
  reasons: string[];
  receiptAt: Date | null;
  amount: number | null;
  approvalNo: string | null;
  cardLast4: string | null;
  createdAt: Date;
  reviewedAt: Date | null;
  reviewedBy: string | null;
  reviewNote: string | null;
  couponId: string | null;
  ocr: unknown;
  imageMime: string | null;
};

type ReceiptRow = {
  id: string; member_id: string; member_phone?: string; store_id: string | null; status: ReceiptStatus; reasons: string[] | null;
  receipt_at: unknown; amount: number | null; approval_no: string | null; card_last4: string | null; created_at: unknown;
  reviewed_at: unknown; reviewed_by: string | null; review_note: string | null; coupon_id: string | null; ocr: unknown; image_mime: string | null;
};

const RECEIPT_COLS = `r.id, r.member_id, r.store_id, r.status, r.reasons, r.receipt_at, r.amount, r.approval_no, r.card_last4,
  r.created_at, r.reviewed_at, r.reviewed_by, r.review_note, r.coupon_id, r.ocr, r.image_mime`;

const mapReceipt = (r: ReceiptRow): Receipt => ({
  id: r.id,
  memberId: r.member_id,
  memberPhone: r.member_phone,
  storeId: (r.store_id as StoreId | null) ?? null,
  status: r.status,
  reasons: Array.isArray(r.reasons) ? r.reasons : parsePgArray(r.reasons),
  receiptAt: toDate(r.receipt_at),
  amount: r.amount == null ? null : Number(r.amount),
  approvalNo: r.approval_no,
  cardLast4: r.card_last4,
  createdAt: toDate(r.created_at) ?? new Date(0),
  reviewedAt: toDate(r.reviewed_at),
  reviewedBy: r.reviewed_by,
  reviewNote: r.review_note,
  couponId: r.coupon_id,
  ocr: typeof r.ocr === "string" ? safeJson(r.ocr) : r.ocr,
  imageMime: r.image_mime,
});

function parsePgArray(v: unknown): string[] {
  if (typeof v !== "string") return [];
  return v.replace(/^\{|\}$/g, "").split(",").filter(Boolean).map((s) => s.replace(/^"|"$/g, ""));
}
function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}

export async function getReceipt(id: string): Promise<Receipt | null> {
  const r = await one<ReceiptRow>(`select ${RECEIPT_COLS}, m.phone as member_phone from receipts r join members m on m.id=r.member_id where r.id=$1`, [id]);
  return r ? mapReceipt(r) : null;
}

export async function getReceiptImage(id: string): Promise<{ data: Buffer; mime: string } | null> {
  const r = await one<{ image: unknown; image_mime: string | null }>(`select image, image_mime from receipts where id=$1`, [id]);
  const data = r ? toBuffer(r.image) : null;
  return data ? { data, mime: r!.image_mime ?? "image/jpeg" } : null;
}

export async function listReceiptsForMember(memberId: string, limit = 30): Promise<Receipt[]> {
  const rows = await query<ReceiptRow>(`select ${RECEIPT_COLS} from receipts r where r.member_id=$1 order by r.created_at desc limit $2`, [memberId, limit]);
  return rows.map(mapReceipt);
}

export async function listReceipts(opts: { status?: ReceiptStatus; storeId?: string | null; limit?: number; offset?: number; q?: string } = {}): Promise<{ items: Receipt[]; total: number }> {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (opts.status) { params.push(opts.status); conds.push(`r.status=$${params.length}`); }
  if (opts.storeId) { params.push(opts.storeId); conds.push(`r.store_id=$${params.length}`); }
  if (opts.q) { params.push(`%${opts.q.replace(/\D/g, "")}%`); conds.push(`m.phone like $${params.length}`); }
  const where = conds.length ? `where ${conds.join(" and ")}` : "";
  const total = (await one<{ n: number }>(`select count(*)::int as n from receipts r join members m on m.id=r.member_id ${where}`, params))?.n ?? 0;
  params.push(opts.limit ?? 50, opts.offset ?? 0);
  const rows = await query<ReceiptRow>(
    `select ${RECEIPT_COLS}, m.phone as member_phone from receipts r join members m on m.id=r.member_id ${where}
     order by case r.status when 'review' then 0 else 1 end, r.created_at desc limit $${params.length - 1} offset $${params.length}`,
    params,
  );
  return { items: rows.map(mapReceipt), total };
}

/** 오늘(KST) 회원이 접수한 건수(approved+review) */
export async function countMemberReceiptsToday(memberId: string, now: Date): Promise<number> {
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  const dayStartUtc = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - 9 * 3600 * 1000);
  const r = await one<{ n: number }>(
    `select count(*)::int as n from receipts where member_id=$1 and status in ('approved','review') and created_at >= $2`,
    [memberId, dayStartUtc.toISOString()],
  );
  return r?.n ?? 0;
}

export type DedupProbe = {
  exact: { id: string; status: ReceiptStatus } | null;
  approvalHit: boolean;
  fingerprintHit: boolean;
  recentHashes: { id: string; dhash: string }[];
};

export async function probeDuplicates(p: {
  sha256: string;
  approvalNo: string | null;
  storeId: string | null;
  receiptAt: Date | null;
  amount: number | null;
  sinceForHashes: Date;
}): Promise<DedupProbe> {
  const exact = await one<{ id: string; status: ReceiptStatus }>(`select id, status from receipts where sha256=$1 and status <> 'rejected' order by created_at desc limit 1`, [p.sha256]);
  let approvalHit = false;
  if (p.approvalNo) {
    const r = await one<{ n: number }>(
      `select count(*)::int as n from receipts where approval_no=$1 and status <> 'rejected' and sha256 <> $2`,
      [p.approvalNo, p.sha256],
    );
    approvalHit = (r?.n ?? 0) > 0;
  }
  let fingerprintHit = false;
  if (p.storeId && p.receiptAt && p.amount != null) {
    const r = await one<{ n: number }>(
      `select count(*)::int as n from receipts where store_id=$1 and receipt_at=$2 and amount=$3 and status <> 'rejected' and sha256 <> $4`,
      [p.storeId, p.receiptAt.toISOString(), p.amount, p.sha256],
    );
    fingerprintHit = (r?.n ?? 0) > 0;
  }
  const recentHashes = await query<{ id: string; dhash: string }>(
    `select id, dhash from receipts where dhash is not null and status <> 'rejected' and created_at >= $1 and sha256 <> $2 limit 2000`,
    [p.sinceForHashes.toISOString(), p.sha256],
  );
  return { exact, approvalHit, fingerprintHit, recentHashes };
}

export async function deleteReceipt(id: string): Promise<void> {
  await query(`delete from spend_ledger where receipt_id=$1`, [id]);
  await query(`delete from receipts where id=$1`, [id]);
}

export type NewReceipt = {
  memberId: string;
  storeId: StoreId | null;
  status: ReceiptStatus;
  reasons: string[];
  image: Buffer;
  imageMime: string;
  sha256: string;
  dhash: string;
  ocr: unknown;
  receiptAt: Date | null;
  amount: number | null;
  approvalNo: string | null;
  cardLast4: string | null;
};

export async function insertReceipt(q: Queryable, r: NewReceipt): Promise<string> {
  const rows = await q.query<{ id: string }>(
    `insert into receipts (member_id, store_id, status, reasons, image, image_mime, sha256, dhash, ocr, receipt_at, amount, approval_no, card_last4)
     values ($1,$2,$3,$4,$5,$6,$7,$8,$9::jsonb,$10,$11,$12,$13) returning id`,
    [r.memberId, r.storeId, r.status, r.reasons, r.image, r.imageMime, r.sha256, r.dhash, r.ocr == null ? null : JSON.stringify(r.ocr), r.receiptAt?.toISOString() ?? null, r.amount, r.approvalNo, r.cardLast4],
  );
  return rows[0]!.id;
}

/** 승인 확정 시 누적 금액/방문 반영 (트랜잭션 안에서 호출) */
export async function applyApprovedSpend(q: Queryable, p: { memberId: string; storeId: StoreId | null; receiptId: string; amount: number | null; tierKey: string }): Promise<void> {
  const amount = p.amount ?? 0;
  await q.query(`insert into spend_ledger (member_id, store_id, receipt_id, amount) values ($1,$2,$3,$4)`, [p.memberId, p.storeId, p.receiptId, amount]);
  await q.query(`update members set total_spend = total_spend + $2, visit_count = visit_count + 1, tier=$3 where id=$1`, [p.memberId, amount, p.tierKey]);
}

export async function setReceiptDecision(q: Queryable, p: { id: string; status: ReceiptStatus; reasons: string[]; reviewedBy: string; note: string | null; storeId?: StoreId | null; amount?: number | null; receiptAt?: Date | null }): Promise<void> {
  await q.query(
    `update receipts set status=$2, reasons=$3, reviewed_by=$4, reviewed_at=now(), review_note=$5,
       store_id = coalesce($6, store_id), amount = coalesce($7, amount), receipt_at = coalesce($8, receipt_at)
     where id=$1`,
    [p.id, p.status, p.reasons, p.reviewedBy, p.note, p.storeId ?? null, p.amount ?? null, p.receiptAt?.toISOString() ?? null],
  );
}

/* ───────────────────────── 메뉴 ───────────────────────── */

export type MenuItem = {
  id: number;
  storeId: StoreId;
  name: string;
  price: number | null;
  description: string | null;
  imagePath: string | null;
  hasImageData: boolean;
  isGift: boolean;
  active: boolean;
  sort: number;
};

type MenuRow = { id: number; store_id: string; name: string; price: number | null; description: string | null; image_path: string | null; has_image: boolean; is_gift: boolean; active: boolean; sort: number };

const mapMenu = (r: MenuRow): MenuItem => ({
  id: Number(r.id), storeId: r.store_id as StoreId, name: r.name, price: r.price == null ? null : Number(r.price), description: r.description,
  imagePath: r.image_path, hasImageData: Boolean(r.has_image), isGift: r.is_gift, active: r.active, sort: Number(r.sort),
});

const MENU_COLS = `id, store_id, name, price, description, image_path, (image_data is not null) as has_image, is_gift, active, sort`;

export async function listMenu(storeId: StoreId, opts: { giftOnly?: boolean; includeInactive?: boolean } = {}): Promise<MenuItem[]> {
  const conds = [`store_id=$1`];
  if (opts.giftOnly) conds.push(`is_gift = true`);
  if (!opts.includeInactive) conds.push(`active = true`);
  const rows = await query<MenuRow>(`select ${MENU_COLS} from menu_items where ${conds.join(" and ")} order by sort, id`, [storeId]);
  return rows.map(mapMenu);
}

export async function getMenuItem(id: number): Promise<MenuItem | null> {
  const r = await one<MenuRow>(`select ${MENU_COLS} from menu_items where id=$1`, [id]);
  return r ? mapMenu(r) : null;
}

export async function getMenuImage(id: number): Promise<{ data: Buffer; mime: string } | null> {
  const r = await one<{ image_data: unknown; image_mime: string | null }>(`select image_data, image_mime from menu_items where id=$1`, [id]);
  const data = r ? toBuffer(r.image_data) : null;
  return data ? { data, mime: r!.image_mime ?? "image/jpeg" } : null;
}

export async function upsertMenuItem(m: { id?: number; storeId: StoreId; name: string; price: number | null; description: string | null; isGift: boolean; active: boolean; sort: number }): Promise<number> {
  if (m.id) {
    await query(`update menu_items set name=$2, price=$3, description=$4, is_gift=$5, active=$6, sort=$7 where id=$1`, [m.id, m.name, m.price, m.description, m.isGift, m.active, m.sort]);
    return m.id;
  }
  const rows = await query<{ id: number }>(
    `insert into menu_items (store_id, name, price, description, is_gift, active, sort) values ($1,$2,$3,$4,$5,$6,$7) returning id`,
    [m.storeId, m.name, m.price, m.description, m.isGift, m.active, m.sort],
  );
  return Number(rows[0]!.id);
}

export async function setMenuImage(id: number, data: Buffer | null, mime: string | null): Promise<void> {
  await query(`update menu_items set image_data=$2, image_mime=$3 where id=$1`, [id, data, mime]);
}

export async function deleteMenuItem(id: number): Promise<boolean> {
  const used = await one<{ n: number }>(`select count(*)::int as n from coupons where menu_item_id=$1`, [id]);
  if ((used?.n ?? 0) > 0) {
    await query(`update menu_items set active=false, is_gift=false where id=$1`, [id]);
    return false;
  }
  await query(`delete from menu_items where id=$1`, [id]);
  return true;
}

/* ───────────────────────── 쿠폰 ───────────────────────── */

export type CouponStatus = "active" | "used" | "expired" | "void";
export type Coupon = {
  id: string;
  code: string;
  memberId: string;
  memberPhone?: string;
  receiptId: string | null;
  useStoreId: StoreId;
  menuItemId: number | null;
  menuName: string;
  kind: "side" | "vip" | "manual";
  status: CouponStatus;
  issuedAt: Date;
  expiresAt: Date;
  usedAt: Date | null;
  usedVia: string | null;
  note: string | null;
};

type CouponRow = {
  id: string; code: string; member_id: string; member_phone?: string; receipt_id: string | null; use_store_id: string; menu_item_id: number | null; menu_name: string;
  kind: Coupon["kind"]; status: CouponStatus; issued_at: unknown; expires_at: unknown; used_at: unknown; used_via: string | null; note: string | null;
};

const mapCoupon = (r: CouponRow): Coupon => {
  const expiresAt = toDate(r.expires_at) ?? new Date(0);
  let status = r.status;
  if (status === "active" && expiresAt.getTime() < Date.now()) status = "expired";
  return {
    id: r.id, code: r.code, memberId: r.member_id, memberPhone: r.member_phone, receiptId: r.receipt_id, useStoreId: r.use_store_id as StoreId,
    menuItemId: r.menu_item_id == null ? null : Number(r.menu_item_id), menuName: r.menu_name, kind: r.kind, status,
    issuedAt: toDate(r.issued_at) ?? new Date(0), expiresAt, usedAt: toDate(r.used_at), usedVia: r.used_via, note: r.note,
  };
};

const COUPON_COLS = `c.id, c.code, c.member_id, c.receipt_id, c.use_store_id, c.menu_item_id, c.menu_name, c.kind, c.status, c.issued_at, c.expires_at, c.used_at, c.used_via, c.note`;

export async function getCoupon(id: string): Promise<Coupon | null> {
  const r = await one<CouponRow>(`select ${COUPON_COLS}, m.phone as member_phone from coupons c join members m on m.id=c.member_id where c.id=$1`, [id]);
  return r ? mapCoupon(r) : null;
}

export async function findCouponByCode(code: string): Promise<Coupon | null> {
  const r = await one<CouponRow>(`select ${COUPON_COLS}, m.phone as member_phone from coupons c join members m on m.id=c.member_id where c.code=$1`, [code.toUpperCase().replace(/[^A-Z0-9]/g, "")]);
  return r ? mapCoupon(r) : null;
}

export async function listCouponsForMember(memberId: string): Promise<Coupon[]> {
  const rows = await query<CouponRow>(`select ${COUPON_COLS} from coupons c where c.member_id=$1 order by case c.status when 'active' then 0 else 1 end, c.issued_at desc`, [memberId]);
  return rows.map(mapCoupon);
}

export async function listCoupons(opts: { status?: CouponStatus; storeId?: string | null; q?: string; limit?: number; offset?: number } = {}): Promise<{ items: Coupon[]; total: number }> {
  const conds: string[] = [];
  const params: unknown[] = [];
  if (opts.status) { params.push(opts.status); conds.push(`c.status=$${params.length}`); }
  if (opts.storeId) { params.push(opts.storeId); conds.push(`c.use_store_id=$${params.length}`); }
  if (opts.q) {
    const d = opts.q.replace(/\D/g, "");
    if (d.length >= 4) { params.push(`%${d}%`); conds.push(`m.phone like $${params.length}`); }
    else { params.push(`%${opts.q.toUpperCase()}%`); conds.push(`c.code like $${params.length}`); }
  }
  const where = conds.length ? `where ${conds.join(" and ")}` : "";
  const total = (await one<{ n: number }>(`select count(*)::int as n from coupons c join members m on m.id=c.member_id ${where}`, params))?.n ?? 0;
  params.push(opts.limit ?? 50, opts.offset ?? 0);
  const rows = await query<CouponRow>(`select ${COUPON_COLS}, m.phone as member_phone from coupons c join members m on m.id=c.member_id ${where} order by c.issued_at desc limit $${params.length - 1} offset $${params.length}`, params);
  return { items: rows.map(mapCoupon), total };
}

/* ───────────────────────── 관리자 ───────────────────────── */

export type Admin = { id: string; name: string; storeId: StoreId | null; role: "owner" | "staff"; active: boolean; createdAt: Date; pwHash: string };
type AdminRow = { id: string; name: string; store_id: string | null; role: Admin["role"]; active: boolean; created_at: unknown; pw_hash: string };
const mapAdmin = (r: AdminRow): Admin => ({ id: r.id, name: r.name, storeId: (r.store_id as StoreId | null) ?? null, role: r.role, active: r.active, createdAt: toDate(r.created_at) ?? new Date(0), pwHash: r.pw_hash });

export async function getAdmin(id: string): Promise<Admin | null> {
  const r = await one<AdminRow>(`select * from admins where id=$1`, [id]);
  return r ? mapAdmin(r) : null;
}
export async function listAdmins(): Promise<Admin[]> {
  return (await query<AdminRow>(`select * from admins order by role, created_at`)).map(mapAdmin);
}
export async function createAdmin(a: { id: string; name: string; storeId: StoreId | null; role: Admin["role"]; pwHash: string }): Promise<void> {
  await query(`insert into admins (id, name, store_id, pw_hash, role) values ($1,$2,$3,$4,$5)`, [a.id, a.name, a.storeId, a.pwHash, a.role]);
}
export async function updateAdmin(id: string, p: { active?: boolean; pwHash?: string; name?: string }): Promise<void> {
  await query(`update admins set active=coalesce($2, active), pw_hash=coalesce($3, pw_hash), name=coalesce($4, name) where id=$1`, [id, p.active ?? null, p.pwHash ?? null, p.name ?? null]);
}

export async function audit(actor: string, action: string, target: string | null, meta: unknown = null): Promise<void> {
  await query(`insert into audit_log (actor, action, target, meta) values ($1,$2,$3,$4::jsonb)`, [actor, action, target, meta == null ? null : JSON.stringify(meta)]);
}

export async function listAudit(limit = 100): Promise<{ id: number; at: Date; actor: string; action: string; target: string | null; meta: unknown }[]> {
  const rows = await query<{ id: number; at: unknown; actor: string; action: string; target: string | null; meta: unknown }>(`select * from audit_log order by id desc limit $1`, [limit]);
  return rows.map((r) => ({ ...r, id: Number(r.id), at: toDate(r.at) ?? new Date(0) }));
}

/* ───────────────────────── 통계 ───────────────────────── */

export type DashboardStats = {
  today: { receipts: number; approved: number; review: number; rejected: number; couponsIssued: number; couponsUsed: number };
  pendingReview: number;
  activeCoupons: number;
  members: number;
  tiers: { tier: string; n: number }[];
  byStore: { storeId: StoreId; receipts30d: number; spend30d: number; couponsUsed30d: number }[];
  recentDays: { day: string; receipts: number; used: number }[];
};

export async function dashboardStats(now: Date): Promise<DashboardStats> {
  const kst = new Date(now.getTime() + 9 * 3600 * 1000);
  const dayStart = new Date(Date.UTC(kst.getUTCFullYear(), kst.getUTCMonth(), kst.getUTCDate()) - 9 * 3600 * 1000).toISOString();
  const d30 = new Date(now.getTime() - 30 * 86400 * 1000).toISOString();
  const t = await one<{ receipts: number; approved: number; review: number; rejected: number }>(
    `select count(*)::int as receipts,
            count(*) filter (where status='approved')::int as approved,
            count(*) filter (where status='review')::int as review,
            count(*) filter (where status='rejected')::int as rejected
     from receipts where created_at >= $1`, [dayStart]);
  const c = await one<{ issued: number; used: number }>(
    `select count(*) filter (where issued_at >= $1)::int as issued, count(*) filter (where used_at >= $1)::int as used from coupons`, [dayStart]);
  const pending = (await one<{ n: number }>(`select count(*)::int as n from receipts where status='review'`))?.n ?? 0;
  const active = (await one<{ n: number }>(`select count(*)::int as n from coupons where status='active' and expires_at > now()`))?.n ?? 0;
  const members = (await one<{ n: number }>(`select count(*)::int as n from members`))?.n ?? 0;
  const tiers = await query<{ tier: string; n: number }>(`select tier, count(*)::int as n from members group by tier order by n desc`);
  const byStore = await query<{ store_id: string; receipts30d: number; spend30d: number; coupons_used30d: number }>(
    `select s.id as store_id,
       (select count(*)::int from receipts r where r.store_id=s.id and r.status='approved' and r.created_at >= $1) as receipts30d,
       (select coalesce(sum(amount),0)::int from receipts r where r.store_id=s.id and r.status='approved' and r.created_at >= $1) as spend30d,
       (select count(*)::int from coupons c where c.use_store_id=s.id and c.status='used' and c.used_at >= $1) as coupons_used30d
     from stores s order by s.sort`, [d30]);
  const days = await query<{ day: string; receipts: number; used: number }>(
    `with d as (select generate_series(0, 13) as i)
     select to_char((($1::timestamptz + interval '9 hours')::date - d.i), 'MM-DD') as day,
       (select count(*)::int from receipts r where (r.created_at + interval '9 hours')::date = (($1::timestamptz + interval '9 hours')::date - d.i)) as receipts,
       (select count(*)::int from coupons c where c.used_at is not null and (c.used_at + interval '9 hours')::date = (($1::timestamptz + interval '9 hours')::date - d.i)) as used
     from d order by d.i desc`, [now.toISOString()]);
  return {
    today: { receipts: t?.receipts ?? 0, approved: t?.approved ?? 0, review: t?.review ?? 0, rejected: t?.rejected ?? 0, couponsIssued: c?.issued ?? 0, couponsUsed: c?.used ?? 0 },
    pendingReview: pending,
    activeCoupons: active,
    members,
    tiers: tiers.map((r) => ({ tier: r.tier, n: Number(r.n) })),
    byStore: byStore.map((r) => ({ storeId: r.store_id as StoreId, receipts30d: Number(r.receipts30d), spend30d: Number(r.spend30d), couponsUsed30d: Number(r.coupons_used30d) })),
    recentDays: days.map((r) => ({ day: r.day, receipts: Number(r.receipts), used: Number(r.used) })),
  };
}

export { formatPhone };
