import Image from "next/image";
import Link from "next/link";
import type { StoreImage } from "@/lib/stores";
import styles from "./HomeCta.module.css";

/** 마무리 — 술잔 사진 위에 큰 제목과 버튼. */
export function HomeCta({ image, title, sub, primary, secondary }: {
  image: StoreImage | null;
  title: React.ReactNode;
  sub?: string;
  primary: { href: string; label: string };
  secondary?: { href: string; label: string };
}) {
  return (
    <section className={styles.cta} aria-labelledby="cta-title">
      {image && <Image src={image.src} alt="" fill sizes="100vw" className={styles.img} />}
      <div className={styles.shade} aria-hidden="true" />
      <div className={`wrap ${styles.inner} rise`}>
        <h2 id="cta-title" className={`display ${styles.title}`}>{title}</h2>
        {sub && <p className={`lead ${styles.sub}`}>{sub}</p>}
        <div className={styles.actions}>
          <Link href={primary.href} className="btn btn-lg">{primary.label}</Link>
          {secondary && <Link href={secondary.href} className="btn btn-lg btn-outline">{secondary.label}</Link>}
        </div>
      </div>
    </section>
  );
}
