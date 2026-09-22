import type { Metadata } from "next";
import { LoginPanel } from "@/components/flow/LoginPanel";
import { GiftLines } from "@/components/site/GiftLines";
import { identityEnabled, identityMock } from "@/lib/identity/portone";
import styles from "./login.module.css";

export const metadata: Metadata = { title: "로그인" };

/**
 * 로그인 — 제목, 한 줄 설명, 카드 안의 번호 입력 + [로그인]. 맨 위 줄의 로그인 버튼은 이 화면에서 감춘다(Header).
 * 정적 HTML — ?next= 는 폼이 보낼 때 브라우저에서 읽고, 이미 로그인된 손님은 proxy.ts 가 next 로 보낸다.
 */
export default function LoginPage() {
  // 키가 들어오면 이 화면은 통신사 본인확인 한 번으로 바뀐다. 정적 페이지라 키를 넣은 뒤 재배포가 한 번 필요하다
  // (Vercel 은 환경변수를 저장하면 자동으로 다시 배포한다). 혹시 이 판이 낡았더라도
  // /api/identity/start 가 503 을 주면 화면이 스스로 번호 입력으로 내려간다.
  const identity = identityEnabled() || identityMock();
  return (
    <div className={styles.page} data-footer="short">
      <header className={styles.top}>
        <h1 className="h1">{identity ? "휴대폰 본인확인으로 시작" : "휴대폰 번호로 로그인"}</h1>
        <p className="lead">
          {identity
            ? "통신사에서 확인한 번호가 그대로 쿠폰함이 됩니다. 따로 적을 것도, 인증번호를 기다릴 것도 없습니다."
            : "계산할 때 댄 번호 그대로 넣으시면 됩니다. 인증번호 없습니다."}
        </p>
      </header>
      <section className={`card card-pad torn-tb inked ${styles.card}`}>
        <LoginPanel identityConfigured={identity} />
      </section>
      <p className="fineprint">
        {identity
          ? "번호는 쿠폰 찾는 데만 씁니다. 문자 안 보냅니다. 본인확인은 통신사와 본인확인기관이 하고, 저희는 성인 여부만 받습니다."
          : "번호는 쿠폰 찾는 데만 씁니다. 문자 안 보냅니다."}
      </p>
      <GiftLines />
    </div>
  );
}
