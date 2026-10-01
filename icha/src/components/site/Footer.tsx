import Image from "next/image";
import Link from "next/link";
import { BRAND } from "@/lib/config";
import { naverSearchUrl } from "@/lib/naver";
import { STORES } from "@/lib/stores";
import styles from "./Footer.module.css";

/** 네이버 검색창에 그대로 넣는 말 */
const SEARCH_QUERY = "서면 알콜부시기";

/**
 * 손님 화면 맨 아래 — 플라이어 뒷면.
 *
 * 홈·전체·짧은 벌을 서버에서 그리고 CSS로 현재 화면에 맞는 벌을 고른다.
 * 쿠폰함·쿠폰 상세·매장 고르기·로그인처럼 "지금 할 일"이 있는 화면에서 세 가게 사업자등록번호까지
 * 다시 펼치면 본문보다 꼬리말이 길어진다. 그런 화면에는 전화·안내 한 줄짜리 짧은 벌만 나간다.
 * 홈의 사업자 정보는 기본 HTML details로 접어 두므로 별도 자바스크립트가 필요 없다.
 */
export function Footer() {
  const ordered = [...STORES].sort((a, b) => a.course.n - b.course.n);
  const tel = ordered.filter((s) => s.phone);
  return (
    <footer className={styles.footer}>
      {/* 짧은 벌 — 전화 세 곳과 안내 링크, 경고 한 줄 */}
      <div className={styles.short}>
        <Image className={styles.shortMark} src="/images/privilege/wordmark.png" alt={BRAND.name} width={720} height={245} sizes="132px" />
        <ul className={styles.shortTel}>
          {tel.map((s) => (
            <li key={s.id} data-store={s.id}>
              <a href={`tel:${s.phone!.replace(/-/g, "")}`}><span className={styles.shortName}>{s.shortName}</span> <span className="num">{s.phone}</span></a>
            </li>
          ))}
        </ul>
        <nav className={styles.shortLinks} aria-label="하단 링크">
          <Link href="/guide" className={styles.link}>이용 안내</Link>
          <Link href="/" className={styles.link}>참여 매장</Link>
        </nav>
        <p className={styles.shortWarn}>만 19세 미만에게는 주류를 판매하지 않습니다.</p>
      </div>

      <div className={styles.home}>
        <div className={styles.homeHead}>
          <Image className={styles.homeMark} src="/images/privilege/wordmark.png" alt={BRAND.name} width={720} height={245} sizes="(min-width: 960px) 180px, 140px" />
          <nav className={styles.homeLinks} aria-label="하단 링크">
            <Link href="/guide">이용 안내</Link>
            <Link href="/wallet">쿠폰함</Link>
          </nav>
        </div>
        <ul className={styles.homeTel} aria-label="매장 전화">
          {tel.map((s) => (
            <li key={s.id}>
              <a href={`tel:${s.phone!.replace(/-/g, "")}`}>
                <span>{s.shortName}</span>
                <span className={styles.homeNumber}>{s.phone}</span>
              </a>
            </li>
          ))}
        </ul>
        <details className={styles.homeBusiness}>
          <summary>매장 및 사업자 정보</summary>
          <ul className={styles.homeBusinessList}>
            {ordered.map((s) => (
              <li key={s.id}>
                <strong>{s.name}</strong>
                <span>{s.address}</span>
                {s.bizNo && <span>사업자등록번호 {s.bizNo}</span>}
              </li>
            ))}
          </ul>
        </details>
        <p className={styles.homeWarn}>지나친 음주는 뇌졸중, 기억력 손상이나 치매를 유발합니다. 임신 중 음주는 기형아 출생 위험을 높입니다. 만 19세 미만에게는 주류를 판매하지 않습니다.</p>
        <div className={styles.homeBottom}>
          <span>© 2026 {BRAND.name}</span>
          <Link href="/admin/login">관리자</Link>
        </div>
      </div>

      <div className={styles.full}>
      <div className={styles.head}>
        <Image className={styles.mark} src="/images/privilege/wordmark.png" alt={BRAND.name} width={720} height={245} sizes="148px" />
        <p className={styles.footerLine}>서면 세 곳 · 50m</p>
      </div>
      <ul className={styles.stores}>
        {ordered.map((s) => (
          <li key={s.id} className={styles.store} data-store={s.id}>
            <span className={styles.storeBody}>
              <span className={styles.storeName}><b className={styles.storeCourse}>{s.course.n}차</b> {s.name}</span>
              <span className={styles.addr}>{s.address}</span>
              {s.bizNo && <span className={`num ${styles.addr}`}>사업자등록번호 {s.bizNo}</span>}
              {s.phone && <a href={`tel:${s.phone.replace(/-/g, "")}`} className={`num ${styles.tel}`}>{s.phone}</a>}
            </span>
          </li>
        ))}
      </ul>
      <nav className={styles.links} aria-label="하단 링크">
        <Link href="/guide" className={styles.link}>이용 안내</Link>
        <Link href="/wallet" className={styles.link}>쿠폰함</Link>
        <a href={naverSearchUrl(SEARCH_QUERY)} target="_blank" rel="noreferrer" className={styles.link}>네이버 플레이스</a>
      </nav>
      <p className={styles.warn}>지나친 음주는 뇌졸중, 기억력 손상이나 치매를 유발합니다. 임신 중 음주는 기형아 출생 위험을 높입니다. 만 19세 미만에게는 주류를 판매하지 않습니다.</p>
      <p className={styles.copy}>
        <span>© 2026 {BRAND.name}</span>
        <Link href="/admin/login" className={styles.staff}>관리자</Link>
      </p>
      </div>
    </footer>
  );
}
