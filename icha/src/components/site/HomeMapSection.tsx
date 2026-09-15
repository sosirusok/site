import { distanceM, SEOMYEON_STATION, walkMinutes } from "@/lib/geo";
import { LOCATIONS } from "@/lib/locations";
import { STORES } from "@/lib/stores";
import { StoreMap, type MapStore } from "./StoreMap";
import { SectionHead } from "./HomeSectionHead";
import styles from "./HomeMapSection.module.css";

/** 세 매장 좌표를 지도 컴포넌트에 넘기고, 서로 간 도보 시간을 좌표로 계산해 문장을 만든다. */
export function mapStores(): MapStore[] {
  return STORES.filter((s) => s.lat != null && s.lng != null).map((s) => {
    const loc = LOCATIONS[s.id];
    return {
      id: s.id, name: s.name, shortName: s.shortName, drink: s.drink,
      lat: s.lat!, lng: s.lng!, address: s.address, naverPlaceId: s.naverPlaceId,
      subway: loc.subway, directions: loc.directions, floor: loc.floor,
    };
  });
}

export function HomeMapSection() {
  const stores = mapStores();
  if (!stores.length) return null;
  const pair: number[] = [];
  for (let i = 0; i < stores.length; i++) for (let j = i + 1; j < stores.length; j++) pair.push(walkMinutes(distanceM(stores[i]!, stores[j]!)));
  const between = pair.length ? `${Math.min(...pair)}~${Math.max(...pair)}분` : "";
  const fromStation = stores.map((s) => walkMinutes(distanceM(SEOMYEON_STATION, s)));
  const station = `${Math.min(...fromStation)}~${Math.max(...fromStation)}분`;

  return (
    <section id="map" className={`section ${styles.section}`} aria-labelledby="map-title">
      <div className="wrap">
        <SectionHead
          id="map-title"
          eyebrow="찾아오는 길"
          title={<>세 곳은 서로<br />걸어서 <em>{between || "2~3분"}</em></>}
          sub={`${SEOMYEON_STATION.name} 6번 출구에서 도보 ${station}. 1차에서 2차로 옮기기 좋은 거리예요. 핀을 누르면 길 안내가 나와요.`}
        />
        <div className={`rise rise-d1 ${styles.map}`}>
          <StoreMap stores={stores} height={480} />
        </div>
        <ul className={styles.notes}>
          {STORES.map((s, i) => {
            const loc = LOCATIONS[s.id];
            return (
              <li key={s.id} className="rise">
                <p className={styles.noteName}><span>{String(i + 1).padStart(2, "0")}</span>{s.shortName} <em>{loc.floor}</em></p>
                <p className={styles.noteLine}>{loc.directions}</p>
                <p className={styles.noteSmall}>{loc.subway} · {loc.parking}</p>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
