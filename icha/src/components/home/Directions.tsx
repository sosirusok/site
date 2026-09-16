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

/** 오시는 길 — 한 줄 + 지도 + 주소 세 줄 */
export function Directions() {
  const mapStores: MapStore[] = STORES.filter((st) => st.lat != null && st.lng != null).map((st) => ({
    id: st.id, name: st.name, shortName: st.shortName, drink: st.drink, lat: st.lat!, lng: st.lng!, address: st.address, naverPlaceId: st.naverPlaceId,
  }));
  // compact 지도는 첫 매장을 가운데 두므로, 세 곳 한가운데에 가장 가까운 매장을 앞에 둔다
  if (mapStores.length > 1) {
    const cLat = mapStores.reduce((a, m) => a + m.lat, 0) / mapStores.length;
    const cLng = mapStores.reduce((a, m) => a + m.lng, 0) / mapStores.length;
    mapStores.sort((a, b) => (a.lat - cLat) ** 2 + (a.lng - cLng) ** 2 - ((b.lat - cLat) ** 2 + (b.lng - cLng) ** 2));
  }
  return (
    <section className="section" aria-labelledby="map-title">
      <div className="wrap">
        <div className="section-h">
          <h2 id="map-title" className="h2">오시는 길</h2>
        </div>
        <p className="cap">{walkLine()}</p>
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
