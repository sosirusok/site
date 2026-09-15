/**
 * 실제 영수증 사진으로 판독·판정을 시험한다 (DB 저장 없음).
 *   ANTHROPIC_API_KEY=... npx tsx scripts/ocr-try.ts ./영수증.jpg [./영수증2.jpg ...]
 * 출력: 읽은 값(JSON), 매장 매칭 근거, 규칙 판정 결과.
 */
import { readFileSync } from "node:fs";
import { normalizeImage } from "../src/lib/receipt/image";
import { recognizeReceipt, ocrEnabled } from "../src/lib/receipt/ocr";
import { matchStore } from "../src/lib/receipt/match";
import { decide } from "../src/lib/receipt/rules";
import { DEFAULT_RULES, reasonText } from "../src/lib/config";

async function main() {
  const files = process.argv.slice(2);
  if (!files.length) {
    console.error("사용법: ANTHROPIC_API_KEY=... npx tsx scripts/ocr-try.ts <사진 경로...>");
    process.exit(1);
  }
  if (!ocrEnabled()) {
    console.error("ANTHROPIC_API_KEY 가 없습니다.");
    process.exit(1);
  }
  const now = new Date();
  for (const f of files) {
    console.log(`\n=== ${f}`);
    const img = await normalizeImage(readFileSync(f));
    console.log(`표준화: ${img.width}x${img.height}, ${Math.round(img.buffer.length / 1024)}KB, sha256 ${img.sha256.slice(0, 12)}…, dhash ${img.dhash}`);
    const t0 = Date.now();
    const ocr = await recognizeReceipt(img.buffer, now);
    console.log(`판독 ${((Date.now() - t0) / 1000).toFixed(1)}초`);
    console.log(JSON.stringify({ ...ocr, raw_text: undefined }, null, 2));
    console.log("--- raw_text ---\n" + ocr.raw_text);
    const match = matchStore(ocr);
    console.log("매장 매칭:", match);
    const d = decide({ now, rules: DEFAULT_RULES, ocr, ocrFailure: null, matchedStore: match.storeId, dedup: { exactImage: false, similarImage: false, sameApproval: false, sameFingerprint: false }, todayCount: 0 });
    console.log(`판정: ${d.status} ${d.reasons.map((r) => `${r}(${reasonText(r)})`).join(", ") || "(사유 없음)"}`);
    console.log(`매장 ${d.storeId ?? "-"} / 금액 ${d.amount ?? "-"} / 결제 ${d.receiptAt?.toISOString() ?? "-"} / 승인번호 ${d.approvalNo ?? "-"}`);
  }
}
main().then(() => process.exit(0)).catch((e) => { console.error(e); process.exit(1); });
