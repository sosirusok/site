"use client";
import Link from "next/link";
import { useState } from "react";
import { formatPhone } from "@/lib/config";
import ui from "@/app/admin/admin.module.css";
import s from "@/app/admin/(shell)/counter/counter.module.css";

/** 입력 중에도 하이픈을 넣는다. 10자리(011-123-4567)는 마지막에 formatPhone 이 맞춘다 */
function live(d: string): string {
  if (d.length === 10) return formatPhone(d);
  if (d.length <= 3) return d;
  if (d.length <= 7) return `${d.slice(0, 3)}-${d.slice(3)}`;
  return `${d.slice(0, 3)}-${d.slice(3, 7)}-${d.slice(7)}`;
}

/** 계산대 번호 입력 — GET 폼이라 서버에서 조회한다. 숫자 키패드, 자동 하이픈, 엔터로 조회. */
export function CounterPhoneForm({ initial, storeId }: { initial: string; storeId: string | null }) {
  const [v, setV] = useState(initial ? live(initial) : "");
  return (
    <form method="get" action="/admin/counter" className={s.phoneForm}>
      {storeId ? <input type="hidden" name="store" value={storeId} /> : null}
      <label className={ui.label} htmlFor="counter-phone">
        손님 휴대폰 번호
      </label>
      <div className={s.phoneRow}>
        <input
          id="counter-phone"
          name="phone"
          className={s.phoneInput}
          inputMode="numeric"
          autoComplete="off"
          enterKeyHint="search"
          placeholder="010-0000-0000"
          value={v}
          onChange={(e) => setV(live(e.target.value.replace(/\D/g, "").slice(0, 11)))}
          autoFocus={!initial}
          aria-describedby="counter-phone-help"
        />
        <button type="submit" className={`${ui.button} ${s.bigButton}`}>
          조회
        </button>
      </div>
      <p id="counter-phone-help" className={ui.help}>
        번호만 넣으면 됩니다. 처음 오는 번호도 쿠폰 주기를 누르면 바로 만들어집니다.
        {initial ? (
          <>
            {" · "}
            <Link href={storeId ? `/admin/counter?store=${storeId}` : "/admin/counter"} className={s.clear}>
              다른 번호
            </Link>
          </>
        ) : null}
      </p>
    </form>
  );
}
