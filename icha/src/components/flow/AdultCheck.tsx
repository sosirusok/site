"use client";
import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import { Button } from "@/components/ui/Button";
import { ADULT_AGE, isAdultBirthYear, koreanYear } from "@/lib/identity/adult";
import { VERIFIER_APP, verifierAppUrl } from "@/lib/identity/verifier-app";
import { AdultResult } from "./AdultResult";
import { runIdentityVerification, type IdentityOutcome } from "./identity";
import styles from "./AdultCheck.module.css";

type Verdict = { year: number; adult: boolean };
type Carrier = { s: "idle" } | { s: "busy" } | { s: "done"; adult: boolean; verifiedAt: string } | { s: "error"; message: string };

/**
 * 신분증을 안 가져온 손님 — 모바일 신분증 QR 을 정부 검증앱으로 찍는다.
 * 진위 확인은 검증앱이 한다(이 사이트는 QR 을 풀 수 없다). 여기서는 앱을 열어 주고, 올해 몇 년생까지인지 보여 주고,
 * 앱에 뜬 출생연도를 치면 한 글자로 판정한다. 아무것도 서버로 보내지 않는다.
 *
 * @param year 한국 기준 올해(서버가 요청 때 센 값) — 화면을 켜 둔 채 해가 바뀌면 1분 안에 따라 바뀐다
 * @param carrier 포트원 본인확인 계약이 있을 때만 휴대폰 본인확인 버튼을 덧붙인다
 */
export function AdultCheck({ year: initialYear, carrier }: { year: number; carrier: boolean }) {
  const id = useId();
  const input = useRef<HTMLInputElement>(null);
  const result = useRef<HTMLDivElement>(null);
  const [year, setYear] = useState(initialYear);
  const [appUrl, setAppUrl] = useState<string>(VERIFIER_APP.android);
  const [digits, setDigits] = useState("");
  const [verdict, setVerdict] = useState<Verdict | null>(null);
  const [typo, setTypo] = useState(false);
  const [phone, setPhone] = useState<Carrier>({ s: "idle" });

  useEffect(() => {
    // 아이폰이면 앱스토어로 — 서버는 기기를 모르니 붙은 뒤에 바꾼다
    const url = verifierAppUrl(navigator.userAgent, navigator.maxTouchPoints);
    if (url !== VERIFIER_APP.android) setAppUrl(url);
    const t = setInterval(() => setYear(koreanYear(new Date())), 60_000);
    return () => clearInterval(t);
  }, []);

  const cutoff = year - ADULT_AGE;

  function onYear(e: ChangeEvent<HTMLInputElement>) {
    const d = e.target.value.replace(/\D/g, "").slice(0, 4);
    setDigits(d);
    setVerdict(null);
    setTypo(false);
    if (d.length < 4) return;
    const y = Number(d);
    const now = new Date();
    if (y < 1900 || y > koreanYear(now)) {
      setTypo(true);
      return;
    }
    setVerdict({ year: y, adult: isAdultBirthYear(y, now) });
    // 자판을 내려야 판정이 보인다 — 네 자리를 다 치면 바로 내리고 판정으로 내려간다
    e.target.blur();
  }

  useEffect(() => {
    if (!verdict) return;
    const still = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    result.current?.scrollIntoView({ block: "center", behavior: still ? "auto" : "smooth" });
  }, [verdict]);

  function next() {
    setDigits("");
    setVerdict(null);
    setTypo(false);
    input.current?.focus();
  }

  async function startPhone() {
    setPhone({ s: "busy" });
    let out: IdentityOutcome;
    try {
      out = await runIdentityVerification(() => setPhone({ s: "error", message: "지금은 쓸 수 없습니다." }));
    } catch {
      setPhone({ s: "error", message: "인증창을 열지 못했습니다." });
      return;
    }
    if (out.kind === "left") return; // 인증창으로 화면이 넘어갔다. 돌아오면 /adult/done 이 받는다
    if (out.kind === "result") setPhone({ s: "done", adult: out.adult, verifiedAt: out.verifiedAt });
    else setPhone({ s: "error", message: out.message });
  }

  if (phone.s === "done") {
    return (
      <div className={styles.page} data-footer="short">
        <h1 className="h1">성인 확인</h1>
        <AdultResult adult={phone.adult} verifiedAt={phone.verifiedAt} onAgain={() => setPhone({ s: "idle" })} />
      </div>
    );
  }

  return (
    <div className={styles.page} data-footer="short">
      <h1 className="h1">성인 확인</h1>

      <p className={styles.cutoff}>
        <b>{cutoff}년생까지</b>
        <span>{year}년 기준</span>
      </p>

      <ol className={styles.steps}>
        <li>
          <Button href={appUrl} variant="primary" size="lg" block srSuffix={` — ${VERIFIER_APP.name}`}>
            검증앱 열기
          </Button>
          <span className={styles.app}>{VERIFIER_APP.name} · 행정안전부</span>
        </li>
        <li>
          <p className={styles.say}>손님 모바일 신분증 QR 찍고, 사진이랑 얼굴 대조</p>
          <p className={styles.aside}>PASS 신분증이면 PASS 앱 ‘QR인증’으로 찍기</p>
        </li>
        <li>
          <label className="label" htmlFor={id}>검증앱에 뜬 출생연도</label>
          <input
            ref={input}
            id={id}
            className={`input ${styles.year}`}
            type="text"
            inputMode="numeric"
            pattern="[0-9]*"
            autoComplete="off"
            enterKeyHint="done"
            placeholder="0000"
            maxLength={4}
            value={digits}
            onChange={onYear}
            aria-invalid={typo || undefined}
            aria-describedby={typo ? `${id}-err` : undefined}
          />
          {typo && <p id={`${id}-err`} className="error" role="alert">연도를 다시 보세요</p>}
        </li>
      </ol>

      {verdict && (
        <div ref={result}>
          <AdultResult adult={verdict.adult} detail={`${verdict.year}년생`} onAgain={next} />
        </div>
      )}

      {carrier && (
        <div className={styles.phone}>
          <Button type="button" variant="outline" block disabled={phone.s === "busy"} aria-busy={phone.s === "busy" || undefined} onClick={startPhone}>
            {phone.s === "busy" ? "여는 중…" : "휴대폰 본인확인"}
          </Button>
          {phone.s === "error" && <p className="error" role="alert">{phone.message}</p>}
        </div>
      )}
    </div>
  );
}
