import Image from "next/image";
import Link from "next/link";
import { STORES } from "@/lib/stores";
import { heroImage } from "@/components/site/StoreHelpers";
import s from "./home.module.css";

/** 세 매장 대표 실사진을 옆으로 넘겨 본다. 첫 장이 화면에 보인다. */
export function PhotoStrip() {
  return (
    <section className={`wrap ${s.stripSection}`} aria-label="매장 사진">
      <div className="strip">
        {STORES.map((st, i) => {
          const img = heroImage(st);
          if (!img) return null;
          return (
            <Link key={st.id} href={`/stores/${st.id}`} className={s.shot} aria-label={`${st.shortName} 매장 보기`}>
              <Image src={img.src} alt={img.alt} fill sizes="(max-width: 480px) 88vw, 420px" priority={i === 0} />
              <span className={s.chip}>{st.shortName}</span>
            </Link>
          );
        })}
      </div>
    </section>
  );
}
