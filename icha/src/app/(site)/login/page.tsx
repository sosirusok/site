import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getMemberSession } from "@/lib/auth/session";
import { BRAND } from "@/lib/config";
import { STORES } from "@/lib/stores";
import { PhoneForm } from "@/components/flow/PhoneForm";
import { safeNext, storeNo } from "@/components/flow/format";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "번호로 시작" };

const STEPS = [
  { title: "영수증 인증", text: "세 곳 중 한 곳에서 계산한 영수증을 찍어 올려요." },
  { title: "사이드 한 접시 고르기", text: "나머지 두 매장의 사이드 중 하나를 골라요. 쿠폰이 이 번호에 들어와요." },
  { title: "직원 앞에서 사용", text: "매장에서 쿠폰 화면을 보여 주고 길게 눌러 사용 처리해요." },
];

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next, "/verify");
  const session = await getMemberSession();
  if (session) redirect(sp.next ? next : "/wallet");

  // 배경: 밤 외관 실사진 하나 (첫 매장의 hero)
  const bg = STORES[0]?.images.find((i) => i.kind === "hero") ?? STORES[0]?.images[0] ?? null;

  return (
    <section className={styles.page}>
      {bg && (
        <div className={styles.bg} aria-hidden="true">
          <Image src={bg.src} alt="" fill priority sizes="100vw" className={styles.bgImg} />
        </div>
      )}
      <div className={`wrap ${styles.grid}`}>
        <div className={styles.main}>
          <p className="eyebrow">{BRAND.unionName}</p>
          <h1 className={`h1 ${styles.title}`}>
            <span className="gold">전화번호</span>만 있으면<br />돼요.
          </h1>
          <p className={`lead ${styles.lead}`}>
            앱도, 가입도, 인증번호도 없어요. 영수증을 인증하면 받은 쿠폰이 이 번호에 남고, 매장에서 직원에게 보여 주면 끝이에요.
          </p>
          <PhoneForm next={next} />
          <p className={`small ${styles.note}`}>
            번호는 쿠폰 보관과 직원 확인에만 써요. 문자나 광고를 보내지 않아요.{" "}
            <Link href="/guide" className={styles.link}>번호만으로 시작하는 이유</Link>
          </p>
        </div>

        <aside className={styles.aside} aria-label="이 번호로 할 수 있는 것">
          <p className={styles.asideTitle}>이 번호로 되는 것</p>
          <ol className={styles.steps}>
            {STEPS.map((s, i) => (
              <li key={s.title}>
                <span className={styles.num} aria-hidden="true">{String(i + 1).padStart(2, "0")}</span>
                <div>
                  <p className={styles.stepTitle}>{s.title}</p>
                  <p className={styles.stepText}>{s.text}</p>
                </div>
              </li>
            ))}
          </ol>
          <ul className={styles.stores} aria-label="참여 매장">
            {STORES.map((s) => {
              const img = s.images.find((i) => i.kind === "hero") ?? s.images[0];
              return (
                <li key={s.id} className={styles.store}>
                  <span className={styles.thumb}>
                    {img && <Image src={img.src} alt={img.alt} fill sizes="64px" />}
                  </span>
                  <span className={styles.storeNo}>{storeNo(s.id)}</span>
                  <span className={styles.storeName}>{s.shortName}</span>
                  <span className={styles.storeDrink}>{s.drink}</span>
                </li>
              );
            })}
          </ul>
        </aside>
      </div>
    </section>
  );
}
