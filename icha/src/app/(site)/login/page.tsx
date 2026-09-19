import type { Metadata } from "next";
import { PhoneForm } from "@/components/flow/PhoneForm";
import { GiftLines } from "@/components/site/GiftLines";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "로그인" };

/**
 * 로그인 — 제목, 한 줄 설명, 카드 안의 번호 입력 + [로그인]. 맨 위 줄의 로그인 버튼은 이 화면에서 감춘다(Header).
 * 정적 HTML — ?next= 는 폼이 보낼 때 브라우저에서 읽고, 이미 로그인된 손님은 proxy.ts 가 next 로 보낸다.
 */
export default function LoginPage() {
  return (
    <div className={styles.page} data-footer="short">
      <header className={styles.top}>
        <h1 className="h1">휴대폰 번호로 로그인</h1>
        <p className="lead">계산할 때 댄 번호 그대로 넣으시면 됩니다. 인증번호 없습니다.</p>
      </header>
      <section className={`card card-pad ${styles.card}`}>
        <PhoneForm />
      </section>
      <p className="fineprint">번호는 쿠폰 찾는 데만 씁니다. 문자 안 보냅니다.</p>
      <GiftLines />
    </div>
  );
}
