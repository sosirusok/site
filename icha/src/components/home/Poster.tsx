import Image from "next/image";
import { BRAND } from "@/lib/config";
import { STORES } from "@/lib/stores";
import s from "./home.module.css";

/** 맨 위 — 사장님 포스터를 그대로 보여 준다. 사진 띠 대신 포스터가 사진 역할을 한다. */
export function Poster() {
  const course = [...STORES].sort((a, b) => a.course.n - b.course.n).map((st) => `${st.course.n}차 ${st.shortName}`).join(", ");
  return (
    <section className={s.poster} aria-label={`${BRAND.name} 포스터`}>
      <Image
        src="/images/event/poster.jpg"
        alt={`${BRAND.name} — ${BRAND.unionName}. ${BRAND.course}: ${course}. ${BRAND.eventTag}`}
        width={1080}
        height={1350}
        sizes="480px"
        priority
        className={s.posterImg}
      />
    </section>
  );
}
