import type { Metadata } from "next";
import { PhoneForm } from "@/components/flow/PhoneForm";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "로그인" };

/**
 * 로그인 — 제목, 한 줄 설명, 카드 안의 번호 입력 + [로그인]. 맨 위 줄의 로그인 버튼은 이 화면에서 감춘다(Header).
 * 정적 HTML — ?next= 는 폼이 보낼 때 브라우저에서 읽고, 이미 로그인된 손님은 proxy.ts 가 next 로 보낸다.
 */
export default function LoginPage() {
  return (
    <div className={styles.page}>
      <header className={styles.top}>
        <span className="eyebrow">Login</span>
        <h1 className="h1">휴대폰 번호로 로그인</h1>
        <p className="lead">계산할 때 직원에게 말씀하신 휴대폰 번호를 입력하시면 쿠폰함으로 이동합니다. 인증번호는 없습니다.</p>
      </header>
      <section className={`card card-pad ${styles.card}`}>
        <PhoneForm />
      </section>
      <ul className="notice" aria-label="안내">
        <li>휴대폰 번호는 쿠폰 확인 용도로만 사용하며 문자는 발송하지 않습니다.</li>
        <li>쿠폰은 계산 시 직원이 번호로 발급합니다. 이 화면에서는 발급되지 않습니다.</li>
      </ul>
    </div>
  );
}
