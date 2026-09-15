import { LOCATIONS } from "@/lib/locations";
import type { Store } from "@/lib/stores";
import { naverPlaceUrl } from "@/lib/stores";
import { StoreMap, type MapStore } from "./StoreMap";
import { openStatus, parseHours } from "./StoreHelpers";
import styles from "./StoreVisit.module.css";

/** 영업시간 표 + 주소·전화 + 실제 지도(compact) + 출구·길·층·주차 */
export function StoreVisit({ store }: { store: Store }) {
  const loc = LOCATIONS[store.id];
  const st = openStatus(store);
  const lines = parseHours(store);
  const naver = naverPlaceUrl(store);
  const mapStore: MapStore | null = store.lat != null && store.lng != null ? {
    id: store.id, name: store.name, shortName: store.shortName, drink: store.drink,
    lat: store.lat, lng: store.lng, address: store.address, naverPlaceId: store.naverPlaceId,
    subway: loc.subway, directions: loc.directions, floor: loc.floor,
  } : null;

  return (
    <div className={styles.grid}>
      <div className={styles.col}>
        <h3 className={styles.label}>영업시간</h3>
        <p className={`${styles.now} ${st.open ? styles.open : ""}`}><span className={styles.dot} aria-hidden="true" />{st.text}</p>
        <table className={styles.table}>
          <tbody>
            {lines.map((l) => (
              <tr key={l.days}>
                <th scope="row">{l.days}</th>
                <td className="num">{l.openText} – {l.overnight ? "다음날 " : ""}{l.closeText}</td>
                <td className={styles.lo}>{l.lastOrder ? `주문 마감 ${l.lastOrder}` : ""}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {store.hoursNote && <p className={styles.note}>{store.hoursNote}</p>}

        <h3 className={styles.label}>주소 · 전화</h3>
        <address className={styles.addr}>
          <p className={styles.addrLine}>{store.address}</p>
          {store.addressJibun && <p className={styles.addrSub}>지번 {store.addressJibun}</p>}
          {store.phone && <a href={`tel:${store.phone.replace(/-/g, "")}`} className={`num ${styles.tel}`}>{store.phone}</a>}
        </address>
        <dl className={styles.how}>
          <div><dt>지하철</dt><dd>{loc.subway}</dd></div>
          <div><dt>오는 길</dt><dd>{loc.directions}</dd></div>
          <div><dt>층</dt><dd>{loc.floor}</dd></div>
          <div><dt>주차</dt><dd>{loc.parking}</dd></div>
          {loc.landmarks.length > 0 && <div><dt>근처</dt><dd>{loc.landmarks.join(" · ")}</dd></div>}
        </dl>
        {naver && <a href={naver} target="_blank" rel="noreferrer" className={styles.naver}>네이버 플레이스에서 보기 ↗</a>}
      </div>
      <div className={styles.mapCol}>
        {mapStore ? <StoreMap stores={[mapStore]} focusId={store.id} compact height={380} /> : <p className={styles.note}>지도 좌표를 준비 중이에요.</p>}
      </div>
    </div>
  );
}
