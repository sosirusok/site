import { notFound } from "next/navigation";

/**
 * 손님 사이트 안에서 맞는 주소가 없을 때 — (site)/not-found.tsx(종이 위 404)를 헤더·푸터와 함께 보여 준다.
 * 명시된 라우트(/login /verify /wallet …)가 항상 우선하므로 다른 화면에는 영향이 없다.
 */
/** 없는 주소도 60초 캐시(ISR) — 요청마다 함수를 돌리지 않는다. 미리 만들 주소는 없지만(빈 목록) generateStaticParams 가 있어야 이 경로가 캐시된다 */
export const revalidate = 60;
export function generateStaticParams(): { missing: string[] }[] {
  return [];
}

export default function MissingPage() {
  notFound();
}
