/**
 * 매장 마스터 데이터 (정적). DB stores/menu_items 는 최초 기동 시 여기서 시드된다.
 * 조사 근거: 네이버 플레이스 / 네이버 검색 결과 (2026-09 기준). 확인되지 않은 값은 null.
 */
import type { StoreId } from "./config";

export type MenuSeed = {
  name: string;
  price: number | null;
  description?: string;
  /** /public 기준 경로 */
  image?: string;
  /** 무료 사이드로 고를 수 있는 항목 (관리자 화면에서 변경 가능) */
  gift?: boolean;
};

export type StoreImage = {
  src: string;
  alt: string;
  kind: "hero" | "exterior" | "interior" | "food" | "drink" | "menu";
};

export type Store = {
  id: StoreId;
  /** 네이버 플레이스 공식 상호 */
  name: string;
  /** 화면용 짧은 이름 */
  shortName: string;
  /** 영수증 상호 매칭용 별칭 */
  aliases: string[];
  /** 대표 술 */
  drink: "막걸리" | "맥주" | "소주";
  /** 매장 색 */
  accent: string;
  accentInk: string;
  naverPlaceId: string | null;
  address: string;
  addressJibun: string | null;
  /** 영수증 주소 매칭 키워드 */
  addressKeywords: string[];
  /** 대표 전화(공개용; 네이버 안심번호일 수 있음) */
  phone: string | null;
  /** 영수증에 인쇄될 수 있는 다른 번호(유선 등) — 매칭용 */
  phoneAliases: string[];
  bizNo: string | null;
  hours: { days: string; time: string }[];
  hoursNote: string | null;
  lat: number | null;
  lng: number | null;
  /** 한 문장 소개 */
  headline: string;
  intro: string;
  keywords: string[];
  /** 방문자 리뷰 인용 (실제 리뷰, 날짜 포함) */
  quotes: { text: string; date: string }[];
  images: StoreImage[];
  menu: MenuSeed[];
  sort: number;
};

export const STORES: Store[] = [
  {
    id: "joseon",
    name: "조선칼국수와통막걸리 서면밀레오레본점",
    shortName: "조선칼국수",
    aliases: ["조선칼국수", "조선칼국수와통막걸리", "조선칼국수 서면점", "통막걸리"],
    drink: "막걸리",
    accent: "#c8553d",
    accentInk: "#5a1f12",
    naverPlaceId: "32874065",
    address: "부산 부산진구 동천로85번길 14 1,2층",
    addressJibun: null,
    addressKeywords: ["동천로85번길", "동천로85번길 14", "동천로"],
    phone: null,
    phoneAliases: [],
    bizNo: null,
    hours: [],
    hoursNote: null,
    lat: null,
    lng: null,
    headline: "칼국수 한 그릇, 통막걸리 한 통.",
    intro: "",
    keywords: [],
    quotes: [],
    images: [],
    menu: [],
    sort: 1,
  },
  {
    id: "tokyo",
    name: "도쿄스탠드 서면점",
    shortName: "도쿄스탠드",
    aliases: ["도쿄스탠드", "도쿄스탠드 서면", "TOKYO STAND", "tokyostand"],
    drink: "맥주",
    accent: "#d99a2b",
    accentInk: "#4a3305",
    naverPlaceId: null,
    address: "",
    addressJibun: null,
    addressKeywords: [],
    phone: null,
    phoneAliases: [],
    bizNo: null,
    hours: [],
    hoursNote: null,
    lat: null,
    lng: null,
    headline: "서서 마시는 도쿄식 한 잔.",
    intro: "",
    keywords: [],
    quotes: [],
    images: [],
    menu: [],
    sort: 2,
  },
  {
    id: "wareureu",
    name: "와르르맨숀 서면점",
    shortName: "와르르맨숀",
    aliases: ["와르르맨숀", "와르르맨션", "와르르 맨숀", "와르르"],
    drink: "소주",
    accent: "#2f6b4f",
    accentInk: "#0f2e21",
    naverPlaceId: null,
    address: "",
    addressJibun: null,
    addressKeywords: [],
    phone: null,
    phoneAliases: [],
    bizNo: null,
    hours: [],
    hoursNote: null,
    lat: null,
    lng: null,
    headline: "소주 한 병이 어울리는 맨숀.",
    intro: "",
    keywords: [],
    quotes: [],
    images: [],
    menu: [],
    sort: 3,
  },
];

export const STORE_BY_ID: Record<StoreId, Store> = Object.fromEntries(STORES.map((s) => [s.id, s])) as Record<StoreId, Store>;

export function getStore(id: string): Store | null {
  return (STORE_BY_ID as Record<string, Store>)[id] ?? null;
}

/** 영수증 매장을 제외한 나머지(선물 가능) 매장 */
export function giftStoresFor(receiptStoreId: StoreId): Store[] {
  return STORES.filter((s) => s.id !== receiptStoreId);
}

export function naverPlaceUrl(s: Store): string | null {
  return s.naverPlaceId ? `https://map.naver.com/p/entry/place/${s.naverPlaceId}` : null;
}

export function naverMobilePlaceUrl(s: Store): string | null {
  return s.naverPlaceId ? `https://m.place.naver.com/restaurant/${s.naverPlaceId}/home` : null;
}
