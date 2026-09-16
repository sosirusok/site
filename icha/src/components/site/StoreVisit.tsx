import Link from "next/link";
import { LOCATIONS } from "@/lib/locations";
import { giftStoresFor, naverPlaceUrl, type Store } from "@/lib/stores";
import { StoreMap, type MapStore } from "./StoreMap";
import styles from "./StoreVisit.module.css";

/** 위치 — 그 매장만 찍은 지도, 지하철·층·주차·오는 길, 50m 안 다른 두 집, 네이버 플레이스. 문구는 lib/locations.ts 값 그대로. */
export function StoreVisit({ store }: { store: Store }) {
  const loc = LOCATIONS[store.id];
  const naver = naverPlaceUrl(store);
  const others = giftStoresFor(store.id);
  // 오는 길은 첫 문장만 (두 줄 안에 들어오게)
  const cut = loc.directions.indexOf(". ");
  const way = cut > 0 ? loc.directions.slice(0, cut + 1) : loc.directions;
  const mapStore: MapStore | null = store.lat != null && store.lng != null ? {
    id: store.id, name: store.name, shortName: store.shortName, drink: store.drink,
    lat: store.lat, lng: store.lng, address: store.address, naverPlaceId: store.naverPlaceId,
    subway: loc.subway, directions: loc.directions, floor: loc.floor, parking: loc.parking,
  } : null;

  return (
    <div className={styles.block}>
      {mapStore && (
        <div className={styles.map}>
          <StoreMap stores={[mapStore]} focusId={store.id} compact height={200} />
        </div>
      )}
      <dl className="kv">
        <dt>지하철</dt>
        <dd>{loc.subway}</dd>
        <dt>층</dt>
        <dd>{loc.floor}</dd>
        <dt>주차</dt>
        <dd>{loc.parking}</dd>
        <dt>오는 길</dt>
        <dd>{way}</dd>
      </dl>
      <p className={`cap ${styles.others}`}>
        50m 안 다른 두 집:{" "}
        {others.map((o, i) => (
          <span key={o.id}>
            {i > 0 && <span className={styles.sep}>·</span>}
            <Link href={`/stores/${o.id}`} className={styles.other} data-store={o.id}>
              <span className="dot" aria-hidden="true" />{o.shortName}
            </Link>
          </span>
        ))}
      </p>
      {naver && <a href={naver} target="_blank" rel="noreferrer" className="btn btn-secondary btn-block">네이버 플레이스에서 보기</a>}
    </div>
  );
}
