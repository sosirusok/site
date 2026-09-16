import type { Metadata } from "next";
import Link from "next/link";
import { BRAND, formatWon } from "@/lib/config";
import { getRules } from "@/lib/settings";
import { STORES } from "@/lib/stores";
import { GuideFaq, type FaqItem } from "@/components/site/GuideFaq";
import { Steps as HomeSteps } from "@/components/home/Steps";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "이용 안내",
  description: "영수증 인정 기간, 인정되지 않는 경우, 쿠폰 유효기간, 직원 확인 방법, 전화번호 로그인, 개인정보 처리 안내.",
};

export default async function GuidePage() {
  const rules = await getRules();
  const names = STORES.map((s) => s.shortName).join(", ");
  const tiers = rules.tiers;

  const faq: FaqItem[] = [
    {
      id: "which-receipt",
      q: "어떤 영수증이 인정됩니까?",
      a: (
        <>
          <p>{names} 세 매장의 결제 영수증입니다. 카드 영수증과 현금영수증 모두 인정되며, 결제 시각으로부터 {rules.receiptValidHours}시간 안에 올려야 합니다.</p>
          <ul>
            {rules.minAmount > 0 && <li>결제 금액 {formatWon(rules.minAmount)} 이상</li>}
            <li>1인당 하루 {rules.dailyLimitPerMember}장까지</li>
            <li>영수증 1장에 쿠폰 1장</li>
          </ul>
        </>
      ),
    },
    {
      id: "not-accepted",
      q: "인정되지 않는 경우는 무엇입니까?",
      a: (
        <>
          <ul>
            <li>결제 영수증이 아닌 주문서(빌지), 예약 확인 화면</li>
            <li>재출력 영수증, 다른 휴대폰 화면을 다시 찍은 사진, 화면 캡처</li>
            <li>이미 등록된 영수증(같은 승인번호 또는 같은 사진)</li>
            <li>결제 후 {rules.receiptValidHours}시간이 지난 영수증</li>
            <li>세 매장이 아닌 곳의 영수증</li>
          </ul>
          <p>글자가 흐리거나 일부가 잘리면 자동 판정이 어려워 직원 확인 대기로 넘어갑니다. 영수증을 평평하게 펴고 위에서 아래까지 전체가 나오게 찍어 주십시오.</p>
        </>
      ),
    },
    {
      id: "same-store",
      q: "영수증을 받은 매장에서는 왜 사용할 수 없습니까?",
      a: <p>이 혜택은 한 매장에서 결제한 손님이 다른 참여 매장을 한 번 더 방문하도록 만든 것입니다. 결제한 매장에서는 쿠폰을 쓸 수 없고, 나머지 두 매장 중 한 곳에서 사용합니다.</p>,
    },
    {
      id: "coupon-valid",
      q: "쿠폰은 언제까지 사용할 수 있습니까?",
      a: <p>발급일부터 {rules.couponValidDays}일입니다. 만료일은 쿠폰마다 표시되며, 만료된 쿠폰은 쿠폰함의 &lsquo;지난 쿠폰&rsquo;에 기록만 남고 사용할 수 없습니다.</p>,
    },
    {
      id: "how-to-use",
      q: "쿠폰은 매장에서 어떻게 사용합니까?",
      a: (
        <>
          <p>주문할 때 직원에게 쿠폰 화면을 보여 줍니다. 직원이 확인하면 [사용 처리] 버튼을 누르고 확인 창에서 &lsquo;예&rsquo;를 선택합니다. 화면이 &lsquo;사용 완료&rsquo;로 바뀌고 현재 시각이 초 단위로 표시되면 처리가 끝난 것입니다.</p>
          <p>미리 눌러 두면 사용할 수 없으므로 반드시 직원 앞에서 처리합니다. 직원은 쿠폰의 6자리 코드로 관리자 화면에서도 확인할 수 있습니다.</p>
        </>
      ),
    },
    {
      id: "review",
      q: "'직원 확인 대기'는 무엇입니까?",
      a: <p>자동 인식으로 판정하기 어려운 영수증은 매장 직원이 직접 확인합니다. 결과는 <Link href="/wallet">쿠폰함</Link>의 &lsquo;확인 대기&rsquo; 목록에서 볼 수 있고, 승인되면 그 자리에서 메뉴를 고를 수 있습니다. 보통 영업시간 중에 처리되며 새벽에는 늦어질 수 있습니다.</p>,
    },
    {
      id: "phone-login",
      q: "왜 전화번호만으로 로그인합니까?",
      a: (
        <>
          <p>매장 테이블에서 인증번호 문자를 기다리지 않도록 번호만 입력하면 바로 시작되게 했습니다. 쿠폰은 입력한 번호에 보관되므로 번호를 잘못 입력하면 나중에 쿠폰을 찾을 수 없습니다. 입력 후 한 번 더 확인해 주십시오.</p>
          <p>다른 기기에서 같은 번호로 접속하면 같은 쿠폰함이 보입니다.</p>
        </>
      ),
    },
    {
      id: "tiers",
      q: "등급은 어떻게 오릅니까?",
      a: (
        <>
          <p>승인된 영수증의 결제 금액이 누적됩니다. {tiers.map((t) => `${formatWon(t.minSpend)} 이상 ${t.name}`).join(", ")}. 등급별 추가 쿠폰은 매장이 발급하며 따로 신청할 필요가 없습니다.</p>
          <p>누적 금액과 다음 등급까지 남은 금액은 <Link href="/wallet">쿠폰함</Link> 상단에 표시됩니다.</p>
        </>
      ),
    },
    {
      id: "event-period",
      q: "이벤트는 언제까지입니까?",
      a: (
        <p>
          {rules.eventActive
            ? "현재 진행 중입니다. 종료일이 정해지면 홈 상단 공지로 안내합니다. 이미 발급된 쿠폰은 이벤트가 끝나도 만료일까지 사용할 수 있습니다."
            : "현재 중단 중입니다. 새 영수증 인증은 받지 않지만, 이미 발급된 쿠폰은 만료일까지 사용할 수 있습니다."}
        </p>
      ),
    },
  ];

  return (
    <div className={`wrap ${styles.page}`}>
      <header className={styles.head}>
        <h1 className="h1">이용 안내</h1>
        <p className="lead">{BRAND.ruleOneLiner}</p>
      </header>

      <section className={styles.section} aria-labelledby="how-title">
        <div className="sec-head">
          <h2 id="how-title" className="h2">이용 방법</h2>
        </div>
        <HomeSteps rules={rules} />
      </section>

      <section className={styles.section} aria-labelledby="rules-title">
        <div className="sec-head">
          <h2 id="rules-title" className="h2">기본 규칙</h2>
        </div>
        <table className={`table ${styles.rules}`}>
          <tbody>
            <tr><th scope="row">영수증 인정 시간</th><td>결제 후 {rules.receiptValidHours}시간 이내</td></tr>
            <tr><th scope="row">최소 결제 금액</th><td>{rules.minAmount > 0 ? `${formatWon(rules.minAmount)} 이상` : "제한 없음"}</td></tr>
            <tr><th scope="row">하루 인증 한도</th><td>1인 {rules.dailyLimitPerMember}장</td></tr>
            <tr><th scope="row">혜택</th><td>영수증 1장당 다른 참여 매장 사이드 메뉴 1개 무료</td></tr>
            <tr><th scope="row">쿠폰 유효기간</th><td>발급일부터 {rules.couponValidDays}일</td></tr>
            <tr><th scope="row">등급</th><td>{tiers.map((t) => `${t.name} ${formatWon(t.minSpend)} 이상`).join(" · ")}</td></tr>
            <tr><th scope="row">진행 여부</th><td>{rules.eventActive ? "진행 중" : "중단 중 (발급된 쿠폰은 만료일까지 사용 가능)"}</td></tr>
          </tbody>
        </table>
      </section>

      <section className={styles.section} aria-labelledby="faq-title">
        <div className="sec-head">
          <h2 id="faq-title" className="h2">자주 묻는 질문</h2>
        </div>
        <GuideFaq items={faq} />
      </section>

      <section className={styles.section} aria-labelledby="privacy-title">
        <div className="sec-head">
          <h2 id="privacy-title" className="h2">개인정보 처리</h2>
        </div>
        <p className={styles.privacy}>
          보관하는 정보는 전화번호, 영수증 사진, 인증·쿠폰 기록입니다. 쿠폰 발급, 중복 확인, 등급 계산에만 사용하며 다른 목적으로 쓰거나 외부에 제공하지 않습니다.
          영수증 사진은 부정 사용 확인 목적으로만 보관하며 매장 관리자 외에는 열람할 수 없습니다. 삭제를 원하면 참여 매장 어느 곳에든 요청하면 전화번호 기준으로 삭제합니다.
        </p>
      </section>

      <div className={styles.actions}>
        <Link href="/verify" className="btn btn-red">영수증 인증</Link>
        <Link href="/#stores" className="btn btn-outline">참여 매장 보기</Link>
      </div>
    </div>
  );
}
