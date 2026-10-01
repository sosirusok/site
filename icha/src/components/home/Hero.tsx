import Image, { getImageProps } from "next/image";
import Link from "next/link";
import type { Rules } from "@/lib/config";
import { ruleLine } from "@/lib/copy";
import s from "./hero.module.css";

const previews = [
  { id: "tokyo", name: "도쿄스탠드", photo: "/images/stores/tokyo/cold-ham-plate-beers.jpg", alt: "도쿄스탠드 생맥주와 콜드햄 플레이트" },
  { id: "joseon", name: "조선칼국수", photo: "/images/stores/joseon/makgeolli-cheers.jpg", alt: "조선칼국수에서 막걸리 잔을 함께 드는 모습" },
  { id: "wareureu", name: "와르르맨숀", photo: "/images/stores/wareureu/interior-hall.jpg", alt: "와르르맨숀의 테이블과 매장 내부" },
] as const;

export function Hero({ rules }: { rules: Rules }) {
  const common = { alt: "", sizes: "(min-width: 1600px) 1600px, 100vw", loading: "eager" as const, fetchPriority: "high" as const };
  const { props: mobile } = getImageProps({ ...common, src: "/images/privilege/hero-mobile.webp", width: 1122, height: 1402 });
  const { props: desktop } = getImageProps({ ...common, src: "/images/privilege/hero-wide.webp", width: 1774, height: 887 });

  return (
    <section className={s.hero} aria-labelledby="hero-title">
      <h1 id="hero-title" className="sr-only">알콜부시기 — 서면 세 가게 콜라보</h1>
      <picture className={s.artwork} aria-hidden="true">
        <source media="(min-width: 760px)" srcSet={desktop.srcSet} sizes={desktop.sizes} />
        {/* getImageProps supplies Next's responsive optimized sources to the art-directed picture. */}
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img {...mobile} alt="" className={s.keyVisual} />
      </picture>
      <nav className={s.previews} aria-label="세 매장 사진으로 둘러보기">
        {previews.map((store) => (
          <Link href={`/stores/${store.id}`} key={store.id} className={s.preview}>
            <span className={s.previewPhoto}>
              <Image src={store.photo} alt={store.alt} fill sizes="(min-width: 760px) 150px, calc((100vw - 56px) / 3)" loading="eager" />
            </span>
            <span className={s.previewName}>{store.name}</span>
          </Link>
        ))}
      </nav>
      <div className={s.invitation}>
        <p className={s.location}>서면의 세 매장, 하나로 이어지는 혜택.</p>
        <div className={s.details}>
          <p className={s.condition}>{ruleLine(rules)}</p>
          <Link href="/guide" className={s.guide}>이용 안내 <span aria-hidden="true">↗</span></Link>
        </div>
      </div>
    </section>
  );
}
