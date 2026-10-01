import type { Metadata } from "next";
import Link from "next/link";
import { STORE_IDS, type StoreId } from "@/lib/config";
import { STORES, getStore } from "@/lib/stores";
import { pickCode } from "@/lib/tabletalk/code";
import { readDev } from "@/lib/tabletalk/cookie";
import { currentTable, storeTables } from "@/lib/tabletalk/service";
import { getTTSettings } from "@/lib/tabletalk/settings";
import s from "@/components/tabletalk/talk.module.css";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "테이블톡",
  description: "같은 가게 다른 테이블과 대화합니다.",
  robots: { index: false, follow: false },
};

/**
 * 사이트 [테이블톡]. 가게를 고르고 앉은 테이블 번호를 누르면 그 테이블의 테이블톡(/t/…)으로 간다.
 * 이 주소(pickCode)는 테이블 QR 과 서명이 달라, 이미 열린 테이블에는 먼저 들어간 폰의 허락을 받아야 들어간다(code.ts).
 * 이미 들어가 있는 폰이면 [이어서 대화하기]. 번호 칸은 미리 불러오지 않는다(prefetch 끔) — 칸마다 서버를 부르면 무료 요금제 한도를 쓴다.
 */
export default async function TalkPage({ searchParams }: { searchParams: Promise<{ store?: string }> }) {
  const sp = await searchParams;
  const now = new Date();
  const settings = await getTTSettings();
  const current = await currentTable(await readDev(), now).catch(() => null);
  // 가게가 테이블톡을 껐으면 이어서 할 곳도 없다
  const mine = current && settings[current.store].on ? current : null;
  const picked = STORE_IDS.includes(sp.store as StoreId) ? (sp.store as StoreId) : null;
  const store = picked ? getStore(picked) : null;
  const conf = picked ? settings[picked] : null;
  const tables = picked && conf?.on && conf.pick ? await storeTables(picked, now).catch(() => ({ live: [], locked: [] })) : null;
  const live = new Set(tables?.live ?? []);
  const locked = new Set(tables?.locked ?? []);

  return (
    <section className={s.wrap} aria-labelledby="talk-title">
      <p className={s.kicker}>TABLE TALK</p>
      <h1 id="talk-title" className={s.title}>
        테이블톡
      </h1>
      <p className={s.lead}>같은 가게 다른 테이블에 말을 걸고, 상대가 받으면 두 테이블이 한 방에서 대화합니다. 로그인 없이 됩니다.</p>

      {mine && (
        <div className={s.now}>
          <p className={s.nowText}>
            지금 <b>{getStore(mine.store)?.shortName}</b> <b>{mine.table}번 테이블</b>에 들어가 있습니다.
          </p>
          <Link prefetch={false} href={`/t/${pickCode(mine.store, mine.table, settings[mine.store].gen)}`} className="btn btn-primary btn-lg btn-block">
            이어서 대화하기
          </Link>
        </div>
      )}

      <h2 className={s.step}>지금 있는 가게</h2>
      <div className={s.stores}>
        {STORES.map((st) => (
          <Link
            key={st.id}
            prefetch={false}
            href={`/talk?store=${st.id}#tables`}
            className={s.store}
            aria-current={st.id === picked ? "true" : undefined}
          >
            {st.shortName}
            {!settings[st.id].on && <small>테이블톡 안 씀</small>}
          </Link>
        ))}
      </div>

      {store && conf && (
        <>
          <h2 id="tables" className={s.step}>
            앉은 테이블 번호
            {tables && <small>테이블 위 번호 그대로</small>}
          </h2>
          {!conf.on ? (
            <p className={s.note}>이 가게는 지금 테이블톡을 쓰지 않습니다.</p>
          ) : !conf.pick ? (
            <p className={s.note}>이 가게는 테이블에 붙은 테이블톡 QR 을 찍어 들어갑니다.</p>
          ) : (
            <>
              <div className={s.grid}>
                {Array.from({ length: conf.tables }, (_, i) => i + 1).map((n) => {
                  const state = locked.has(n) ? "off" : live.has(n) ? "live" : "pick";
                  return (
                    // 막힌 번호도 누를 수 있게 둔다 — 누르면 "직원에게 말씀해 주세요" 안내가 나온다
                    <Link
                      key={n}
                      prefetch={false}
                      href={`/t/${pickCode(store.id, n, conf.gen)}`}
                      className={s.tile}
                      data-s={state}
                      aria-label={`${n}번 테이블${state === "off" ? ", 오늘은 쓸 수 없음" : state === "live" ? ", 이미 켜짐" : ""}`}
                    >
                      {n}
                      {state === "live" && <small>켜짐</small>}
                    </Link>
                  );
                })}
              </div>
              <p className={s.fine}>
                금색은 이미 켜진 테이블입니다. 일행이면 같은 번호를 누르고, 먼저 들어간 폰에서 [허락]을 누르면 같이 들어갑니다. 줄 그은 번호는 오늘 쓸 수
                없습니다.
              </p>
            </>
          )}
        </>
      )}
      <p className={s.fine}>대화는 다음날 낮 12시에 닫히고 이틀 안에 지워집니다.</p>
    </section>
  );
}
