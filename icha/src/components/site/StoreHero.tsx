import Image from "next/image";
import type { StoreId } from "@/lib/config";
import type { Store } from "@/lib/stores";
import { KitPiece } from "./Kit";
import { Piece, plateOf } from "./Poster";
import { kstNow, nowText, openStatus, parseHours } from "./StoreHelpers";
import { STORE_FAN } from "./storePhotos";
import styles from "./StoreHero.module.css";

/** 간판 오른쪽 끝을 뚫고 나오는 그 집 술 — 1차 맥주잔(120px 높이), 2차 주전자(116px 폭), 3차 소주병(120px 높이) */
const CUT: Record<StoreId, { name: string; cls: "cutTall" | "cutWide" }> = {
  tokyo: { name: "cut-beer", cls: "cutTall" },
  joseon: { name: "cut-makgeolli", cls: "cutWide" },
  wareureu: { name: "cut-soju", cls: "cutTall" },
};

/**
 * 매장 첫 장면 — 대표 안주 사진을 화면 폭 가득(390x300, 아래가 밤으로 녹는다), 사진 오른쪽 위에 키트 종이 메모 note-good(118px, 테이프),
 * 사진 아래 50px 을 덮는 키트 간판(358x149, −2°, 왼쪽 위 테이프), 간판 오른쪽 끝을 뚫고 나오는 컷아웃(6°).
 * 그 아래 검은 띠 두세 줄: Do Hyeon 16px "영업 중 · 오늘 17:00~03:00 · ★ 4.82 (17)" / (주문 마감·다른 요일) / 크림 13px 주소, 띠 오른쪽 끝에 전화 꼬리표(크림 스티커, 전화 링크).
 * 보이는 이름은 간판이고 읽히는 이름(h1)은 눈에 안 보이게 같이 둔다.
 */
export function StoreHero({ store }: { store: Store }) {
  const st = openStatus(store);
  const r = store.naverRating;
  const { dow } = kstNow();
  const photo = STORE_FAN[store.id][0]!;
  const alt = store.images.find((im) => im.src === photo.src)?.alt ?? photo.cap;
  const otherDays = parseHours(store)
    .filter((l) => !l.dayset.has(dow))
    .map((l) => `${l.days} ${l.openText}~${l.closeText}`);
  const today = st.today === "휴무" ? "" : `오늘 ${st.today.replace(/\s*–\s*/, "~").replace("다음날 ", "")}`;
  const state = st.today === "휴무" ? "휴무" : nowText(st);
  const sub = [st.lastOrder ? `주문 마감 ${st.lastOrder}` : null, ...otherDays].filter(Boolean).join(" · ");
  const cut = CUT[store.id];

  return (
    <header className={styles.hero}>
      <div className={styles.shotWrap} aria-hidden="true">
        <Image src={photo.src} alt="" fill priority sizes="(min-width: 480px) 480px, 100vw" style={{ objectPosition: photo.pos }} className={styles.shot} />
      </div>
      <span className="sr-only">{alt}</span>
      <KitPiece name="note-good" rotate={5} sizes="130px" className={`tape ${styles.note}`} />
      <h1 className="sr-only">{store.name}</h1>
      <div className={styles.plateWrap}>
        <Piece name={plateOf(store.id)} rotate={-2} priority sizes="(min-width: 480px) 448px, 100vw" className={`tape-tl ${styles.plate}`} />
      </div>
      <KitPiece name={cut.name} bare sizes="140px" className={`${styles.cut} ${styles[cut.cls]}`} />

      <div className={`band ${styles.facts}`}>
        <div className={styles.factLines}>
          <p className={`${styles.now} num`}>
            <span className={st.open ? "y" : ""}>{state}</span>
            {today && <span> · {today}</span>}
            {r && <span> · <span className="y">★ {r.score.toFixed(2)}</span> ({r.count.toLocaleString("ko-KR")})</span>}
          </p>
          {sub && <p className={`${styles.sub} num`}>{sub}</p>}
          <p className={styles.addr}>{store.address}</p>
        </div>
        {store.phone && (
          <a href={`tel:${store.phone.replace(/-/g, "")}`} className={styles.tel}>
            <span className={`num ${styles.telTag}`}>{store.phone}</span>
          </a>
        )}
      </div>
    </header>
  );
}
