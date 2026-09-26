import Image from "next/image";
import { LOCATIONS } from "@/lib/locations";
import { naverSearchUrl, placeLinks } from "@/lib/naver";
import { STORES } from "@/lib/stores";
import s from "./vip-lower.module.css";

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

/** 주소 목록은 접어 두고, 필요한 매장만 펼쳐 길찾기로 이동한다. */
export function Directions() {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);

  return (
    <section id="map" className={s.mapSection} aria-labelledby="map-title">
      <div className={s.mapHeading}>
        <h2 id="map-title" className={s.directionsTitle}>
          <Image src="/images/privilege/directions-title.webp" alt="서면에서 만나요" width={720} height={127} sizes="(min-width: 760px) 285px, 240px" className={s.titleArtwork} />
        </h2>
        <p>{walkLine()}<br />세 매장 모두 50m 이내</p>
      </div>
      <div className={s.directionSide}>
        <ul className={s.addrs}>
          {ordered.map((store) => {
            const links = placeLinks(store);
            return (
              <li key={store.id} className={s.addr} data-store={store.id}>
                <details className={s.addressDetails}>
                  <summary>
                    <span className={s.addrName}>{store.shortName}</span>
                    <span className={s.expandMark} aria-hidden="true" />
                  </summary>
                  <div className={s.addrBody}>
                    <p className={s.addrSub}>{shortAddress(store.address)}<br />{LOCATIONS[store.id].subway}</p>
                    {links ? <a href={links.directions} target="_blank" rel="noreferrer" className={s.directionAction} aria-label={`${store.shortName} 길찾기`}>네이버 길찾기 <span aria-hidden="true">↗</span></a> : null}
                  </div>
                </details>
              </li>
            );
          })}
        </ul>
        <a href={naverSearchUrl(SEARCH_QUERY)} target="_blank" rel="noreferrer" className={s.searchAction}>네이버에서 세 곳 검색 <span aria-hidden="true">↗</span></a>
      </div>
    </section>
  );
}
