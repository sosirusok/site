import type { Metadata, Viewport } from "next";
import { TableTalk } from "@/components/tabletalk/TableTalk";
import { STORE_IDS } from "@/lib/config";
import { parseTableCode, storeOfCode } from "@/lib/tabletalk/code";
import { readDev } from "@/lib/tabletalk/cookie";
import { entryInfo, sync } from "@/lib/tabletalk/service";
import { getTTSettings } from "@/lib/tabletalk/settings";
import type { Entry } from "@/lib/tabletalk/types";
import { countHit, withPace } from "@/lib/tabletalk/usage";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "테이블톡",
  description: "같은 가게 다른 테이블과 대화합니다.",
  robots: { index: false, follow: false },
};

/** 글을 쓰려고 자판이 올라오면 화면이 그만큼 줄어든다(안드로이드 크롬) — 아래 입력칸이 자판에 가리지 않게 */
export const viewport: Viewport = { themeColor: "#08080a", interactiveWidget: "resizes-content" };

/**
 * 테이블 QR 이 여는 화면. 주소만 열어서는 아무것도 만들지 않는다 — 카메라 앱·메신저 미리보기가 먼저 열어 봐도 괜찮게.
 * 이 폰이 이미 이 테이블에 들어와 있으면 번호판을 바로 그린다.
 */
export default async function TableTalkPage({ params }: { params: Promise<{ code: string }> }) {
  const { code } = await params;
  await countHit();
  const settings = await getTTSettings();
  const raw = decodeURIComponent(code);
  const ref = parseTableCode(raw, (s) => settings[s].gen);
  let entry: Entry = { kind: "bad" };
  if (ref) {
    const info = await entryInfo(ref, await readDev());
    // 이미 들어와 있는 폰은 어느 주소로 와도 이어서 본다. 번호로 받은 주소로 새로 들어오는 것만 사장님 설정을 따른다
    if (info.kind === "in") entry = { kind: "in", code, sync: await withPace(await sync(info.dev, -1, 0)) };
    else if (info.kind === "join" && ref.via === "pick" && !settings[ref.store].pick) entry = { kind: "qronly", storeName: info.storeName, table: ref.table };
    else if (info.kind === "join") entry = { kind: "join", code, store: ref.store, table: ref.table, storeName: info.storeName, existing: info.existing, elsewhere: info.elsewhere, why: info.why };
    else entry = info;
  }
  // 안내 화면의 [테이블 번호로 들어가기]는 그 가게(모르면 아무 가게나)가 번호로 들어오기를 받을 때만
  const st = ref?.store ?? storeOfCode(raw);
  const pickable = st ? settings[st].on && settings[st].pick : STORE_IDS.some((id) => settings[id].on && settings[id].pick);
  return <TableTalk entry={entry} pickable={pickable} />;
}
