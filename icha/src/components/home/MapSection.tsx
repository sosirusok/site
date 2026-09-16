import { Art } from "@/components/art/Art";
import { StoreMap, type MapStore } from "@/components/site/StoreMap";
import { LOCATIONS } from "@/lib/locations";
import { STORES } from "@/lib/stores";
import styles from "./MapSection.module.css";

export function MapSection() {
  const mapStores: MapStore[] = STORES.filter((s) => s.lat != null && s.lng != null).map((s) => ({
    id: s.id, name: s.name, shortName: s.shortName, drink: s.drink, lat: s.lat!, lng: s.lng!, address: s.address, naverPlaceId: s.naverPlaceId,
    subway: LOCATIONS[s.id].subway, directions: LOCATIONS[s.id].directions, floor: LOCATIONS[s.id].floor, parking: LOCATIONS[s.id].parking,
  }));
  return (
    <section id="map" className="section" aria-labelledby="map-title">
      <div className="wrap">
        <div className="sec-head">
          <Art name="icon-store" width={42} />
          <h2 id="map-title" className="h2">오시는 길</h2>
        </div>
        <p className={styles.intro}>
          서면역 6번 출구로 나와 밀리오레 쪽으로 오면 돼요. 세 집은 서로 걸어서 2~3분 거리라 1차 끝나고 바로 옮기기 좋아요.
        </p>
        <div className={styles.mapWrap}>
          <StoreMap stores={mapStores} height={420} />
        </div>
      </div>
    </section>
  );
}
