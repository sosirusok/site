import { AGE_GATE_SCRIPT, AgeGate } from "@/components/site/AgeGate";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { TabBar } from "@/components/site/TabBar";
import { placeSheetStores } from "@/lib/place-stores";

/** 성인 확인 판의 모양 — year(태어난 해 입력, 기본) / yesno(오비맥주식 예·아니요) / off(끔). ADULT_GATE 환경변수. */
function gateMode(): "year" | "yesno" | "off" {
  const v = process.env.ADULT_GATE?.trim().toLowerCase();
  return v === "yesno" || v === "off" ? v : "year";
}

/** 손님 화면 틀 — 세션(cookies())을 읽지 않는다: 홈·매장·안내·로그인이 정적(ISR)으로 미리 만들어지고, 로그인 꼬리표는 Header 가 브라우저에서 /api/auth/me 로 알아낸다. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  const mode = gateMode();
  return (
    <>
      {/* 판은 .app 바깥에 둔다 — .app 은 overflow-x: clip 이라 안에 넣으면 고정 요소가 잘릴 수 있다.
          스크립트는 판보다 앞에 있어야 두 번째 방문에서 깜빡이지 않는다(판을 그리기 전에 html 에 age-ok 를 붙인다). */}
      {mode !== "off" && <script dangerouslySetInnerHTML={{ __html: AGE_GATE_SCRIPT }} />}
      {mode !== "off" && <AgeGate mode={mode} />}
      <div className="app">
        <Header />
        <main id="main">{children}</main>
        <Footer />
        <TabBar stores={placeSheetStores()} />
      </div>
    </>
  );
}
