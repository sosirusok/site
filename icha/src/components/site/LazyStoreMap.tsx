"use client";
import { Suspense, lazy, useEffect, useRef, useState, type ComponentProps } from "react";
import type { StoreMap as StoreMapType } from "./StoreMap";
import styles from "./StoreMap.module.css";

type Props = ComponentProps<typeof StoreMapType>;

/** 지도가 뜨기 전 같은 상자(높이·크림 바탕·테두리) — StoreMap 의 "불러오는 중" 상태와 똑같이 그린다 */
function Placeholder({ height = 440, className = "", inner }: { height?: number; className?: string; inner?: React.Ref<HTMLDivElement> }) {
  return (
    <div ref={inner} className={`${styles.wrap} ${className}`} data-engine="loading">
      <div className={styles.mapBox} style={{ height }}>
        <div className={styles.loading}>지도를 불러오는 중…</div>
      </div>
    </div>
  );
}

/**
 * Leaflet(약 150KB)은 지도가 화면 가까이(600px) 왔을 때만 받는다 — 서버 HTML 에는 같은 크기의 빈 상자.
 * 받는 동안의 상자도 같은 높이여야 한다(next/dynamic 의 loading 은 props 를 못 받아 기본 440px 로 커졌다 줄며 아래 글이 튀었다).
 * near 는 마운트 뒤에만 켜지므로 서버에서는 그려지지 않는다.
 */
const StoreMap = lazy(() => import("./StoreMap").then((m) => ({ default: m.StoreMap })));

/**
 * 지도를 스크롤이 가까워질 때 붙인다 — 홈·매장 화면의 지도는 첫 화면 아래에 있어 처음부터 지도 JS 를 받을 이유가 없다.
 * IntersectionObserver 가 없는 브라우저는 바로 붙인다. props 는 StoreMap 과 같다.
 */
export function LazyStoreMap(props: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [near, setNear] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (near || !el) return;
    if (typeof IntersectionObserver === "undefined") {
      setNear(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setNear(true);
          io.disconnect();
        }
      },
      { rootMargin: "600px 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [near]);
  if (near) {
    return (
      <Suspense fallback={<Placeholder height={props.height} className={props.className} />}>
        <StoreMap {...props} />
      </Suspense>
    );
  }
  return <Placeholder inner={ref} height={props.height} className={props.className} />;
}
