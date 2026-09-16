import type { PlaceSheetStore } from "@/components/site/PlaceSheet";
import { placeLinks } from "./naver";
import { STORES } from "./stores";

/** 플레이스 시트에 넘길 매장 목록(1차→2차→3차 순, 플레이스 아이디가 있는 매장만) */
export function placeSheetStores(): PlaceSheetStore[] {
  return [...STORES]
    .sort((a, b) => a.course.n - b.course.n)
    .map((s) => ({ s, l: placeLinks(s) }))
    .filter((x): x is { s: (typeof STORES)[number]; l: NonNullable<ReturnType<typeof placeLinks>> } => x.l != null)
    .map(({ s, l }) => ({ id: s.id, shortName: s.shortName, course: s.course, home: l.home, review: l.review, directions: l.directions }));
}
