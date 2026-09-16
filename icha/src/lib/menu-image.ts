/**
 * 관리자가 올린 메뉴 사진 주소. 서버·클라이언트 어디서나 쓸 수 있는 순수 함수 (DB 모듈을 끌어오지 않는다).
 * 사진을 바꾸면 v 가 바뀌어 브라우저·CDN 캐시를 건너뛴다. /api/menu-image/[id] 는 v 가 있으면 1년, 없으면 5분 캐시한다.
 */
export function menuImageUrl(item: { id: number; imageUpdatedAt?: Date | string | null }): string {
  const t = item.imageUpdatedAt instanceof Date ? item.imageUpdatedAt.getTime() : item.imageUpdatedAt ? new Date(item.imageUpdatedAt).getTime() : NaN;
  return `/api/menu-image/${item.id}${Number.isFinite(t) ? `?v=${t}` : ""}`;
}
