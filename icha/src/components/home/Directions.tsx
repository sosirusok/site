import { StoreMap, type MapStore } from "@/components/site/StoreMap";
import { LOCATIONS } from "@/lib/locations";
import { naverSearchUrl, placeLinks } from "@/lib/naver";
import { STORES } from "@/lib/stores";
import s from "./home.module.css";

/** "서면역 6번 출구 걸어서 2~4분" — 값은 lib/locations.ts */
function walkLine(): string {
  const v = Object.values(LOCATIONS);
  const exits = Array.from(new Set(v.map((l) => l.exit))).join("·");
  const mins = v.map((l) => l.walkMin);
  const lo = Math.min(...mins), hi = Math.max(...mins);
  return `서면역 ${exits}번 출구 걸어서 ${lo === hi ? `${lo}분` : `${lo}~${hi}분`}`;
}

/** "부산 부산진구 동천로85번길 14 1,2층" → "동천로85번길 14 1,2층" */
function shortAddress(a: string): string {
  return a.replace(/^부산(광역시)?\s*부산진구\s*/, "");
}

/** 네이버 검색창에 그대로 넣는 말 */
const SEARCH_QUERY = "서면 알콜부시기";

/** 오시는 길 — 지도(매장색 핀)와 주소 세 줄, 길찾기는 작은 글자 링크. */
export function Directions() {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  const mapStores: MapStore[] = ordered.filter((st) => st.lat != null && st.lng != null).map((st) => ({
    id: st.id, name: st.name, shortName: st.shortName, drink: st.drink, lat: st.lat!, lng: st.lng!, address: st.address, naverPlaceId: st.naverPlaceId,
  }));
  return (
    <section className={`wrap ${s.sec}`} aria-labelledby="map-title">
      <div className={s.head}>
        <p className={`kicker ${s.kick}`}>세 집 모두 50m 안</p>
        <h2 id="map-title" className={`tube ${s.title}`}>오시는 길</h2>
        <p className={s.lead}>{walkLine()}. 한 골목에서 1차·2차·3차가 끝나요.</p>
      </div>
      <div className={s.mapBox}>
        <StoreMap stores={mapStores} compact hidePanel height={168} />
      </div>
      <ul className={s.addrs}>
        {ordered.map((st) => {
          const links = placeLinks(st);
          return (
            <li key={st.id} className={s.addrRow} data-store={st.id}>
              <span className={s.addrDot} aria-hidden="true" />
              <div className={s.addrBody}>
                <p className={s.addrName}>{st.course.n}차 {st.shortName}</p>
                <p className={s.addrSub}>{shortAddress(st.address)}</p>
              </div>
              {links && <a className={s.addrLink} href={links.directions} target="_blank" rel="noreferrer">길찾기</a>}
            </li>
          );
        })}
      </ul>
      <a className={`btn btn-secondary btn-block ${s.search}`} href={naverSearchUrl(SEARCH_QUERY)} target="_blank" rel="noreferrer">네이버에서 ‘{SEARCH_QUERY}’ 검색</a>
    </section>
  );
}
