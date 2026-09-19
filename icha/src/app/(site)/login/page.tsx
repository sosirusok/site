import type { Metadata } from "next";
import { PhoneForm } from "@/components/flow/PhoneForm";
import { KitPiece, SectionLabel } from "@/components/site/Kit";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "로그인" };

/**
 * 로그인 — 키트 큰 제목판(label-phone "번호로 시작", 60px) + 손글씨 메모(note-today 140px, 획 그림자 + 가장자리 없는 어둠), 어두운 띠 안내 한 줄, 종이 카드 위 번호 입력 + 키트 [로그인](64px). 맨 위 줄의 로그인 꼬리표는 이 화면에서 감춘다(Header).
 * 정적 HTML — ?next= 는 폼이 보낼 때 브라우저에서 읽고, 이미 로그인된 손님은 proxy.ts 가 next 로 보낸다(세션·searchParams 를 서버에서 읽지 않는다).
 */
export default function LoginPage() {
  return (
    <div className={styles.page}>
      <header className={styles.top} aria-labelledby="login-title">
        <div className={styles.titleRow}>
          <SectionLabel kind="phone" color="blue" as="h1" big id="login-title" className={styles.h1}>번호로 시작</SectionLabel>
          <KitPiece name="note-today" rotate={4} sizes="140px" className={`note-dark ${styles.note}`} />
        </div>
        <p className={`info ${styles.sub}`}>계산 시 말씀하신 휴대폰 번호로 로그인합니다</p>
      </header>
      <section className={`paper paper-l ${styles.card}`}>
        <PhoneForm />
        <p className={`help ${styles.help}`}>휴대폰 번호는 쿠폰 확인 용도로만 사용하며 문자는 발송하지 않습니다.</p>
      </section>
    </div>
  );
}
