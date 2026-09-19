import type { CSSProperties } from "react";
import { SectionLabel, StickerButton } from "@/components/site/Kit";
import { LazyStoreMap } from "@/components/site/LazyStoreMap";
import type { MapStore } from "@/components/site/StoreMap";
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

/**
 * 오시는 길 — 키트 제목판(label-map) 왼쪽 + 노란 콜아웃 "3개 매장 50m 이내"(제목판 오른쪽 끝을 살짝 덮는다), 그 아래 어두운 띠 한 줄(출구·도보),
 * 테이프로 붙인 지도 종이(−1.5°), 주소 셋을 적은 크림 메모 한 장(300px, 2°)이 지도의 오른쪽 아래 모서리를 덮고(길찾기 꼬리표는 메모 안),
 * [네이버에서 검색] 스티커(−2°)가 메모의 왼쪽 아래 모서리를 덮는다.
 */
export function Directions() {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  const mapStores: MapStore[] = ordered.filter((st) => st.lat != null && st.lng != null).map((st) => ({
    id: st.id, name: st.name, shortName: st.shortName, drink: st.drink, lat: st.lat!, lng: st.lng!, address: st.address, naverPlaceId: st.naverPlaceId,
  }));
  return (
    <section className={s.dir} aria-labelledby="map-title">
      <div className={s.dirHead}>
        <SectionLabel kind="map" color="blue" id="map-title" className={s.dirLabel}>오시는 길</SectionLabel>
        <p className={`callout ${s.dirCallout}`}>3개 매장 50m 이내</p>
        <p className={`band ${s.dirLead}`}>{walkLine()}</p>
      </div>
      <div className={s.mapWrap}>
        <div className={`map-paper ${s.mapPaper}`}>
          <LazyStoreMap stores={mapStores} compact hidePanel height={200} />
        </div>
        <div className={`paper ${s.addrPaper}`} style={{ "--r": "2deg" } as CSSProperties}>
          <ul className={s.addrs}>
            {ordered.map((st) => {
              const links = placeLinks(st);
              return (
                <li key={st.id} className={s.addrRow} data-store={st.id}>
                  <div className={s.addrBody}>
                    <p className={`disp ${s.addrName}`}><span className={s.addrNo}>{st.course.n}차</span> {st.shortName}</p>
                    <p className={s.addrSub}>{shortAddress(st.address)} · {LOCATIONS[st.id].subway}</p>
                  </div>
                  {links && <StickerButton kind="directions" tilt={0} secondary href={links.directions} suffix={` — ${st.shortName}`} className={s.addrLink}>길찾기</StickerButton>}
                </li>
              );
            })}
          </ul>
        </div>
        <div className={s.searchRow}>
          <StickerButton kind="search" href={naverSearchUrl(SEARCH_QUERY)} style={{ "--r": "-2deg" } as CSSProperties}>네이버에서 검색</StickerButton>
        </div>
      </div>
    </section>
  );
}
