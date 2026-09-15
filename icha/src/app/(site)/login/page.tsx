import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { getMemberSession } from "@/lib/auth/session";
import { BRAND } from "@/lib/config";
import { STORES } from "@/lib/stores";
import { DrinkIcon } from "@/components/ui/icons";
import { PhoneForm } from "@/components/flow/PhoneForm";
import { safeNext } from "@/components/flow/format";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "번호로 시작" };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ [key: string]: string | string[] | undefined }> }) {
  const sp = await searchParams;
  const next = safeNext(sp.next, "/verify");
  const session = await getMemberSession();
  if (session) redirect(sp.next ? next : "/wallet");

  return (
    <section className={`wrap ${styles.page}`}>
      <div className={styles.grid}>
        <div className={styles.main}>
          <p className="eyebrow">{BRAND.unionName}</p>
          <h1 className={`h1 ${styles.title}`}>
            전화번호만 있으면<br />돼요.
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

        <aside className={`paper ${styles.aside}`} aria-label="이 번호로 할 수 있는 것">
          <p className={`eyebrow ${styles.asideEyebrow}`}>이 번호로 할 수 있는 것</p>
          <ol className={styles.steps}>
            <li>
              <span className={`serif ${styles.num}`}>1</span>
              <div>
                <p className={styles.stepTitle}>영수증 인증</p>
                <p className={styles.stepText}>세 곳 중 한 곳에서 결제한 영수증을 사진으로 찍어 올려요.</p>
              </div>
            </li>
            <li>
              <span className={`serif ${styles.num}`}>2</span>
              <div>
                <p className={styles.stepTitle}>사이드 한 접시 고르기</p>
                <p className={styles.stepText}>나머지 두 매장의 사이드 메뉴 중 하나를 골라요. 쿠폰이 이 번호에 들어와요.</p>
              </div>
            </li>
            <li>
              <span className={`serif ${styles.num}`}>3</span>
              <div>
                <p className={styles.stepTitle}>직원 앞에서 사용</p>
                <p className={styles.stepText}>매장에서 쿠폰 화면을 보여 주고 길게 눌러 사용 처리해요.</p>
              </div>
            </li>
          </ol>
          <hr className="dots" />
          <ul className={styles.stores}>
            {STORES.map((s) => (
              <li key={s.id} data-store={s.id} className={styles.store}>
                <DrinkIcon drink={s.drink} size={18} />
                <span>{s.shortName}</span>
                <span className={`mono ${styles.drink}`}>{s.drink}</span>
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </section>
  );
}
