import type { StoreId } from "../config";
import { STORES } from "../stores";
import type { ReceiptOcr } from "./ocr";

const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().replace(/[\s\-_.()·,/]/g, "");
const digits = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");

export type MatchResult = { storeId: StoreId | null; score: number; evidence: string[] };

/**
 * OCR 결과가 어느 매장인지 판단한다. 규칙 기반 점수 + 모델 판단을 합산하며, 사업자번호가 맞으면 즉시 확정.
 * 사업자번호가 읽혔는데 등록값과 다르면 크게 감점한다(다른 지점 대비). 판정(rules.ts)에서 한 번 더 BIZNO_MISMATCH 로 걸러 직원 확인으로 보낸다.
 */
export function matchStore(ocr: Pick<ReceiptOcr, "merchant_name" | "business_number" | "merchant_phone" | "merchant_address" | "matched_store" | "raw_text">): MatchResult {
  const name = norm(ocr.merchant_name);
  const raw = norm(ocr.raw_text);
  const biz = digits(ocr.business_number);
  const phone = digits(ocr.merchant_phone);
  const addr = norm(ocr.merchant_address);

  let best: MatchResult = { storeId: null, score: Number.NEGATIVE_INFINITY, evidence: [] };
  const notes: string[] = [];
  for (const s of STORES) {
    let score = 0;
    const ev: string[] = [];
    if (s.bizNo && biz) {
      if (digits(s.bizNo) === biz) {
        score += 100;
        ev.push("사업자번호 일치");
      } else {
        // 사업자번호가 읽혔는데 등록값과 다르면 같은 상호의 다른 지점일 가능성이 크다
        score -= 100;
        ev.push("사업자번호 불일치");
        notes.push(`${s.shortName} 사업자번호 불일치`);
      }
    }
    const phones = [s.phone, ...s.phoneAliases].filter(Boolean).map((x) => digits(x));
    if (phone && phones.includes(phone)) {
      score += 60;
      ev.push("전화번호 일치");
    }
    const keys = [s.name, s.shortName, ...s.aliases].map(norm).filter((k) => k.length >= 2);
    if (keys.some((k) => name.includes(k) || k.includes(name) && name.length >= 3)) {
      score += 50;
      ev.push("상호 일치");
    } else if (keys.some((k) => k.length >= 4 && raw.includes(k))) {
      score += 35;
      ev.push("본문에 상호 포함");
    }
    for (const kw of s.addressKeywords) {
      if (kw && (addr.includes(norm(kw)) || raw.includes(norm(kw)))) {
        score += 25;
        ev.push(`주소 키워드 '${kw}'`);
        break;
      }
    }
    if (ocr.matched_store === s.id) {
      score += 20;
      ev.push("모델 판단 일치");
    }
    if (score > best.score) best = { storeId: s.id, score, evidence: ev };
  }
  // 50점 미만이면 미확정. 근거(예: '사업자번호 불일치')는 관리자 화면에 보이도록 남긴다.
  const score = Number.isFinite(best.score) ? best.score : 0;
  if (score < 50) return { storeId: null, score, evidence: Array.from(new Set([...best.evidence, ...notes])) };
  return { ...best, score };
}
