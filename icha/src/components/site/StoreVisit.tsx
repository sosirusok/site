import { LOCATIONS } from "@/lib/locations";
import { placeLinks } from "@/lib/naver";
import type { Store } from "@/lib/stores";
import { StickerButton } from "./Kit";
import { LazyStoreMap } from "./LazyStoreMap";
import type { MapStore } from "./StoreMap";
import styles from "./StoreVisit.module.css";

/**
 * 위치 — 테이프로 붙인 지도 조각(그 매장만, 높이 200, −1°), 그 오른쪽 아래 모서리를 덮는 크림 메모 한 장(300px, 2°: 지하철·층·주차·오는 길을 Do Hyeon 머리말 + 본문으로),
 * 메모 안 오른쪽 아래에 키트 꼬리표 [길찾기](40px, 네이버 지도). 문구는 lib/locations.ts 값 그대로. 표(kv) 없음.
 */
export function StoreVisit({ store }: { store: Store }) {
  const loc = LOCATIONS[store.id];
  const links = placeLinks(store);
  const mapStore: MapStore | null = store.lat != null && store.lng != null ? {
    id: store.id, name: store.name, shortName: store.shortName, drink: store.drink,
    lat: store.lat, lng: store.lng, address: store.address, naverPlaceId: store.naverPlaceId,
    subway: loc.subway, directions: loc.directions, floor: loc.floor, parking: loc.parking,
  } : null;
  const lines: [string, string][] = [["지하철", loc.subway], ["층", loc.floor], ["주차", loc.parking], ["오는 길", loc.directions]];

  return (
    <div className={styles.block}>
      {mapStore && (
        <div className={`map-paper ${styles.map}`}>
          <LazyStoreMap stores={[mapStore]} focusId={store.id} compact height={200} />
        </div>
      )}
      <div className={`paper ${styles.paper}`}>
        <ul className={styles.lines}>
          {lines.map(([k, v]) => (
            <li key={k} className={styles.line}><span className={`disp ${styles.key}`}>{k}</span> {v}</li>
          ))}
        </ul>
        {links && <StickerButton kind="directions" tilt={0} secondary href={links.directions} className={styles.way}>길찾기</StickerButton>}
      </div>
    </div>
  );
}
