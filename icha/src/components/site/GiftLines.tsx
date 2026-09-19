import Link from "next/link";
import { placeSheetStores } from "@/lib/place-stores";

/**
 * 세 매장 혜택을 1차→3차 순으로 한 줄씩. 로그인 화면과 빈 쿠폰함처럼
 * 아래가 비는 화면을 "쿠폰이 뭔지"로 채운다 — 빈 보라 배경으로 끝나면 만들다 만 화면으로 보인다.
 * 값은 전부 stores.ts 의 실제 혜택 문구다(지어낸 문구 없음).
 */
export function GiftLines({ title = "쿠폰으로 받으시는 혜택" }: { title?: string }) {
  const stores = placeSheetStores();
  if (stores.length === 0) return null;
  return (
    <section className="giftlines" aria-labelledby="giftlines-title">
      <h2 id="giftlines-title" className="giftlines-title">{title}</h2>
      <ul className="giftlines-list">
        {stores.map((s) => (
          <li key={s.id} className="giftlines-item" data-store={s.id}>
            <span className="giftlines-no" aria-hidden="true">{String(s.course.n).padStart(2, "0")}</span>
            <span className="giftlines-body">
              <Link href={`/stores/${s.id}`} className="giftlines-name">{s.shortName}</Link>
              <span className="giftlines-what">{s.benefitLabel} 무료</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
