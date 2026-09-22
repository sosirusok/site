"use client";
import { useId, useState, type FormEvent } from "react";
import { adultBornOnOrBefore, isAdultKr } from "@/lib/identity/adult";
import styles from "./AgeGate.module.css";

/** 기억해 두는 열쇠. 값을 바꾸면 모든 손님에게 다시 묻는다 */
const KEY = "icha_age_ok";
const REMEMBER_DAYS = 180;

/**
 * 첫 화면 성인 확인.
 *
 * 국내 주류 홍보 사이트가 실제로 쓰는 방식이다(오비맥주는 예·아니요 버튼 하나뿐이다). 이 사이트는 술을 팔지 않고
 * 쿠폰도 술도 매장 카운터에서 직원이 대면으로 내주므로, 여기서 하는 일은 "미성년자에게 주류 광고를 노출하지 않는다"까지다.
 * 통신사가 확인해 주는 진짜 본인확인은 쿠폰함 문 앞에 따로 있다(/lib/identity).
 *
 * 화면이 그려지기 전에 layout 의 인라인 스크립트가 html 에 age-ok 를 붙여 이 판을 숨긴다 — 그래서 두 번째 방문에는 깜빡임이 없다.
 * 스크립트가 아예 안 돌면(JS 꺼짐) 판이 그대로 덮여 있다. 막히는 쪽이 맞다.
 */
export function AgeGate({ mode }: { mode: "year" | "yesno" }) {
  const id = useId();
  const [denied, setDenied] = useState(false);
  const [year, setYear] = useState("");
  const [error, setError] = useState<string | null>(null);
  const cutoff = adultBornOnOrBefore(new Date());

  function pass() {
    try {
      localStorage.setItem(KEY, String(Date.now()));
    } catch {
      /* 시크릿 모드 등 — 기억만 못 할 뿐 통과는 시킨다 */
    }
    document.cookie = `${KEY}=1; Max-Age=${REMEMBER_DAYS * 24 * 60 * 60}; Path=/; SameSite=Lax`;
    document.documentElement.classList.add("age-ok");
  }

  function onYear(e: FormEvent) {
    e.preventDefault();
    const y = year.replace(/\D/g, "");
    if (y.length !== 4) {
      setError("태어난 해를 네 자리로 적어 주세요. (예: 1998)");
      return;
    }
    if (isAdultKr(`${y}-01-01`, new Date())) pass();
    else setDenied(true);
  }

  if (denied) {
    return (
      <div id="agegate" className={styles.gate} role="dialog" aria-modal="true" aria-labelledby={`${id}-no`}>
        <div className={styles.panel}>
          <p className={styles.mark}>19</p>
          <h2 id={`${id}-no`} className={`d2 ${styles.title}`}>여기는 술집 이야기입니다</h2>
          <p className={styles.line}>
            {cutoff}년생까지만 볼 수 있습니다. 술을 걸고 하는 행사라 그렇습니다. 몇 해 뒤에 오세요.
          </p>
          <p className={styles.warn}>
            지나친 음주는 뇌졸중, 기억력 손상이나 치매를 유발합니다. 임신 중 음주는 기형아 출생 위험을 높입니다.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div id="agegate" className={styles.gate} role="dialog" aria-modal="true" aria-labelledby={`${id}-t`}>
      <div className={styles.panel}>
        <p className={styles.mark}>19</p>
        <h2 id={`${id}-t`} className={`d2 ${styles.title}`}>술 마실 나이 되셨습니까</h2>
        <p className={styles.line}>서면 세 집이 술로 하는 행사라 {cutoff}년생까지만 들어올 수 있습니다.</p>

        {mode === "yesno" ? (
          <div className={styles.row}>
            <button type="button" className={`btn btn-primary btn-lg ${styles.yes}`} onClick={pass}>네, 19세 이상입니다</button>
            <button type="button" className={`btn btn-outline btn-lg ${styles.no}`} onClick={() => setDenied(true)}>아니요</button>
          </div>
        ) : (
          <form className={styles.form} onSubmit={onYear} noValidate>
            <label className="label" htmlFor={`${id}-y`}>태어난 해</label>
            <input
              id={`${id}-y`}
              className={`input ${styles.year}`}
              type="tel"
              inputMode="numeric"
              autoComplete="bday-year"
              placeholder="1998"
              maxLength={4}
              value={year}
              onChange={(e) => { setYear(e.target.value.replace(/\D/g, "").slice(0, 4)); if (error) setError(null); }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? `${id}-e` : undefined}
            />
            {error && <p id={`${id}-e`} className={`error ${styles.err}`} role="alert">{error}</p>}
            <button type="submit" className="btn btn-primary btn-lg btn-block">들어가기</button>
          </form>
        )}

        <p className={styles.warn}>
          지나친 음주는 뇌졸중, 기억력 손상이나 치매를 유발합니다. 임신 중 음주는 기형아 출생 위험을 높입니다.
          만 19세 미만에게는 주류를 판매하지 않습니다.
        </p>
      </div>
    </div>
  );
}

/**
 * 판이 그려지기 전에 도는 스크립트. 기억해 둔 손님이면 html 에 age-ok 를 붙여 CSS 가 판을 숨기게 한다.
 * 180일이 지났으면 지우고 다시 묻는다.
 */
export const AGE_GATE_SCRIPT = [
  "(function(){var k=", JSON.stringify(KEY), ",ok=false;",
  "try{var v=localStorage.getItem(k);",
  "if(v&&Date.now()-Number(v)<", String(REMEMBER_DAYS * 864e5), "){ok=true}",
  "else if(v){localStorage.removeItem(k)}",
  "}catch(e){}",
  "if(!ok&&document.cookie.indexOf(k+\"=1\")>-1){ok=true}",
  "if(ok){document.documentElement.classList.add(\"age-ok\")}})()",
].join("");
