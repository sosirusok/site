import type { StoreId } from "../config";
import { STORES } from "../stores";
import type { ReceiptOcr } from "./ocr";

const norm = (s: string | null | undefined) => (s ?? "").toLowerCase().replace(/[\s\-_.()·,/]/g, "");
const digits = (s: string | null | undefined) => (s ?? "").replace(/\D/g, "");

export type MatchResult = { storeId: StoreId | null; score: number; evidence: string[] };

/**
 * OCR 결과가 어느 매장인지 판단한다. 규칙 기반 점수 + 모델 판단을 합산하며, 사업자번호가 맞으면 즉시 확정.
 */
export function matchStore(ocr: Pick<ReceiptOcr, "merchant_name" | "business_number" | "merchant_phone" | "merchant_address" | "matched_store" | "raw_text">): MatchResult {
  const name = norm(ocr.merchant_name);
  const raw = norm(ocr.raw_text);
  const biz = digits(ocr.business_number);
  const phone = digits(ocr.merchant_phone);
  const addr = norm(ocr.merchant_address);

  let best: MatchResult = { storeId: null, score: 0, evidence: [] };
  for (const s of STORES) {
    let score = 0;
    const ev: string[] = [];
    if (s.bizNo && biz && digits(s.bizNo) === biz) {
      score += 100;
      ev.push("사업자번호 일치");
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
    } else if (keys.some((k) => raw.includes(k))) {
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
  if (best.score < 50) return { storeId: null, score: best.score, evidence: best.evidence };
  return best;
}
