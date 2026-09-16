"use client";
/**
 * 사장님 버튼 자산(기본·눌림·처리 중·비활성 4장)을 그대로 쓰는 버튼.
 * 글자는 이미지 안에 있으므로 aria-label 로 접근성 텍스트를 준다.
 */
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { artButton, type ArtButtonKey } from "@/lib/art";
import styles from "./ArtButton.module.css";

const LABEL: Record<ArtButtonKey, string> = {
  start: "시작하기",
  shoot: "영수증 촬영",
  "pick-photo": "사진 선택",
  menu: "메뉴 보기",
  choose: "혜택 선택",
  "get-coupon": "쿠폰 받기",
  use: "사용하기",
};

type Common = { kind: ArtButtonKey; loading?: boolean; disabled?: boolean; width?: number; className?: string };
type ButtonProps = Common & { onClick?: () => void; type?: "button" | "submit"; href?: undefined };
type LinkProps = Common & { href: string; onClick?: undefined; type?: undefined };

export function ArtButton(props: ButtonProps | LinkProps) {
  const { kind, loading = false, disabled = false, width = 320, className = "" } = props;
  const [pressed, setPressed] = useState(false);
  const state = disabled ? "disabled" : loading ? "loading" : pressed ? "pressed" : "default";
  const a = artButton(kind, state);
  const img = (
    <Image src={a.src} alt="" width={a.width} height={a.height} style={{ width, height: "auto" }} priority={false} draggable={false} />
  );
  const label = LABEL[kind];
  const handlers = {
    onPointerDown: () => setPressed(true),
    onPointerUp: () => setPressed(false),
    onPointerLeave: () => setPressed(false),
    onPointerCancel: () => setPressed(false),
  };
  if ("href" in props && props.href) {
    return (
      <Link href={props.href} className={`${styles.btn} ${className}`} aria-label={label} aria-disabled={disabled} {...handlers} style={{ width }}>
        {img}
      </Link>
    );
  }
  return (
    <button
      type={props.type ?? "button"}
      className={`${styles.btn} ${className}`}
      aria-label={loading ? `${label} 처리 중` : label}
      aria-busy={loading}
      disabled={disabled || loading}
      onClick={props.onClick}
      style={{ width }}
      {...handlers}
    >
      {img}
    </button>
  );
}
