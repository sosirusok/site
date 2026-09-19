import { LazyStoreMap } from "@/components/site/LazyStoreMap";
import type { MapStore } from "@/components/site/StoreMap";
import { Button } from "@/components/ui/Button";
import { Section } from "@/components/ui/Section";
import { LOCATIONS } from "@/lib/locations";
import { naverSearchUrl, placeLinks } from "@/lib/naver";
import { STORES } from "@/lib/stores";
import s from "./home.module.css";

/** "서면역 6번 출구 도보 2~4분" — 값은 lib/locations.ts */
export function walkLine(): string {
  const v = Object.values(LOCATIONS);
  const exits = Array.from(new Set(v.map((l) => l.exit))).join("·");
  const mins = v.map((l) => l.walkMin);
  const lo = Math.min(...mins), hi = Math.max(...mins);
  return `서면역 ${exits}번 출구 도보 ${lo === hi ? `${lo}분` : `${lo}~${hi}분`}`;
}

/** "부산 부산진구 동천로85번길 14 1,2층" → "동천로85번길 14 1,2층" */
export function shortAddress(a: string): string {
  return a.replace(/^부산(광역시)?\s*부산진구\s*/, "");
}

/** 네이버 검색창에 그대로 넣는 말 */
const SEARCH_QUERY = "서면 알콜부시기";

/** 오시는 길 — 지도(폭 가득, 테두리 대신 형광 rim light) 아래 매장마다 줄 하나: 속 빈 차수 숫자 · 상호(간판체) · 주소 · [길찾기]. */
export function Directions() {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  const mapStores: MapStore[] = ordered.filter((st) => st.lat != null && st.lng != null).map((st) => ({
    id: st.id, name: st.name, shortName: st.shortName, drink: st.drink, lat: st.lat!, lng: st.lng!, address: st.address, naverPlaceId: st.naverPlaceId,
  }));
  return (
    <Section id="map" tone="lime" eyebrow="Map" title="오시는 길" lead={`${walkLine()} · 세 매장 모두 50m 이내`} alt flush pt={54} pb={34}>
      <div className={s.mapWrap}>
        <LazyStoreMap stores={mapStores} compact hidePanel height={230} />
      </div>
      <ul className={s.addrs}>
        {ordered.map((st) => {
          const links = placeLinks(st);
          return (
            <li key={st.id} className={s.addr} data-store={st.id}>
              <span className={`bignum ${s.addrNo}`} aria-hidden="true">{String(st.course.n).padStart(2, "0")}</span>
              <div className={s.addrBody}>
                <p className={s.addrName}>{st.shortName}</p>
                <p className={s.addrSub}>{shortAddress(st.address)}<br />{LOCATIONS[st.id].subway}</p>
              </div>
              {links && <Button href={links.directions} variant="outline" size="sm" srSuffix={` — ${st.shortName}`}>길찾기</Button>}
            </li>
          );
        })}
      </ul>
      <p className={s.searchLine}>
        <a href={naverSearchUrl(SEARCH_QUERY)} target="_blank" rel="noreferrer" className="link link-naver">네이버 &lsquo;{SEARCH_QUERY}&rsquo; 검색 →</a>
      </p>
    </Section>
  );
}
