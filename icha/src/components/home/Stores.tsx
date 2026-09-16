import Image from "next/image";
import Link from "next/link";
import { Art } from "@/components/art/Art";
import { openStatus, todayHoursText } from "@/components/site/StoreHelpers";
import { LOCATIONS } from "@/lib/locations";
import { STORES, naverPlaceUrl } from "@/lib/stores";
import styles from "./Stores.module.css";

/** 참여 매장: 사장님 매장 카드(그림) 위에 실제 링크를 얹고, 아래에 오늘 영업시간·주소·실사진 */
export function Stores() {
  return (
    <section id="stores" className="section" aria-labelledby="stores-title">
      <div className="wrap">
        <div className="sec-head">
          <Art name="icon-store" width={42} />
          <h2 id="stores-title" className="h2">참여 매장</h2>
        </div>
        <p className={styles.intro}>세 집 모두 서면역 6번 출구 쪽 골목에 있어요. 걸어서 2~4분이면 어디든 갈 수 있어요.</p>
        <ul className={styles.grid}>
          {STORES.map((s) => {
            const st = openStatus(s);
            const loc = LOCATIONS[s.id];
            const photos = s.images.filter((i) => i.kind !== "menu").slice(0, 3);
            return (
              <li key={s.id} className={styles.item} data-store={s.id}>
                <div className={styles.card}>
                  <Art name={`card-${s.id}`} alt={`${s.shortName} — ${s.drink} 증정`} sizes="(min-width: 760px) 300px, 80vw" />
                  {/* 그림 속 두 버튼 자리에 실제 링크를 얹는다 */}
                  <Link href={`/stores/${s.id}`} className={`${styles.hit} ${styles.hitMenu}`} aria-label={`${s.shortName} 메뉴 보기`} />
                  <Link href={`/verify?from=${s.id}`} className={`${styles.hit} ${styles.hitChoose}`} aria-label={`${s.shortName} 영수증으로 혜택 선택`} />
                </div>
                <div className={styles.info}>
                  <p className={styles.name}>{s.name}</p>
                  <p className={styles.line}><b>오늘</b> {todayHoursText(st)}</p>
                  <p className={styles.line}><b>위치</b> {s.address}</p>
                  <p className={styles.line}><b>지하철</b> {loc.subway} · {loc.floor}</p>
                  <p className={styles.line}><b>전화</b> {s.phone ?? "-"}</p>
                  <div className={styles.photos}>
                    {photos.map((p) => (
                      <Image key={p.src} src={p.src} alt={p.alt} width={200} height={200} sizes="110px" className={styles.photo} />
                    ))}
                  </div>
                  <div className={styles.links}>
                    <Link href={`/stores/${s.id}`} className="btn btn-outline btn-sm">매장 자세히</Link>
                    {naverPlaceUrl(s) && <a className="btn btn-outline btn-sm" href={naverPlaceUrl(s)!} target="_blank" rel="noreferrer">네이버 플레이스</a>}
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}
