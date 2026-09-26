import { LOCATIONS } from "@/lib/locations";
import { naverSearchUrl, placeLinks } from "@/lib/naver";
import { STORES } from "@/lib/stores";
import s from "./lower-home.module.css";

export function walkLine(): string {
  const values = Object.values(LOCATIONS);
  const exits = Array.from(new Set(values.map((location) => location.exit))).join("·");
  const minutes = values.map((location) => location.walkMin);
  const low = Math.min(...minutes);
  const high = Math.max(...minutes);
  return `서면역 ${exits}번 출구 도보 ${low === high ? `${low}분` : `${low}~${high}분`}`;
}

export function shortAddress(address: string): string {
  return address.replace(/^부산(광역시)?\s*부산진구\s*/, "");
}

const SEARCH_QUERY = "서면 알콜부시기";

/** 홈에서는 지도를 접고, 실제 이동에 필요한 주소와 길찾기만 남긴다. */
export function Directions() {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);

  return (
    <section id="map" className={s.mapSection} aria-labelledby="map-title">
      <div className={s.mapHeading}>
        <h2 id="map-title">오시는 길</h2>
        <p>{walkLine()} · 세 매장 모두 50m 이내</p>
      </div>
      <div className={s.directionSide}>
        <ul className={s.addrs}>
          {ordered.map((store) => {
            const links = placeLinks(store);
            return (
              <li key={store.id} className={s.addr} data-store={store.id}>
                <div className={s.addrBody}>
                  <p className={s.addrName}>{store.shortName}</p>
                  <p className={s.addrSub}>{shortAddress(store.address)}<br />{LOCATIONS[store.id].subway}</p>
                </div>
                {links ? <a href={links.directions} target="_blank" rel="noreferrer" className={s.directionAction} aria-label={`${store.shortName} 길찾기`}>길찾기 <span aria-hidden="true">↗</span></a> : null}
              </li>
            );
          })}
        </ul>
        <a href={naverSearchUrl(SEARCH_QUERY)} target="_blank" rel="noreferrer" className={s.searchAction}>네이버에서 세 곳 검색 <span aria-hidden="true">↗</span></a>
      </div>
    </section>
  );
}
