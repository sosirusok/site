"use server";
/**
 * 관리자 Server Action 모음. 모든 액션은 세션·권한을 다시 확인하고 audit() 를 남긴다.
 * 반환값은 ActionState — 클라이언트는 useActionState 또는 startTransition 으로 호출한다.
 */
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import sharp from "sharp";
import { hashPassword } from "@/lib/auth/password";
import { clearAdminSession, getAdminSession, type AdminSession } from "@/lib/auth/session";
import { STORE_IDS, formatPhone, normalizePhone, type Rules, type StoreId } from "@/lib/config";
import { counterRedeemPending, issueCounterPass } from "@/lib/counter";
import { issueManualCoupons, redeemCoupon, voidCoupon } from "@/lib/coupons";
import { query } from "@/lib/db";
import {
  audit, createAdmin, deleteMenuItem, getAdmin, getMember, getMemberByPhone, getMenuItem, isUuid, listMembers, listMenu,
  setMenuImage, updateAdmin, updateMemberMemo, upsertMenuItem,
} from "@/lib/db/queries";
import { adminDecideReceipt } from "@/lib/receipt/service";
import { getRules, saveRules, tierFor } from "@/lib/settings";
import { getStore } from "@/lib/stores";
import { fromLocalInput, josa } from "@/components/admin/format";

export type ActionState = { ok: boolean; message: string; at: number; data?: Record<string, string | number | null> } | null;

class ActionError extends Error {}

async function requireAdmin(opts: { owner?: boolean } = {}): Promise<AdminSession> {
  const s = await getAdminSession();
  if (!s) throw new ActionError("로그인이 풀렸습니다. 다시 로그인하세요.");
  const row = await getAdmin(s.adminId);
  if (!row || !row.active) throw new ActionError("비활성화된 계정입니다.");
  if (opts.owner && s.role !== "owner") throw new ActionError("총괄 관리자만 할 수 있는 작업입니다.");
  return s;
}

async function run(fn: () => Promise<{ message: string; data?: Record<string, string | number | null> }>): Promise<ActionState> {
  try {
    const r = await fn();
    revalidatePath("/admin", "layout");
    return { ok: true, message: r.message, at: Date.now(), data: r.data };
  } catch (e) {
    const known = e instanceof ActionError || typeof (e as { status?: unknown })?.status === "number";
    if (!known) console.error("[admin action]", e);
    return { ok: false, message: known && e instanceof Error ? e.message : "처리 중 오류가 났습니다. 잠시 후 다시 시도하세요.", at: Date.now() };
  }
}

const str = (fd: FormData, k: string) => String(fd.get(k) ?? "").trim();
const num = (fd: FormData, k: string): number | null => {
  const v = str(fd, k).replace(/[,\s원]/g, "");
  if (v === "") return null;
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};
const isStoreId = (v: string): v is StoreId => (STORE_IDS as string[]).includes(v);
/** 폼의 정수 id (menu_items.id 등). 아니면 null */
const intId = (fd: FormData, k: string): number | null => {
  const n = Number(str(fd, k));
  return Number.isInteger(n) && n > 0 ? n : null;
};

/* ───────── 세션 ───────── */

export async function logoutAction(): Promise<void> {
  const s = await getAdminSession();
  if (s) await audit(s.adminId, "admin.logout", null).catch(() => {});
  await clearAdminSession();
  redirect("/admin/login");
}

/* ───────── 영수증 판정 ───────── */

export async function decideReceiptAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const s = await requireAdmin();
    const receiptId = str(fd, "receiptId");
    const decision = str(fd, "decision");
    if (!isUuid(receiptId) || (decision !== "approve" && decision !== "reject")) throw new ActionError("잘못된 요청입니다.");
    const storeRaw = str(fd, "storeId");
    const storeId = storeRaw ? (isStoreId(storeRaw) ? storeRaw : null) : null;
    if (storeRaw && !storeId) throw new ActionError("매장 값이 올바르지 않습니다.");
    // 직원 계정은 자기 매장 영수증만, 매장 변경 없이 처리한다 (adminDecideReceipt 가 잠근 행 기준으로 한 번 더 검사)
    const restrictToStore = s.role === "staff" ? (s.storeId && isStoreId(s.storeId) ? s.storeId : "__none__") : null;
    if (restrictToStore === "__none__") throw new ActionError("매장이 지정되지 않은 직원 계정은 영수증을 판정할 수 없습니다.");
    const amount = num(fd, "amount");
    if (amount != null && (amount < 0 || amount > 50_000_000)) throw new ActionError("금액이 올바르지 않습니다.");
    const receiptAtRaw = str(fd, "receiptAt");
    const receiptAt = receiptAtRaw ? fromLocalInput(receiptAtRaw) : null;
    if (receiptAtRaw && !receiptAt) throw new ActionError("결제 일시 형식이 올바르지 않습니다.");
    const note = str(fd, "note") || null;
    if (decision === "reject" && !note) throw new ActionError("반려할 때는 사유를 적어 주세요. 회원에게 보이지 않지만 기록에 남습니다.");
    const approve = decision === "approve";
    const r = await adminDecideReceipt({ receiptId, approve, adminId: s.adminId, note, storeId, amount, receiptAt, restrictToStore });
    await audit(s.adminId, approve ? "receipt.approve" : "receipt.reject", receiptId, { storeId: r.storeId, amount: r.amount, note });
    return {
      message: approve
        ? `승인했습니다. 회원이 쿠폰함에서 ${josa(getStore(r.storeId ?? "")?.shortName ?? "해당 매장", "을를")} 제외한 두 매장의 증정 품목을 고를 수 있습니다.`
        : "반려했습니다. 회원 쿠폰함에는 반려로 표시됩니다.",
      data: { status: r.status },
    };
  });
}

/* ───────── 카운터 (계산대에서 손님 번호로 발급·사용) ───────── */

/** 직원은 자기 매장, 총괄은 폼에서 고른 매장 */
function counterStoreFor(s: AdminSession, chosen: string): StoreId {
  if (s.role === "staff") {
    if (s.storeId && isStoreId(s.storeId)) return s.storeId;
    throw new ActionError("매장이 지정되지 않은 직원 계정입니다. 총괄 관리자에게 문의하세요.");
  }
  if (!isStoreId(chosen)) throw new ActionError("어느 매장 계산대인지 고르세요.");
  return chosen;
}

/** (a) 이 손님에게 쿠폰 주기 — 이 매장 이름으로 릴레이 발급 */
export async function counterIssueAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const s = await requireAdmin();
    const phone = normalizePhone(str(fd, "phone"));
    if (!phone) throw new ActionError("휴대폰 번호를 확인해 주세요.");
    const storeId = counterStoreFor(s, str(fd, "storeId"));
    const amount = num(fd, "amount");
    if (amount != null && (amount < 0 || amount > 50_000_000)) throw new ActionError("금액이 올바르지 않습니다.");
    const r = await issueCounterPass({ phone, storeId, amount, adminId: s.adminId });
    const names = r.usableAt.map((id) => getStore(id)?.shortName ?? id).join("·");
    return {
      message: `${formatPhone(r.member.phone)} 손님에게 ${getStore(storeId)?.shortName ?? "이 매장"} 쿠폰을 넣었습니다. ${names}에서 쓸 수 있어요.`,
      data: { receiptId: r.receiptId, phone: r.member.phone, usableAt: names },
    };
  });
}

/** (b) 여기서 사용 처리 — 이 매장 쿠폰이면 바로, 받은 릴레이면 이 매장 혜택 품목을 골라 발급과 동시에 사용 처리 */
export async function counterRedeemAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const s = await requireAdmin();
    const storeId = counterStoreFor(s, str(fd, "storeId"));
    const couponId = str(fd, "couponId");
    if (couponId) {
      if (!isUuid(couponId)) throw new ActionError("쿠폰을 찾을 수 없습니다.");
      const c = await redeemCoupon({ couponId, by: { adminId: s.adminId, storeId } });
      await audit(s.adminId, "counter_redeem", c.id, { code: c.code, storeId, menuName: c.menuName, via: "coupon" });
      return { message: `${c.menuName} 사용 처리했습니다.`, data: { code: c.code, couponId: c.id, menuName: c.menuName } };
    }
    const receiptId = str(fd, "receiptId");
    const memberId = str(fd, "memberId");
    const menuItemId = intId(fd, "menuItemId");
    if (!isUuid(receiptId) || !isUuid(memberId)) throw new ActionError("받은 릴레이를 찾을 수 없습니다. 번호를 다시 조회하세요.");
    if (!menuItemId) throw new ActionError("혜택 품목을 고르세요.");
    const c = await counterRedeemPending({ receiptId, memberId, menuItemId, adminId: s.adminId, storeId });
    await audit(s.adminId, "counter_redeem", c.id, { code: c.code, storeId, receiptId, menuName: c.menuName, via: "relay" });
    return { message: `${c.menuName} 사용 처리했습니다.`, data: { code: c.code, couponId: c.id, menuName: c.menuName } };
  });
}

/* ───────── 쿠폰 ───────── */

export async function redeemCouponAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const s = await requireAdmin();
    const couponId = str(fd, "couponId");
    if (!isUuid(couponId)) throw new ActionError("쿠폰을 찾을 수 없습니다.");
    const storeId = s.storeId && isStoreId(s.storeId) ? s.storeId : null;
    const c = await redeemCoupon({ couponId, by: { adminId: s.adminId, storeId } });
    return { message: `${c.code} · ${c.menuName} 사용 처리했습니다.`, data: { code: c.code } };
  });
}

export async function voidCouponAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const s = await requireAdmin({ owner: true });
    const couponId = str(fd, "couponId");
    const note = str(fd, "note") || null;
    if (!isUuid(couponId)) throw new ActionError("쿠폰을 찾을 수 없습니다.");
    if (!note) throw new ActionError("취소 사유를 적어 주세요.");
    const c = await voidCoupon({ couponId, adminId: s.adminId, note });
    return { message: `${c.code} 쿠폰을 취소했습니다.` };
  });
}

/** 등급별/개인 수동 발급. targetType: tier | phone | member */
export async function issueCouponsAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const s = await requireAdmin({ owner: true });
    const targetType = str(fd, "targetType");
    const useStoreId = str(fd, "useStoreId");
    if (!isStoreId(useStoreId)) throw new ActionError("사용 매장을 고르세요.");
    const validDays = num(fd, "validDays") ?? 0;
    if (validDays < 1 || validDays > 365) throw new ActionError("유효 기간은 1~365일 사이여야 합니다.");
    const note = str(fd, "note") || null;

    let menuItemId: number | null = null;
    let menuName = str(fd, "menuName");
    const itemRaw = str(fd, "menuItemId");
    if (itemRaw) {
      const itemId = intId(fd, "menuItemId");
      const item = itemId ? await getMenuItem(itemId) : null;
      if (!item || item.storeId !== useStoreId) throw new ActionError("고른 메뉴가 그 매장의 메뉴가 아닙니다.");
      menuItemId = item.id;
      menuName = item.name;
    }
    if (!menuName) throw new ActionError("메뉴를 고르거나 직접 적어 주세요.");
    if (menuName.length > 40) throw new ActionError("메뉴 이름이 너무 깁니다(40자 이내).");

    let target: { tierKey: string } | { memberId: string };
    let label: string;
    if (targetType === "tier") {
      const rules = await getRules();
      const tierKey = str(fd, "tierKey");
      const t = rules.tiers.find((x) => x.key === tierKey);
      if (!t) throw new ActionError("등급을 고르세요.");
      target = { tierKey };
      label = `${t.name} 등급 회원`;
    } else if (targetType === "phone") {
      const phone = normalizePhone(str(fd, "phone"));
      if (!phone) throw new ActionError("전화번호 형식이 올바르지 않습니다.");
      const m = await getMemberByPhone(phone);
      if (!m) throw new ActionError("그 번호로 가입한 회원이 없습니다. 손님이 먼저 사이트에서 번호로 로그인해야 합니다.");
      target = { memberId: m.id };
      label = "회원 1명";
    } else if (targetType === "member") {
      const memberId = str(fd, "memberId");
      const m = isUuid(memberId) ? await getMember(memberId) : null;
      if (!m) throw new ActionError("회원을 찾을 수 없습니다.");
      target = { memberId: m.id };
      label = "회원 1명";
    } else throw new ActionError("대상을 고르세요.");

    const n = await issueManualCoupons({ adminId: s.adminId, target, useStoreId, menuItemId, menuName, validDays, note, kind: targetType === "tier" ? "vip" : "manual" });
    if (n === 0) return { message: "대상 회원이 없어 발급하지 않았습니다.", data: { count: 0 } };
    return { message: `${label}에게 ${getStore(useStoreId)?.shortName} · ${menuName} 쿠폰 ${n}장을 발급했습니다.`, data: { count: n } };
  });
}

/* ───────── 회원 ───────── */

export async function saveMemberMemoAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const s = await requireAdmin({ owner: true });
    const memberId = str(fd, "memberId");
    const memo = str(fd, "memo").slice(0, 500) || null;
    if (!isUuid(memberId) || !(await getMember(memberId))) throw new ActionError("회원을 찾을 수 없습니다.");
    await updateMemberMemo(memberId, memo);
    await audit(s.adminId, "member.memo", memberId, { length: memo?.length ?? 0 });
    return { message: "메모를 저장했습니다." };
  });
}

/* ───────── 메뉴 ───────── */

export async function saveMenuAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const s = await requireAdmin({ owner: true });
    const idRaw = str(fd, "id");
    const id = idRaw ? intId(fd, "id") ?? undefined : undefined;
    if (idRaw && !id) throw new ActionError("메뉴를 찾을 수 없습니다.");
    const storeId = str(fd, "storeId");
    if (!isStoreId(storeId)) throw new ActionError("매장이 올바르지 않습니다.");
    const name = str(fd, "name");
    if (!name || name.length > 60) throw new ActionError("메뉴 이름은 1~60자로 적어 주세요.");
    const price = num(fd, "price");
    if (price != null && (price < 0 || price > 10_000_000)) throw new ActionError("가격이 올바르지 않습니다.");
    const description = str(fd, "description").slice(0, 300) || null;
    const isGift = fd.get("isGift") === "on";
    const active = fd.get("active") !== "off";
    let sort = num(fd, "sort");
    if (id) {
      const cur = await getMenuItem(id);
      if (!cur || cur.storeId !== storeId) throw new ActionError("메뉴를 찾을 수 없습니다.");
      if (sort == null) sort = cur.sort;
    } else if (sort == null) {
      sort = (await listMenu(storeId, { includeInactive: true })).length;
    }
    const savedId = await upsertMenuItem({ id, storeId, name, price, description, isGift, active, sort });

    const file = fd.get("image");
    if (file instanceof File && file.size > 0) {
      if (file.size > 12 * 1024 * 1024) throw new ActionError("사진은 12MB 이하로 올려 주세요.");
      let jpeg: Buffer;
      try {
        jpeg = await sharp(Buffer.from(await file.arrayBuffer()), { failOn: "none" })
          .rotate()
          .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
          .jpeg({ quality: 82, mozjpeg: true })
          .toBuffer();
      } catch {
        throw new ActionError("사진 파일을 읽지 못했습니다. JPG 또는 PNG 를 올려 주세요. (아이폰 HEIC 는 설정 > 카메라 > 포맷을 '높은 호환성'으로)");
      }
      await setMenuImage(savedId, jpeg, "image/jpeg");
      await audit(s.adminId, "menu.image", String(savedId), { bytes: jpeg.length });
    } else if (fd.get("removeImage") === "on" && id) {
      await setMenuImage(id, null, null);
      await audit(s.adminId, "menu.image", String(id), { removed: true });
    }
    await audit(s.adminId, "menu.save", String(savedId), { storeId, name, price, isGift, active, created: !id });
    return { message: id ? `'${name}' 을(를) 저장했습니다.` : `'${name}' 을(를) 추가했습니다.`, data: { id: savedId } };
  });
}

export async function toggleMenuGiftAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const s = await requireAdmin({ owner: true });
    const id = intId(fd, "id");
    const item = id ? await getMenuItem(id) : null;
    if (!item || !id) throw new ActionError("메뉴를 찾을 수 없습니다.");
    const isGift = !item.isGift;
    await upsertMenuItem({ ...item, id: item.id, isGift });
    await audit(s.adminId, "menu.gift", String(id), { name: item.name, isGift });
    return { message: isGift ? `'${item.name}' 을(를) 무료 증정 품목으로 넣었습니다.` : `'${item.name}' 을(를) 무료 증정에서 뺐습니다.` };
  });
}

export async function toggleMenuActiveAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const s = await requireAdmin({ owner: true });
    const id = intId(fd, "id");
    const item = id ? await getMenuItem(id) : null;
    if (!item || !id) throw new ActionError("메뉴를 찾을 수 없습니다.");
    const active = !item.active;
    await upsertMenuItem({ ...item, id: item.id, active });
    await audit(s.adminId, "menu.active", String(id), { name: item.name, active });
    return { message: active ? `'${item.name}' 을(를) 다시 노출합니다.` : `'${item.name}' 을(를) 숨겼습니다.` };
  });
}

export async function moveMenuAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const s = await requireAdmin({ owner: true });
    const id = intId(fd, "id");
    const dir = str(fd, "dir") === "up" ? -1 : 1;
    const item = id ? await getMenuItem(id) : null;
    if (!item || !id) throw new ActionError("메뉴를 찾을 수 없습니다.");
    const items = await listMenu(item.storeId, { includeInactive: true });
    const idx = items.findIndex((m) => m.id === id);
    const swap = idx + dir;
    if (idx < 0 || swap < 0 || swap >= items.length) return { message: "더 옮길 수 없습니다." };
    const order = items.map((m) => m.id);
    [order[idx], order[swap]] = [order[swap]!, order[idx]!];
    for (let i = 0; i < order.length; i++) await query(`update menu_items set sort=$2 where id=$1`, [order[i], i]);
    await audit(s.adminId, "menu.sort", String(id), { dir: dir < 0 ? "up" : "down" });
    return { message: "순서를 바꿨습니다." };
  });
}

export async function deleteMenuAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const s = await requireAdmin({ owner: true });
    const id = intId(fd, "id");
    const item = id ? await getMenuItem(id) : null;
    if (!item || !id) throw new ActionError("메뉴를 찾을 수 없습니다.");
    const removed = await deleteMenuItem(id);
    await audit(s.adminId, "menu.delete", String(id), { name: item.name, hard: removed });
    return { message: removed ? `'${item.name}' 을(를) 삭제했습니다.` : `'${item.name}' 은(는) 발급된 쿠폰이 있어 삭제 대신 숨김·무료 증정 해제 처리했습니다.` };
  });
}

/* ───────── 설정 ───────── */

export async function saveRulesAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const s = await requireAdmin({ owner: true });
    const couponValidDays = num(fd, "couponValidDays");
    const dailyLimitPerMember = num(fd, "dailyLimitPerMember");
    if (couponValidDays == null || couponValidDays < 1 || couponValidDays > 365) throw new ActionError("쿠폰 유효 기간은 1~365일 사이로 적어 주세요.");
    if (dailyLimitPerMember == null || dailyLimitPerMember < 1 || dailyLimitPerMember > 20) throw new ActionError("하루 한도는 1~20장 사이로 적어 주세요.");
    // 매장별 한 줄 — 비우면 손님 화면에서 숨는다
    const storeNotices = {} as Record<StoreId, string>;
    const reviewBenefit = {} as Record<StoreId, string>;
    for (const id of STORE_IDS) {
      storeNotices[id] = str(fd, `storeNotice_${id}`).slice(0, 80);
      reviewBenefit[id] = str(fd, `reviewBenefit_${id}`).slice(0, 40);
    }
    // 사진·자동 인식 관련 값(인정 시간·금액·민감도·등급 표)은 화면에서 뺐으므로 기존 값을 그대로 둔다
    const patch: Partial<Rules> = {
      couponValidDays: Math.round(couponValidDays),
      dailyLimitPerMember: Math.round(dailyLimitPerMember),
      eventActive: fd.get("eventActive") === "on",
      notice: str(fd, "notice").slice(0, 200),
      storeNotices,
      reviewBenefit,
    };
    await saveRules(patch);
    await audit(s.adminId, "settings.save", "rules", patch);
    return { message: "저장했습니다. 손님 사이트와 카운터에 바로 반영됩니다." };
  });
}

export async function recalcTiersAction(_prev: ActionState, _fd: FormData): Promise<ActionState> {
  return run(async () => {
    const s = await requireAdmin({ owner: true });
    const rules = await getRules();
    const { items } = await listMembers({ limit: 100000 });
    let changed = 0;
    for (const m of items) {
      const key = tierFor(m.totalSpend, rules).key;
      if (key !== m.tier) {
        await query(`update members set tier=$2 where id=$1`, [m.id, key]);
        changed++;
      }
    }
    await audit(s.adminId, "settings.recalc_tiers", null, { members: items.length, changed });
    return { message: `회원 ${items.length.toLocaleString("ko-KR")}명 중 ${changed.toLocaleString("ko-KR")}명의 등급이 바뀌었습니다.`, data: { changed } };
  });
}

/* ───────── 직원 계정 ───────── */

export async function createStaffAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const s = await requireAdmin({ owner: true });
    const id = str(fd, "id").toLowerCase();
    const name = str(fd, "name");
    const role = str(fd, "role") === "owner" ? "owner" : "staff";
    const storeRaw = str(fd, "storeId");
    const password = String(fd.get("password") ?? "");
    if (!/^[a-z0-9_.-]{3,20}$/.test(id)) throw new ActionError("아이디는 영문 소문자·숫자 3~20자로 적어 주세요.");
    if (!name || name.length > 30) throw new ActionError("이름을 적어 주세요(30자 이내).");
    if (password.length < 8) throw new ActionError("비밀번호는 8자 이상이어야 합니다.");
    if (role === "staff" && !isStoreId(storeRaw)) throw new ActionError("직원 계정은 매장을 골라야 합니다.");
    if (await getAdmin(id)) throw new ActionError("이미 있는 아이디입니다.");
    await createAdmin({ id, name, storeId: role === "staff" ? (storeRaw as StoreId) : null, role, pwHash: await hashPassword(password) });
    await audit(s.adminId, "staff.create", id, { name, role, storeId: role === "staff" ? storeRaw : null });
    return { message: `'${id}' 계정을 만들었습니다. 비밀번호는 직원에게 직접 전해 주세요.` };
  });
}

export async function setStaffActiveAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const s = await requireAdmin({ owner: true });
    const id = str(fd, "id");
    const active = str(fd, "active") === "1";
    if (id === s.adminId) throw new ActionError("자기 계정은 비활성화할 수 없습니다.");
    const a = await getAdmin(id);
    if (!a) throw new ActionError("계정을 찾을 수 없습니다.");
    await updateAdmin(id, { active });
    await audit(s.adminId, "staff.active", id, { active });
    return { message: active ? `'${id}' 계정을 다시 활성화했습니다.` : `'${id}' 계정을 비활성화했습니다. 더는 로그인할 수 없습니다.` };
  });
}

export async function resetStaffPasswordAction(_prev: ActionState, fd: FormData): Promise<ActionState> {
  return run(async () => {
    const s = await requireAdmin({ owner: true });
    const id = str(fd, "id");
    const password = String(fd.get("password") ?? "");
    if (password.length < 8) throw new ActionError("새 비밀번호는 8자 이상이어야 합니다.");
    const a = await getAdmin(id);
    if (!a) throw new ActionError("계정을 찾을 수 없습니다.");
    await updateAdmin(id, { pwHash: await hashPassword(password) });
    await audit(s.adminId, "staff.password", id, null);
    return { message: `'${id}' 비밀번호를 바꿨습니다.` };
  });
}
