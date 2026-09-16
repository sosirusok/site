import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";
import { TabBar } from "@/components/site/TabBar";
import { getMemberSession } from "@/lib/auth/session";
import { placeSheetStores } from "@/lib/place-stores";

export default async function SiteLayout({ children }: { children: React.ReactNode }) {
  const session = await getMemberSession();
  return (
    <div className="app">
      <Header loggedIn={Boolean(session)} phone={session?.phone ?? null} />
      <main id="main">{children}</main>
      <Footer />
      <TabBar stores={placeSheetStores()} />
    </div>
  );
}
