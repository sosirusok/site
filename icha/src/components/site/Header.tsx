"use client";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { BRAND, maskPhone } from "@/lib/config";
import { resolvePiece } from "./Poster";
import { StickerButton } from "./Kit";
import styles from "./Header.module.css";

/** 홈에서는 첫 화면에 포스터 머리(head-banner)에 제목이 크게 있으니, 제목 스티커는 이만큼 내려간 뒤에야 나타난다 */

/**
 * 맨 위 한 줄 — 보케 위에 그대로(판 없음). 왼쪽은 키트 제목 title.png(높이 42px, 검은 붓자국 바탕이 그림 안에 있어 받침 없이 읽힌다), 오른쪽은 키트 꼬리표 로그인(btn-login, 36px) 또는 내 번호(크림 꼬리표).
 * 홈("/")에서는 제목이 포스터 머리와 겹쳐 두 번 보이므로 150px 넘게 내려가기 전엔 감춘다. 다른 화면에서는 늘 보인다.
 * 로그인 화면("/login")에서는 오른쪽 꼬리표를 두지 않는다 — 같은 화면에 [로그인]이 둘이 되지 않게.
 */
export function Header({ loggedIn, phone }: { loggedIn: boolean; phone: string | null }) {
  const t = resolvePiece("title");
  const path = usePathname() ?? "/";
  // 제목 조각은 모든 화면에서 늘 보인다(홈의 큰 배너 제목과 크기가 달라 중복으로 읽히지 않음).
  const shown = true;
  return (
    <header className={styles.header}>
      <Link href="/" className={`${styles.brand} ${shown ? "" : styles.brandHidden}`} aria-label={`${BRAND.name} 홈`} aria-hidden={shown ? undefined : true} tabIndex={shown ? undefined : -1}>
        <Image src={t.src} alt={t.alt} width={t.w} height={t.h} sizes="130px" priority className={t.kit ? styles.brandImg : styles.brandImgPoster} draggable={false} />
      </Link>
      {loggedIn && phone ? (
        <Link href="/wallet" className={styles.me}><span className={styles.meTag}>{maskPhone(phone)}</span></Link>
      ) : path !== "/login" ? (
        <StickerButton kind="login" href="/login" tilt={1} secondary className={styles.me}>로그인</StickerButton>
      ) : null}
    </header>
  );
}
