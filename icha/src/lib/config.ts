/**
 * 사이트 전역 설정 — 브랜드 문구, 기본 운영 규칙, 사유 코드.
 * 매장 마스터 데이터는 ./stores.ts 에 있다.
 */

export const BRAND = {
  /** 서비스 이름. 사장님 확정 전 임시 안 — 한 곳만 바꾸면 전체에 반영된다. */
  name: "이차",
  hanja: "二次",
  /** 한 줄 설명 */
  tagline: "서면에서 1차 하셨죠? 2차는 한 접시 얹어드립니다.",
  /** 연합 설명 */
  unionName: "서면 2차 연합",
  /** 짧은 규칙 문구 */
  ruleOneLiner: "세 곳 중 한 곳의 영수증으로, 나머지 두 곳에서 사이드 한 가지 무료.",
} as const;

export type StoreId = "joseon" | "tokyo" | "wareureu";
export const STORE_IDS: StoreId[] = ["joseon", "tokyo", "wareureu"];

/** 운영 규칙 — 관리자 화면(설정)에서 바꿀 수 있고, DB settings 테이블이 우선한다. */
export type Rules = {
  /** 영수증 결제 시각으로부터 인정되는 시간(시간 단위) */
  receiptValidHours: number;
  /** 발급된 쿠폰의 유효 기간(일) */
  couponValidDays: number;
  /** 인정 최소 결제 금액(원). 0이면 제한 없음 */
  minAmount: number;
  /** 회원 1명당 하루 영수증 인증 한도 */
  dailyLimitPerMember: number;
  /** 유사 이미지 판정 dHash 해밍 거리 임계값(0~64). 작을수록 엄격 */
  similarHashThreshold: number;
  /** 인식 신뢰도가 이 값 미만이면 관리자 확인으로 보냄 */
  minConfidence: number;
  /** 누적 결제 금액 등급 (오름차순) */
  tiers: { key: string; name: string; minSpend: number }[];
  /** 이벤트 진행 여부. false면 인증을 받지 않고 안내 문구만 노출 */
  eventActive: boolean;
  /** 홈/지갑 상단 공지 (비우면 숨김) */
  notice: string;
};

export const DEFAULT_RULES: Rules = {
  receiptValidHours: 24,
  couponValidDays: 30,
  minAmount: 10000,
  dailyLimitPerMember: 3,
  similarHashThreshold: 8,
  minConfidence: 0.6,
  tiers: [
    { key: "regular", name: "단골", minSpend: 100000 },
    { key: "vip", name: "VIP", minSpend: 300000 },
    { key: "vvip", name: "VVIP", minSpend: 700000 },
  ],
  eventActive: true,
  notice: "",
};

/** 영수증 판정 사유 코드 (DB receipts.reasons 에 저장) */
export const REASONS = {
  NOT_RECEIPT: "영수증으로 보이지 않는 사진입니다.",
  STORE_MISMATCH: "세 매장의 영수증이 아닙니다.",
  STORE_UNKNOWN: "매장명을 읽지 못했습니다.",
  DATE_UNREADABLE: "결제 일시를 읽지 못했습니다.",
  EXPIRED: "결제 후 인정 시간이 지났습니다.",
  FUTURE_DATE: "결제 일시가 현재보다 미래입니다.",
  MIN_AMOUNT: "최소 결제 금액에 미치지 못합니다.",
  DUPLICATE_IMAGE: "이미 등록된 사진입니다.",
  SIMILAR_IMAGE: "이미 등록된 영수증과 매우 비슷한 사진입니다.",
  DUPLICATE_RECEIPT: "이미 사용된 영수증입니다(승인번호 일치).",
  DUPLICATE_FINGERPRINT: "같은 매장·시각·금액의 영수증이 이미 있습니다.",
  DAILY_LIMIT: "오늘 인증 가능 횟수를 모두 사용했습니다.",
  SCREEN_PHOTO: "화면을 다시 찍은 사진으로 보입니다.",
  REPRINT: "재출력 영수증으로 보입니다.",
  ORDER_SLIP: "결제 영수증이 아닌 주문서(빌지)로 보입니다.",
  LOW_CONFIDENCE: "일부 항목이 흐려 확인이 필요합니다.",
  OCR_UNAVAILABLE: "자동 인식이 잠시 중단되어 직원 확인으로 넘어갑니다.",
  OCR_ERROR: "자동 인식 중 오류가 나서 직원 확인으로 넘어갑니다.",
  EVENT_INACTIVE: "지금은 이벤트 기간이 아닙니다.",
  MANUAL_APPROVED: "관리자가 확인 후 승인했습니다.",
  MANUAL_REJECTED: "관리자가 확인 후 반려했습니다.",
} as const;

export type ReasonCode = keyof typeof REASONS;

export function reasonText(code: string): string {
  return (REASONS as Record<string, string>)[code] ?? code;
}

/** 전화번호 정규화: 숫자만, 010/011/016/017/018/019 로 시작하는 10~11자리 */
export function normalizePhone(input: string): string | null {
  const digits = input.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 11) return null;
  if (!/^01[016789]/.test(digits)) return null;
  return digits;
}

export function formatPhone(digits: string): string {
  if (digits.length === 11) return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  if (digits.length === 10) return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  return digits;
}

/** 전화번호 마스킹: 010-****-5678 */
export function maskPhone(digits: string): string {
  const f = formatPhone(digits);
  const parts = f.split("-");
  if (parts.length === 3) return `${parts[0]}-${"*".repeat(parts[1]!.length)}-${parts[2]}`;
  return f;
}

export function formatWon(n: number | null | undefined): string {
  if (n == null) return "-";
  return `${n.toLocaleString("ko-KR")}원`;
}

export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
