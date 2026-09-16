import { LOCATIONS } from "@/lib/locations";
import { STORES } from "@/lib/stores";
import { StoreMap, type MapStore } from "./StoreMap";
import styles from "./HomeMapSection.module.css";

/** 지도 컴포넌트에 넘길 매장 목록. 길 설명은 지도 패널에서, 출구·층·주차는 아래 표에서 보여 준다. */
export function mapStores(): MapStore[] {
  return STORES.filter((s) => s.lat != null && s.lng != null).map((s) => ({
    id: s.id, name: s.name, shortName: s.shortName, drink: s.drink,
    lat: s.lat!, lng: s.lng!, address: s.address, naverPlaceId: s.naverPlaceId,
    directions: LOCATIONS[s.id].directions,
  }));
}

/** 오시는 길 — 실제 지도 + 매장별 주소·출구·층·주차 표. 위치 문구는 LOCATIONS 값 그대로. */
export function HomeMapSection() {
  const stores = mapStores();
  return (
    <div className={styles.root}>
      {stores.length > 0 && (
        <div className={styles.map}>
          {/* compact: 좌표로 계산한 도보 시간 목록을 숨기고(LOCATIONS 와 다른 숫자가 보이지 않게) 지도와 패널만 쓴다 */}
          <StoreMap stores={stores} compact height={420} />
        </div>
      )}
      <div className={styles.tables}>
        {STORES.map((s, i) => {
          const loc = LOCATIONS[s.id];
          return (
            <table key={s.id} className={`table ${styles.table}`}>
              <caption className={styles.caption}>{i + 1}. {s.name}</caption>
              <tbody>
                <tr><th scope="row">주소</th><td>{s.address}</td></tr>
                <tr><th scope="row">지하철</th><td>{loc.subway}</td></tr>
                <tr><th scope="row">층</th><td>{loc.floor}</td></tr>
                <tr><th scope="row">주차</th><td>{loc.parking}</td></tr>
              </tbody>
            </table>
          );
        })}
      </div>
    </div>
  );
}
