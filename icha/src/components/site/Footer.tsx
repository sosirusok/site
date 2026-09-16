import Link from "next/link";
import { BRAND } from "@/lib/config";
import { STORES } from "@/lib/stores";
import { Piece } from "./Poster";
import { ShareButton } from "./ShareButton";
import styles from "./Footer.module.css";

/** 모든 손님 화면 맨 아래 — 영수증 같은 크림 종이(가게 이름·전화·링크), 그 옆 포스터 메모, 맨 끝은 포스터 마지막 줄 조각 */
export function Footer() {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  return (
    <footer className={styles.footer}>
      <div className={styles.receiptRow}>
        <div className={`paper paper-l ${styles.receipt}`}>
          <p className={`disp ${styles.brand}`}>{BRAND.name} · {BRAND.unionName}</p>
          <ul className={styles.stores}>
            {ordered.map((s) => (
              <li key={s.id} className={styles.store}>
                <span className={styles.storeName}>{s.course.n}차 {s.shortName}</span>
                {s.phone && <a href={`tel:${s.phone.replace(/-/g, "")}`} className={`num ${styles.tel}`}>{s.phone}</a>}
              </li>
            ))}
          </ul>
          <p className={styles.links}>
            <Link href="/guide" className="link">이용 안내</Link>
            <ShareButton title={BRAND.name} text={BRAND.tagline} className="link" variant="link">친구에게 보내기</ShareButton>
            <Link href="/admin/login" className="link">사장님·직원</Link>
          </p>
        </div>
        <Piece name="note-good" rotate={7} className={styles.noteGood} sizes="96px" />
      </div>
      <Piece name="footer-line" className={styles.line} sizes="(min-width: 480px) 480px, 100vw" />
    </footer>
  );
}
