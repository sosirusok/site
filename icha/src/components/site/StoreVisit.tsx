import { LOCATIONS } from "@/lib/locations";
import { placeLinks } from "@/lib/naver";
import type { Store } from "@/lib/stores";
import { StickerButton } from "./Kit";
import { StoreMap, type MapStore } from "./StoreMap";
import styles from "./StoreVisit.module.css";

/** 위치 — 테이프로 붙인 지도 조각(그 매장만, 높이 190), 종이 한 장(지하철·층·주차·오는 길), 키트 꼬리표 [길찾기](40px, 네이버 지도). 문구는 lib/locations.ts 값 그대로. */
export function StoreVisit({ store }: { store: Store }) {
  const loc = LOCATIONS[store.id];
  const links = placeLinks(store);
  const mapStore: MapStore | null = store.lat != null && store.lng != null ? {
    id: store.id, name: store.name, shortName: store.shortName, drink: store.drink,
    lat: store.lat, lng: store.lng, address: store.address, naverPlaceId: store.naverPlaceId,
    subway: loc.subway, directions: loc.directions, floor: loc.floor, parking: loc.parking,
  } : null;

  return (
    <div className={styles.block}>
      {mapStore && (
        <div className={`map-paper ${styles.map}`}>
          <StoreMap stores={[mapStore]} focusId={store.id} compact height={190} />
        </div>
      )}
      <div className={`paper paper-l ${styles.paper}`}>
        <dl className="kv">
          <dt>지하철</dt>
          <dd>{loc.subway}</dd>
          <dt>층</dt>
          <dd>{loc.floor}</dd>
          <dt>주차</dt>
          <dd>{loc.parking}</dd>
          <dt>오는 길</dt>
          <dd>{loc.directions}</dd>
        </dl>
        {links && <StickerButton kind="directions" tilt={0} secondary href={links.directions} className={styles.way}>길찾기</StickerButton>}
      </div>
    </div>
  );
}
