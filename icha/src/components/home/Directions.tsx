import type { CSSProperties } from "react";
import { SectionLabel, StickerButton } from "@/components/site/Kit";
import { Piece } from "@/components/site/Poster";
import { StoreMap, type MapStore } from "@/components/site/StoreMap";
import { LOCATIONS } from "@/lib/locations";
import { naverSearchUrl, placeLinks } from "@/lib/naver";
import { STORES } from "@/lib/stores";
import s from "./home.module.css";

/** "서면역 6번 출구 도보 2~4분" — 값은 lib/locations.ts */
function walkLine(): string {
  const v = Object.values(LOCATIONS);
  const exits = Array.from(new Set(v.map((l) => l.exit))).join("·");
  const mins = v.map((l) => l.walkMin);
  const lo = Math.min(...mins), hi = Math.max(...mins);
  return `서면역 ${exits}번 출구 도보 ${lo === hi ? `${lo}분` : `${lo}~${hi}분`}`;
}

/** "부산 부산진구 동천로85번길 14 1,2층" → "동천로85번길 14 1,2층" */
function shortAddress(a: string): string {
  return a.replace(/^부산(광역시)?\s*부산진구\s*/, "");
}

/** 네이버 검색창에 그대로 넣는 말 */
const SEARCH_QUERY = "서면 알콜부시기";

/** 오시는 길 — 제목 옆 거리 한 줄(어두운 띠), 테이프로 붙인 지도 조각(밝은 타일), 주소 세 줄이 적힌 종이 한 장, 노란 스티커 [네이버 검색] */
export function Directions() {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  const mapStores: MapStore[] = ordered.filter((st) => st.lat != null && st.lng != null).map((st) => ({
    id: st.id, name: st.name, shortName: st.shortName, drink: st.drink, lat: st.lat!, lng: st.lng!, address: st.address, naverPlaceId: st.naverPlaceId,
  }));
  return (
    <section className={s.dir} aria-labelledby="map-title">
      <div className={s.dirHead}>
        <SectionLabel kind="map" color="blue" id="map-title">오시는 길</SectionLabel>
        <p className={`info ${s.dirLead}`}>3개 매장 모두 50m 이내 · {walkLine()}</p>
      </div>
      <div className={s.mapWrap}>
        <div className="map-paper">
          <StoreMap stores={mapStores} compact hidePanel height={190} />
        </div>
        <Piece name="note-today" rotate={5} sizes="120px" className={s.mapNote} />
      </div>
      <div className={`paper paper-l ${s.addrPaper}`}>
        <ul className={s.addrs}>
          {ordered.map((st) => {
            const links = placeLinks(st);
            return (
              <li key={st.id} className={s.addrRow} data-store={st.id}>
                <span className={`plate plate-store plate-sm ${s.addrNo}`} style={{ "--r": "-3deg" } as CSSProperties}>{st.course.n}차</span>
                <div className={s.addrBody}>
                  <p className={s.addrName}>{st.shortName}</p>
                  <p className={s.addrSub}>{shortAddress(st.address)} · {LOCATIONS[st.id].subway}</p>
                </div>
                {links && <a className={`link ${s.addrLink}`} href={links.directions} target="_blank" rel="noreferrer">길찾기</a>}
              </li>
            );
          })}
        </ul>
      </div>
      <div className={s.searchRow}>
        <StickerButton kind="search" href={naverSearchUrl(SEARCH_QUERY)}>네이버 검색</StickerButton>
      </div>
    </section>
  );
}
