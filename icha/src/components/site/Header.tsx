"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BRAND, maskPhone } from "@/lib/config";
import { kitPiece } from "@/lib/kit";
import { resolvePiece } from "./Poster";
import styles from "./Header.module.css";

/** 홈에서는 첫 화면에 포스터 제목이 크게 있으니, 제목 스티커는 이만큼 내려간 뒤에야 나타난다 */
const SHOW_AFTER = 150;

/**
 * 맨 위 한 줄 — 보케 위에 그대로. 왼쪽은 포스터 제목 조각(26px, 키트 title.png 가 있으면 그것), 오른쪽은 종이 꼬리표(로그인 / 내 번호). 판·그늘 없음.
 * 홈("/")에서는 제목이 포스터 머리와 겹쳐 두 번 보이므로 150px 넘게 내려가기 전엔 감춘다. 다른 화면에서는 늘 보인다.
 * 로그인 꼬리표는 키트 btn-login.png 가 있으면 그 그림(36px)으로 바뀐다.
 */
export function Header({ loggedIn, phone }: { loggedIn: boolean; phone: string | null }) {
  const t = resolvePiece("title");
  const loginBtn = kitPiece("btn-login");
  const home = (usePathname() ?? "/") === "/";
  const [shown, setShown] = useState(!home);
  useEffect(() => {
    if (!home) {
      setShown(true);
      return;
    }
    const update = () => setShown(window.scrollY > SHOW_AFTER);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, [home]);
  return (
    <header className={styles.header}>
      <Link href="/" className={`${styles.brand} ${shown ? "" : styles.brandHidden}`} aria-label={`${BRAND.name} 홈`} aria-hidden={shown ? undefined : true} tabIndex={shown ? undefined : -1}>
        <Image src={t.src} alt={t.alt} width={t.w} height={t.h} sizes="150px" priority className={styles.brandImg} draggable={false} />
      </Link>
      {loggedIn && phone ? (
        <Link href="/wallet" className={styles.me}><span className={styles.meTag}>{maskPhone(phone)}</span></Link>
      ) : loginBtn ? (
        <Link href="/login" className={styles.me}>
          <Image src={loginBtn.src} alt="" aria-hidden="true" width={loginBtn.w} height={loginBtn.h} sizes="120px" className={styles.meImg} draggable={false} />
          <span className="sr-only">로그인</span>
        </Link>
      ) : (
        <Link href="/login" className={styles.me}><span className={styles.meTag}>로그인</span></Link>
      )}
    </header>
  );
}
