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

/** 오시는 길 — 지도와 세 매장 주소를 한눈에 보는 운영 정보. */
export function Directions() {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  const mapStores: MapStore[] = ordered.filter((st) => st.lat != null && st.lng != null).map((st) => ({
    id: st.id, name: st.name, shortName: st.shortName, drink: st.drink, lat: st.lat!, lng: st.lng!, address: st.address, naverPlaceId: st.naverPlaceId,
  }));
  return (
    <Section id="map" tone="lime" title="세 집은 걸어서 50m" lead={`${walkLine()} · 골목 하나 안에서 모두 이동`} alt pt={96} pb={104} className={s.mapSection}>
      <div className={s.directionsGrid}>
        <div className={s.mapWrap}>
          <LazyStoreMap stores={mapStores} compact hidePanel height={360} />
          <p className={s.mapBadge}><span aria-hidden="true">●</span> 세 매장 · 도보 50m</p>
        </div>
        <div className={s.directionSide}>
          <ul className={s.addrs}>
            {ordered.map((st) => {
              const links = placeLinks(st);
              return (
                <li key={st.id} className={s.addr} data-store={st.id}>
                  <span className={s.addrNo} aria-hidden="true">{String(st.course.n).padStart(2, "0")}</span>
                  <div className={s.addrBody}>
                    <p className={s.addrName}>{st.shortName}</p>
                    <p className={s.addrSub}>{shortAddress(st.address)}<br />{LOCATIONS[st.id].subway}</p>
                  </div>
                  {links ? <Button href={links.directions} variant="outline" size="sm" srSuffix={` — ${st.shortName}`} className={s.directionBtn}>길찾기</Button> : null}
                </li>
              );
            })}
          </ul>
          <p className={s.searchLine}>
            <a href={naverSearchUrl(SEARCH_QUERY)} target="_blank" rel="noreferrer" className={s.courseLink}>네이버에서 전체 코스 보기 <span aria-hidden="true">↗</span></a>
          </p>
        </div>
      </div>
    </Section>
  );
}
