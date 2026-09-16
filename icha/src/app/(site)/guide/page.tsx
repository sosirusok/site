import type { Metadata } from "next";
import Link from "next/link";
import { Art } from "@/components/art/Art";
import { ArtButton } from "@/components/art/ArtButton";
import { GuideFaq, type FaqItem } from "@/components/site/GuideFaq";
import { joinOr, josa } from "@/components/site/StoreHelpers";
import { formatWon } from "@/lib/config";
import { listMenu } from "@/lib/db/queries";
import { getRules } from "@/lib/settings";
import { STORES } from "@/lib/stores";
import styles from "./page.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "이용 안내",
  description: "영수증을 올리는 방법, 되는 영수증과 안 되는 영수증, 쿠폰을 쓰는 방법, 전화번호와 사진을 다루는 방법을 사장님이 직접 설명해요.",
};

export default async function GuidePage() {
  const rules = await getRules();
  const gifts = await Promise.all(STORES.map(async (s) => ({ store: s, items: await listMenu(s.id, { giftOnly: true }).catch(() => []) })));
  const giftLine = gifts
    .map(({ store, items }) => `${josa(store.shortName, "은는")} ${items.length ? items.map((m) => m.name).join("·") : `${store.drink}(정하는 중)`}`)
    .join(", ");
  const giftEnd = /[가-힣]$/.test(giftLine) && (giftLine.charCodeAt(giftLine.length - 1) - 0xac00) % 28 > 0 ? "이에요" : "예요";
  const names = joinOr(STORES.map((s) => s.shortName));
  const h = rules.receiptValidHours;
  const days = rules.couponValidDays;

  const steps = [
    {
      art: "how-1",
      title: "계산하고 영수증을 찍어 올려요",
      text: "세 집 중 어디서든 좋아요. 영수증을 평평하게 놓고 위에서 아래까지 다 나오게 찍으면 자동으로 확인돼요. 흐리면 직원이 사진을 보고 확인해 줘요.",
    },
    {
      art: "how-2",
      title: "옆집 두 곳 중 한 곳을 골라요",
      text: "영수증을 받은 집을 뺀 두 집의 쿠폰이 보여요. 마시고 싶은 쪽을 고르면 쿠폰이 전화번호 쿠폰함에 들어가요.",
    },
    {
      art: "how-3",
      title: "그 집에서 직원에게 보여 주고 받아요",
      text: "주문할 때 쿠폰 화면을 보여 주세요. 직원이 확인하면 '사용하기'를 눌러 주면 끝이에요.",
    },
  ];

  const faq: FaqItem[] = [
    {
      id: "which-receipt",
      icon: "icon-receipt",
      q: "어떤 영수증이 되나요?",
      a: (
        <>
          <p>{names}에서 계산한 영수증이에요. 카드 매출전표든 현금영수증이든 괜찮아요. 결제하고 {h}시간 안에 올려 주세요.</p>
          <ul>
            {rules.minAmount > 0 && <li>{formatWon(rules.minAmount)} 이상 계산한 영수증</li>}
            <li>한 사람이 하루에 {rules.dailyLimitPerMember}장까지</li>
            <li>영수증 한 장에 쿠폰 한 장</li>
          </ul>
        </>
      ),
    },
    {
      id: "not-accepted",
      icon: "icon-error",
      q: "안 되는 경우도 있나요?",
      a: (
        <>
          <ul className={styles.fails}>
            <li><Art name="status-photo-fail" width={72} /><span>흐리거나 잘린 사진</span></li>
            <li><Art name="status-wrong-store" width={72} /><span>세 집이 아닌 곳의 영수증</span></li>
            <li><Art name="status-used" width={72} /><span>이미 올린 영수증</span></li>
          </ul>
          <p>주문서(빌지), 재출력본, 다른 화면을 다시 찍은 사진, 예약 확인 화면은 안 돼요. 결제하고 {h}시간이 지난 영수증도요.</p>
          <p>글자가 흐리거나 잘려서 자동으로 못 읽으면 반려가 아니라 '직원 확인 대기'로 넘어가요. 매장에서 사진을 보고 승인해 줘요.</p>
        </>
      ),
    },
    {
      id: "review",
      icon: "status-checking",
      q: "'직원 확인 대기'는 뭐예요?",
      a: (
        <p>
          자동으로 읽기 어려운 영수증은 직원이 직접 봐요. 보통 영업 중에 몇 분 안에 처리되고, 새벽에는 조금 늦어질 수 있어요.
          결과는 <Link href="/wallet">쿠폰함</Link>에서 볼 수 있고, 승인되면 그 자리에서 바로 고를 수 있어요.
        </p>
      ),
    },
    {
      id: "coupon-valid",
      icon: "icon-coupon",
      q: "쿠폰은 언제까지 쓸 수 있어요?",
      a: <p>받은 날부터 {days}일이에요. 만료일은 쿠폰마다 적혀 있어요. 한 번 쓰면 끝이고, 지난 쿠폰은 쿠폰함 아래쪽에 기록만 남아요.</p>,
    },
    {
      id: "how-to-use",
      icon: "icon-ok",
      q: "직원에게 어떻게 보여 주나요?",
      a: (
        <>
          <p>주문할 때 쿠폰 화면을 열어서 보여 주세요. 직원이 확인하면 '사용하기'를 길게 눌러요. 화면이 '사용 완료'로 바뀌고 시계가 초 단위로 흐르면 끝이에요.</p>
          <p>미리 눌러 두면 못 쓰니까 꼭 직원 앞에서 눌러 주세요. 직원은 쿠폰의 여섯 자리 코드로도 확인할 수 있어요.</p>
        </>
      ),
    },
    {
      id: "phone-login",
      icon: "icon-phone",
      q: "왜 전화번호만 받나요?",
      a: (
        <>
          <p>테이블에서 인증 문자를 기다리지 않게, 번호만 넣으면 바로 시작되게 했어요. 쿠폰은 그 번호에 보관되니까 번호를 잘못 넣으면 나중에 찾기 어려워요. 넣고 나서 한 번 더 봐 주세요.</p>
          <p>다른 휴대폰에서 같은 번호로 들어와도 같은 쿠폰함이 보여요.</p>
        </>
      ),
    },
    {
      id: "photos",
      icon: "icon-history",
      q: "영수증 사진은 어떻게 보관되나요?",
      a: (
        <>
          <p>같은 영수증을 두 번 쓰는지 확인하는 데만 써요. 반려된 사진은 7일, 나머지는 90일 뒤에 지워지고, 매장 관리자 말고는 아무도 볼 수 없어요.</p>
          <p>받는 건 전화번호, 영수증 사진, 인증과 쿠폰 기록뿐이고 밖으로 내보내지 않아요. 지우고 싶으면 세 집 어디에든 말씀해 주세요. 번호 기준으로 지워 드려요.</p>
        </>
      ),
    },
    {
      id: "tiers",
      icon: "icon-vip",
      q: "자주 오면 뭐가 달라지나요?",
      a: (
        <>
          <p>인증한 영수증의 결제 금액이 번호에 쌓여요. 세 집 어디서 쓰든 합산되고, 기준을 넘으면 등급이 올라가요.</p>
          <table className={`table ${styles.tiers}`}>
            <tbody>
              {rules.tiers.map((t) => (
                <tr key={t.key}>
                  <th scope="row">{t.name}</th>
                  <td>누적 {formatWon(t.minSpend)}부터</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p>등급이 오르면 사장님들이 정한 때에 쿠폰이 따로 들어가요. 신청할 건 없어요. 내 누적 금액은 <Link href="/wallet">쿠폰함</Link> 위쪽에 있어요.</p>
        </>
      ),
    },
    {
      id: "event-period",
      icon: "icon-store",
      q: "이벤트가 끝나면요?",
      a: (
        <p>
          {rules.eventActive
            ? "지금은 진행 중이에요. 끝나는 날이 정해지면 홈 위쪽에 알려 드릴게요. 이미 받은 쿠폰은 이벤트가 끝나도 만료일까지 쓸 수 있어요."
            : "지금은 잠시 쉬고 있어요. 새 영수증은 받지 않지만, 이미 받은 쿠폰은 만료일까지 쓸 수 있어요."}
        </p>
      ),
    },
  ];

  return (
    <div className={`wrap ${styles.page}`}>
      <header className={styles.hero}>
        <div className={styles.heroArt}>
          <Art name="hero-graphic" sizes="(min-width: 760px) 420px, 70vw" priority />
        </div>
        <div className={styles.heroText}>
          <h1 className="display">이렇게 이용해요</h1>
          <p>
            세 집 중 어디서든 계산하고 받은 영수증을 사진으로 올리면, 나머지 두 집 가운데 한 곳에서 그 집 술 한 잔을 무료로 드려요.
            {" "}{giftLine}{giftEnd}.
          </p>
          <div className={styles.heroAction}>
            <ArtButton kind="start" href="/verify" width={280} />
          </div>
        </div>
      </header>
      <p className={styles.rules}>
        영수증은 결제하고 {h}시간 안에 올려 주세요.
        {rules.minAmount > 0 ? ` ${formatWon(rules.minAmount)} 이상 계산한 영수증이면 되고,` : ""} 한 사람이 하루에 {rules.dailyLimitPerMember}장까지 받아요.
        받은 쿠폰은 그날부터 {days}일 동안 쓸 수 있어요. 영수증을 받은 집에서는 쿠폰이 나오지 않으니까 옆집 두 곳 것만 골라요.
      </p>

      <section className={styles.section} aria-labelledby="steps-title">
        <h2 id="steps-title" className={`h2 ${styles.h}`}>순서는 셋뿐이에요</h2>
        <ol className={styles.steps}>
          {steps.map((s, i) => (
            <li key={s.art} className={`${styles.step} rise rise-d${i + 1}`}>
              <div className={styles.stepArt}>
                <Art name={s.art} sizes="(min-width: 760px) 150px, 28vw" />
              </div>
              <div className={styles.stepText}>
                <span className={styles.no}>{i + 1}</span>
                <h3 className="h3">{s.title}</h3>
                <p>{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className={styles.section} aria-labelledby="faq-title">
        <h2 id="faq-title" className={`h2 ${styles.h}`}>궁금해하시는 것들</h2>
        <GuideFaq items={faq} />
      </section>

      <div className={styles.cta}>
        <p>영수증이 손에 있으면 지금 바로 해도 돼요. 전화번호만 있으면 돼요.</p>
        <ArtButton kind="start" href="/verify" width={300} />
      </div>
    </div>
  );
}
