import { Button } from "@/components/ui/Button";
import { LOCATIONS } from "@/lib/locations";
import { placeLinks } from "@/lib/naver";
import type { Store } from "@/lib/stores";
import { LazyStoreMap } from "./LazyStoreMap";
import type { MapStore } from "./StoreMap";
import styles from "./StoreVisit.module.css";

/** 위치 — 지도 카드(그 매장 + 서면역, 200px) 아래 정보 표(주소·지하철·층·주차·오는 길)와 [길찾기]. 문구는 lib/locations.ts 값 그대로. */
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
        <div className={styles.map}>
          <LazyStoreMap stores={[mapStore]} focusId={store.id} compact height={220} />
        </div>
      )}
      <dl className="kv">
        <dt>주소</dt><dd>{store.address}</dd>
        <dt>지하철</dt><dd>{loc.subway}</dd>
        <dt>층</dt><dd>{loc.floor}</dd>
        <dt>주차</dt><dd>{loc.parking}</dd>
        <dt>가는 길</dt><dd>{loc.directions}</dd>
      </dl>
      {links && <Button href={links.directions} variant="outline" block srSuffix={` — ${store.shortName}`}>네이버 지도 길찾기</Button>}
    </div>
  );
}
