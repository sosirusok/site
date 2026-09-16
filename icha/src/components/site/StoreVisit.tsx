import { LOCATIONS } from "@/lib/locations";
import { naverPlaceUrl, type Store } from "@/lib/stores";
import { StoreMap, type MapStore } from "./StoreMap";
import { STORE_COPY, parseHours } from "./StoreHelpers";
import styles from "./StoreVisit.module.css";

/** 영업시간 표 + 한 줄 */
export function StoreHours({ store }: { store: Store }) {
  const lines = parseHours(store);
  return (
    <div className={styles.block}>
      <table className={`table ${styles.hours}`}>
        <tbody>
          {lines.map((l) => (
            <tr key={l.days}>
              <th scope="row">{l.days}</th>
              <td>
                {l.openText}~{l.overnight ? "다음날 " : ""}{l.closeText}
                {l.lastOrder && <span className={styles.lo}>주문 마감 {l.lastOrder}</span>}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className={styles.note}>{STORE_COPY[store.id].hoursNote}</p>
    </div>
  );
}

/** 오시는 길 — LOCATIONS 값 표 + 그 매장만 찍은 지도(compact) + 네이버 플레이스 */
export function StoreVisit({ store }: { store: Store }) {
  const loc = LOCATIONS[store.id];
  const naver = naverPlaceUrl(store);
  const mapStore: MapStore | null = store.lat != null && store.lng != null ? {
    id: store.id, name: store.name, shortName: store.shortName, drink: store.drink,
    lat: store.lat, lng: store.lng, address: store.address, naverPlaceId: store.naverPlaceId,
    subway: loc.subway, directions: loc.directions, floor: loc.floor,
  } : null;

  return (
    <div className={styles.block}>
      <table className={`table ${styles.where}`}>
        <tbody>
          <tr>
            <th scope="row">주소</th>
            <td>
              {store.address}
              {store.addressJibun && <span className={styles.sub}>지번 {store.addressJibun}</span>}
            </td>
          </tr>
          <tr><th scope="row">지하철</th><td>{loc.subway}</td></tr>
          <tr><th scope="row">오는 길</th><td>{loc.directions}</td></tr>
          <tr><th scope="row">층</th><td>{loc.floor}</td></tr>
          {loc.landmarks.length > 0 && <tr><th scope="row">근처</th><td>{loc.landmarks.join(" · ")}</td></tr>}
          <tr><th scope="row">주차</th><td>{loc.parking}</td></tr>
        </tbody>
      </table>
      {mapStore && (
        <div className={styles.mapWrap}>
          <StoreMap stores={[mapStore]} focusId={store.id} compact height={260} />
        </div>
      )}
      <div className={styles.links}>
        {naver && <a href={naver} target="_blank" rel="noreferrer" className="btn btn-outline">네이버 플레이스에서 보기</a>}
        {store.phone && <a href={`tel:${store.phone.replace(/-/g, "")}`} className="btn btn-outline">전화 걸기</a>}
      </div>
    </div>
  );
}
