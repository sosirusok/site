import { Art } from "@/components/art/Art";
import { StoreMap, type MapStore } from "@/components/site/StoreMap";
import { LOCATIONS } from "@/lib/locations";
import { STORES } from "@/lib/stores";
import styles from "./MapSection.module.css";

/** "부산 부산진구 동천로85번길 14 1,2층" → "동천로85번길 14 1,2층" */
function streetOnly(address: string): string {
  const t = address.split(" ");
  const i = t.findIndex((x) => /(로|길)$/.test(x));
  return i > 0 ? t.slice(i).join(" ") : address;
}

export function MapSection() {
  const mapStores: MapStore[] = STORES.filter((s) => s.lat != null && s.lng != null).map((s) => ({
    id: s.id, name: s.name, shortName: s.shortName, drink: s.drink, lat: s.lat!, lng: s.lng!, address: s.address, naverPlaceId: s.naverPlaceId,
    subway: LOCATIONS[s.id].subway, directions: LOCATIONS[s.id].directions, floor: LOCATIONS[s.id].floor, parking: LOCATIONS[s.id].parking,
  }));
  const locs = Object.values(LOCATIONS);
  const exits = Array.from(new Set(locs.map((l) => l.exit))).join("·");
  const mins = locs.map((l) => l.walkMin);
  const lo = Math.min(...mins), hi = Math.max(...mins);
  return (
    <section id="map" className={`section ${styles.section}`} aria-labelledby="map-title">
      <div className="wrap">
        <div className="sec-head">
          <Art name="icon-store" width={36} />
          <h2 id="map-title" className="h2">오시는 길</h2>
        </div>
        <p className={styles.line}>서면역 {exits}번 출구로 나와서 걸어서 {lo === hi ? `${lo}분` : `${lo}~${hi}분`}이에요.</p>
        <div className={styles.map}>
          <StoreMap stores={mapStores} compact hidePanel height={240} />
        </div>
        <ul className={styles.addr}>
          {STORES.map((s) => (
            <li key={s.id} data-store={s.id}><b>{s.shortName}</b> — {streetOnly(s.address)}</li>
          ))}
        </ul>
      </div>
    </section>
  );
}
