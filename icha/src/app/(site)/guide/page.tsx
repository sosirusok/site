import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BRAND, formatWon } from "@/lib/config";
import { getRules } from "@/lib/settings";
import { STORES } from "@/lib/stores";
import { GuideFaq, type FaqItem } from "@/components/site/GuideFaq";
import { firstOfKind, wonShort } from "@/components/site/StoreHelpers";
import { Marquee } from "@/components/site/Marquee";
import hero from "@/components/site/HomeHero.module.css";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "이용 방법과 유의사항",
  description: "영수증 인정 기간, 인정되지 않는 경우, 쿠폰 유효기간, 직원 확인 방법, 전화번호 로그인과 개인정보 처리.",
};

export default async function GuidePage() {
  const rules = await getRules();
  const names = STORES.map((s) => s.shortName);
  const tiers = rules.tiers;
  const bg = (STORES[1] && firstOfKind(STORES[1], "interior")) ?? (STORES[0] && firstOfKind(STORES[0], "interior")) ?? null;

  const faq: FaqItem[] = [
    {
      id: "which-receipt",
      q: "어떤 영수증이 인정되나요?",
      a: (
        <>
          <p>
            {names.join(", ")} 세 매장의 <b>결제 영수증</b>이에요. 카드 영수증, 현금영수증 모두 괜찮아요. 결제 시각으로부터{" "}
            <b>{rules.receiptValidHours}시간 안</b>에 올려 주셔야 해요.
          </p>
          <ul>
            {rules.minAmount > 0 && <li>결제 금액 {formatWon(rules.minAmount)} 이상</li>}
            <li>한 사람이 하루에 {rules.dailyLimitPerMember}장까지</li>
            <li>영수증 한 장에 쿠폰 한 장</li>
          </ul>
        </>
      ),
    },
    {
      id: "not-accepted",
      q: "인정되지 않는 경우는요?",
      a: (
        <>
          <ul>
            <li>결제 영수증이 아닌 <b>주문서(빌지)</b>나 예약 확인 화면</li>
            <li><b>재출력</b> 영수증, 다른 사람 휴대폰 화면을 다시 찍은 사진, 화면 캡처</li>
            <li>이미 등록된 영수증(같은 승인번호, 같은 사진)</li>
            <li>결제 후 {rules.receiptValidHours}시간이 지난 영수증</li>
            <li>세 매장이 아닌 곳의 영수증</li>
          </ul>
          <p>
            글자가 흐리거나 일부가 잘리면 자동 판정이 어려워 <b>직원 확인 대기</b>로 넘어가요. 영수증을 평평하게 펴고, 위에서 아래까지 전체가 나오게 찍어 주세요.
          </p>
        </>
      ),
    },
    {
      id: "same-store",
      q: "영수증을 받은 매장에서는 왜 안 되나요?",
      a: (
        <p>
          이 이벤트는 "1차는 마음대로, 2차는 우리가"예요. 한 곳에서 드신 분이 <b>옆집으로 한 번 더</b> 가시라고 만든 거라, 영수증을 받은 매장에서는 혜택이 없어요. 나머지 두 곳 중 한 곳을 골라 주세요.
        </p>
      ),
    },
    {
      id: "coupon-valid",
      q: "쿠폰은 언제까지 쓸 수 있나요?",
      a: (
        <p>
          발급된 날부터 <b>{rules.couponValidDays}일</b>이에요. 만료일은 쿠폰마다 적혀 있고, 지나면 자동으로 사라져요. 오늘 받아서 오늘 쓰셔도 되고, 다음 주에 오셔도 돼요.
        </p>
      ),
    },
    {
      id: "how-to-use",
      q: "쿠폰은 매장에서 어떻게 쓰나요?",
      a: (
        <>
          <p>
            주문할 때 직원에게 쿠폰 화면을 보여 주시고, <b>직원이 보는 앞에서 '사용' 버튼을 길게 눌러</b> 주세요. 화면이 '사용 완료'로 바뀌고 시각이 흐르기 시작하면 끝이에요. 미리 눌러 두시면 쓸 수 없으니 꼭 직원 앞에서요.
          </p>
          <p>직원은 쿠폰에 적힌 6자리 코드로 관리자 화면에서도 확인할 수 있어요.</p>
        </>
      ),
    },
    {
      id: "review",
      q: "'직원 확인 대기'는 뭔가요?",
      a: (
        <p>
          자동 인식이 확신하지 못한 영수증은 매장 직원이 직접 봐요. 결과는 <Link href="/wallet">쿠폰함</Link>의 '확인 대기' 목록에서 볼 수 있고, 승인되면 그 자리에서 메뉴를 고를 수 있어요. 보통 영업 중에 처리되지만, 새벽에는 늦어질 수 있어요.
        </p>
      ),
    },
    {
      id: "phone-login",
      q: "왜 전화번호만으로 로그인하나요?",
      a: (
        <>
          <p>
            술집 테이블에서 인증번호 문자를 기다리게 하고 싶지 않았어요. 그래서 번호만 입력하면 바로 시작돼요. 쿠폰은 <b>입력한 번호에 보관</b>되니, 번호를 잘못 넣으면 나중에 쿠폰을 찾을 수 없어요. 한 번 더 확인하고 눌러 주세요.
          </p>
          <p>다른 기기에서 같은 번호로 들어오면 같은 쿠폰함이 보여요.</p>
        </>
      ),
    },
    {
      id: "tiers",
      q: "등급은 어떻게 오르나요?",
      a: (
        <>
          <p>
            승인된 영수증의 결제 금액이 누적돼요. {tiers.map((t) => `${formatWon(t.minSpend)}부터 ${t.name}`).join(", ")}. 등급별로 사장님들이 쿠폰을 넣어 드릴 때가 있고, 따로 신청할 건 없어요.
          </p>
          <p>누적 금액과 다음 등급까지 남은 금액은 <Link href="/wallet">쿠폰함</Link> 위쪽에 보여요.</p>
        </>
      ),
    },
    {
      id: "privacy",
      q: "개인정보는 어떻게 처리하나요?",
      a: (
        <p>
          보관하는 건 <b>전화번호</b>와 <b>영수증 사진</b>, 그리고 인증·쿠폰 기록이에요. 쿠폰 발급과 중복 확인, 등급 계산에만 쓰고 다른 목적으로 쓰거나 밖으로 넘기지 않아요. 영수증 사진은 중복 확인이 끝난 뒤 정리해요. 삭제를 원하시면 세 매장 중 어느 곳에든 말씀해 주시면 번호 기준으로 지워 드려요.
        </p>
      ),
    },
    {
      id: "event-period",
      q: "이벤트는 언제까지인가요?",
      a: (
        <p>
          {rules.eventActive
            ? "지금 진행 중이에요. 끝나는 날이 정해지면 홈 위쪽에 먼저 알려 드릴게요. 이미 받은 쿠폰은 이벤트가 끝나도 만료일까지 쓸 수 있어요."
            : "지금은 쉬는 중이에요. 새 영수증 인증은 받지 않지만, 이미 받은 쿠폰은 만료일까지 쓸 수 있어요."}
        </p>
      ),
    },
  ];

  const bigNums: { n: string; unit: string; label: string }[] = [
    { n: String(rules.receiptValidHours), unit: "시간", label: "결제 후 인정" },
    { n: "1", unit: "접시", label: "영수증 한 장에" },
    { n: String(rules.dailyLimitPerMember), unit: "장", label: "하루 한도" },
    { n: String(rules.couponValidDays), unit: "일", label: "쿠폰 유효" },
  ];

  return (
    <div className={styles.page}>
      <header className={styles.head}>
        {bg && <Image src={bg.src} alt="" fill sizes="100vw" priority className={styles.bgImg} />}
        <div className={styles.shade} aria-hidden="true" />
        <div className={`wrap ${styles.headInner}`}>
          <p className={`${hero.enter} ${styles.eyebrow}`}>{BRAND.unionName}</p>
          <h1 className={`display ${hero.enter} ${hero.enterD1} ${styles.title}`}>이용 방법과<br /><em>유의사항</em></h1>
          <p className={`lead ${hero.enter} ${hero.enterD2} ${styles.lead}`}>{BRAND.ruleOneLiner} 궁금할 만한 것을 짧게 적었어요.</p>
          <ul className={`${hero.enter} ${hero.enterD3} ${styles.nums}`} aria-label="숫자로 보는 규칙">
            {bigNums.map((b) => (
              <li key={b.label}>
                <span className={styles.numBig}><span className="num">{b.n}</span><em>{b.unit}</em></span>
                <span className={styles.numLabel}>{b.label}</span>
              </li>
            ))}
          </ul>
        </div>
      </header>

      <Marquee items={["영수증 한 장", "사이드 한 접시", ...names, "직원 앞에서 사용", "전화번호만으로"]} speed={44} />

      <div className={`wrap ${styles.grid}`}>
        <div className={styles.main}>
          <GuideFaq items={faq} />
        </div>

        <aside className={styles.side}>
          <div className={`paper paper-shadow rise rise-d1 ${styles.rulesPaper}`}>
            <p className={styles.paperTitle}>{BRAND.name} <span>{BRAND.hanja}</span></p>
            <p className={styles.paperSub}>숫자로 보는 규칙</p>
            <hr className="dots" />
            <div className="row"><b>영수증 인정</b><span className="val">결제 후 {rules.receiptValidHours}시간</span></div>
            {rules.minAmount > 0 && <div className="row"><b>최소 금액</b><span className="val">{formatWon(rules.minAmount)}</span></div>}
            <div className="row"><b>하루 한도</b><span className="val">{rules.dailyLimitPerMember}장</span></div>
            <div className="row"><b>쿠폰 유효</b><span className="val">{rules.couponValidDays}일</span></div>
            <div className="row"><b>영수증 1장</b><span className="val">사이드 1접시</span></div>
            <hr className="dots" />
            {tiers.map((t) => {
              const w = wonShort(t.minSpend);
              return <div className="row" key={t.key}><b>{t.name}</b><span className="val">누적 {w.num}{w.unit}부터</span></div>;
            })}
            <hr className="dots" />
            <p className={styles.paperFoot}>{rules.eventActive ? "* 진행 중" : "* 잠시 쉬는 중"}</p>
          </div>

          <div className={`rise rise-d2 ${styles.sideCta}`}>
            <Link href="/verify" className="btn btn-block btn-lg">영수증 인증하기</Link>
            <Link href="/#stores" className="btn btn-block btn-outline">세 매장 보기</Link>
          </div>
        </aside>
      </div>
    </div>
  );
}
