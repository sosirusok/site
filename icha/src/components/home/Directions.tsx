import { StoreMap, type MapStore } from "@/components/site/StoreMap";
import { LOCATIONS } from "@/lib/locations";
import { STORES } from "@/lib/stores";
import s from "./home.module.css";

/** "서면역 6번 출구에서 걸어서 2~4분" */
function walkLine(): string {
  const v = Object.values(LOCATIONS);
  const exits = Array.from(new Set(v.map((l) => l.exit))).join("·");
  const mins = v.map((l) => l.walkMin);
  const lo = Math.min(...mins), hi = Math.max(...mins);
  return `서면역 ${exits}번 출구에서 걸어서 ${lo === hi ? `${lo}분` : `${lo}~${hi}분`}`;
}

/** "부산 부산진구 동천로85번길 14 1,2층" → "동천로85번길 14 1,2층" */
function shortAddress(a: string): string {
  return a.replace(/^부산(광역시)?\s*부산진구\s*/, "");
}

/** 오시는 길 — 한 줄 + 지도(매장색 핀, STORES 순서 그대로) + 주소 세 줄 */
export function Directions() {
  const mapStores: MapStore[] = STORES.filter((st) => st.lat != null && st.lng != null).map((st) => ({
    id: st.id, name: st.name, shortName: st.shortName, drink: st.drink, lat: st.lat!, lng: st.lng!, address: st.address, naverPlaceId: st.naverPlaceId,
  }));
  return (
    <section className="section" aria-labelledby="map-title">
      <div className="wrap">
        <div className="section-h">
          <h2 id="map-title" className="h2-event">오시는 길</h2>
        </div>
        <p className="cap">세 집 모두 50m 안, {walkLine()}</p>
        <div className={s.mapBox}>
          <StoreMap stores={mapStores} compact hidePanel height={200} />
        </div>
        <dl className={`kv ${s.addr}`}>
          {STORES.map((st) => (
            <div key={st.id} style={{ display: "contents" }}>
              <dt>{st.shortName}</dt>
              <dd>{shortAddress(st.address)}</dd>
            </div>
          ))}
        </dl>
      </div>
    </section>
  );
}
