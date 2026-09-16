import { LOCATIONS } from "@/lib/locations";
import type { Store } from "@/lib/stores";
import { StoreMap, type MapStore } from "./StoreMap";
import { openStatus, parseHours } from "./StoreHelpers";
import styles from "./StoreVisit.module.css";

/** 영업시간 표 + 주소·전화·출구·길 설명·층·주차(LOCATIONS) + 실제 지도(compact, 그 매장만) */
export function StoreVisit({ store }: { store: Store }) {
  const loc = LOCATIONS[store.id];
  const st = openStatus(store);
  const lines = parseHours(store);
  const mapStore: MapStore | null = store.lat != null && store.lng != null ? {
    id: store.id, name: store.name, shortName: store.shortName, drink: store.drink,
    lat: store.lat, lng: store.lng, address: store.address, naverPlaceId: store.naverPlaceId,
  } : null;

  return (
    <div className={styles.grid}>
      <div className={styles.col}>
        <h3 className={styles.label}>영업시간</h3>
        <table className={`table ${styles.hours}`}>
          <tbody>
            {lines.map((l) => (
              <tr key={l.days}>
                <th scope="row">{l.days}</th>
                <td>
                  {l.openText} – {l.overnight ? "다음날 " : ""}{l.closeText}
                  {l.lastOrder && <span className={styles.lo}> · 주문 마감 {l.lastOrder}</span>}
                </td>
              </tr>
            ))}
            <tr>
              <th scope="row">현재</th>
              <td className={st.open ? styles.open : styles.closed}>{st.text}</td>
            </tr>
          </tbody>
        </table>

        <h3 className={styles.label}>주소 · 오시는 길</h3>
        <dl className={`dl ${styles.dl}`}>
          <dt>주소</dt>
          <dd>
            {store.address}
            {store.addressJibun && <span className={styles.sub}>지번 {store.addressJibun}</span>}
          </dd>
          <dt>전화</dt>
          <dd>{store.phone ? <a href={`tel:${store.phone.replace(/-/g, "")}`} className={styles.tel}>{store.phone}</a> : "-"}</dd>
          <dt>지하철</dt>
          <dd>{loc.subway}</dd>
          <dt>오는 길</dt>
          <dd>{loc.directions}</dd>
          <dt>층</dt>
          <dd>{loc.floor}</dd>
          <dt>주차</dt>
          <dd>{loc.parking}</dd>
        </dl>
      </div>
      <div className={styles.mapCol}>
        {mapStore ? <StoreMap stores={[mapStore]} focusId={store.id} compact height={340} /> : <p className={styles.note}>지도 좌표를 준비 중입니다.</p>}
      </div>
    </div>
  );
}
