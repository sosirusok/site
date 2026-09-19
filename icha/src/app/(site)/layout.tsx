import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { TabBar } from "@/components/site/TabBar";
import { placeSheetStores } from "@/lib/place-stores";

/** 손님 화면 틀 — 세션(cookies())을 읽지 않는다: 홈·매장·안내·로그인이 정적(ISR)으로 미리 만들어지고, 로그인 꼬리표는 Header 가 브라우저에서 /api/auth/me 로 알아낸다. */
export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="app">
      <Header />
      <main id="main">{children}</main>
      <Footer />
      <TabBar stores={placeSheetStores()} />
    </div>
  );
}
