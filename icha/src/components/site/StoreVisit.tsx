import { LOCATIONS } from "@/lib/locations";
import { naverPlaceUrl, type Store } from "@/lib/stores";
import { StoreMap, type MapStore } from "./StoreMap";
import { parseHours } from "./StoreHelpers";
import styles from "./StoreVisit.module.css";

/** 영업시간 — 요일이 전부 같으면 한 줄, 아니면 요일마다 한 줄 */
export function StoreHours({ store }: { store: Store }) {
  const lines = parseHours(store);
  const first = lines[0];
  const rows = first && lines.every((l) => l.time === first.time) ? [{ ...first, days: "매일" }] : lines;
  return (
    <ul className={styles.hours}>
      {rows.map((l) => (
        <li key={l.days}>
          <b>{l.days}</b>
          <span>
            {l.openText}~{l.overnight ? "다음날 " : ""}{l.closeText}
            {l.lastOrder && <span className={styles.lo}> · 주문 마감 {l.lastOrder}</span>}
          </span>
        </li>
      ))}
    </ul>
  );
}

/** 오시는 길 — 지하철 한 줄, 길 설명 한 줄, 그 매장만 찍은 지도, 네이버 플레이스 */
export function StoreVisit({ store }: { store: Store }) {
  const loc = LOCATIONS[store.id];
  const naver = naverPlaceUrl(store);
  // 길 설명은 첫 문장만 (locations.ts 값 그대로)
  const directions = loc.directions.split(/(?<=\.)\s+/)[0] ?? loc.directions;
  const mapStore: MapStore | null = store.lat != null && store.lng != null ? {
    id: store.id, name: store.name, shortName: store.shortName, drink: store.drink,
    lat: store.lat, lng: store.lng, address: store.address, naverPlaceId: store.naverPlaceId,
    subway: loc.subway, directions: loc.directions, floor: loc.floor,
  } : null;

  return (
    <div className={styles.block}>
      <p className={styles.line}><b>{loc.subway}</b> · {loc.floor}</p>
      <p className={styles.line}>{directions}</p>
      {mapStore && (
        <div className={styles.mapWrap}>
          <StoreMap stores={[mapStore]} focusId={store.id} compact height={220} />
        </div>
      )}
      {naver && <a href={naver} target="_blank" rel="noreferrer" className={`btn btn-outline ${styles.naver}`}>네이버 플레이스</a>}
    </div>
  );
}
