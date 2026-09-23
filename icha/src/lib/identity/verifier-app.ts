/**
 * 행정안전부 「모바일 신분증 검증앱」 — 손님 폰의 모바일 신분증 QR 을 찍어 진짜인지 확인하는 정부 앱.
 *
 * 키도 계약도 없다. 모바일 신분증 누리집(mobileid.go.kr) 신원확인자 안내가 개인·소상공인에게
 * "검증앱을 설치하여 누구나 간편하게 이용 가능합니다" 라고 적어 둔 그 앱이다. 무료.
 * 모바일 주민등록증·운전면허증은 법에서 실물과 같은 신분증이다(청소년보호법 제29조④ "모바일 주민등록증을 포함한다").
 *
 * 이 사이트가 QR 을 직접 풀 수는 없다. QR 안에는 30초짜리 거래 번호와 조폐공사 중계 서버 주소만 있고,
 * 신원 정보는 조폐공사가 승인한 검증자에게만 암호화돼 온다. 그래서 여기서는 그 앱을 열어 주기만 한다.
 *
 * 스토어 주소 확인 2026-09-23 — App Store id1600615242 (판매자 행정안전부, 5.4.0),
 * Google Play kr.go.verify.mobileid (개발자 행정안전부, 2026-09-14 업데이트).
 * 설치돼 있으면 스토어 화면의 버튼이 [열기]로 바뀐다.
 */
export const VERIFIER_APP = {
  name: "모바일 신분증 검증앱",
  ios: "https://apps.apple.com/kr/app/id1600615242",
  android: "https://play.google.com/store/apps/details?id=kr.go.verify.mobileid",
} as const;

/** 아이폰·아이패드인가 — 아이패드는 데스크톱 사파리처럼 Macintosh 라고 말하므로 터치로 가른다 */
export function isAppleMobile(userAgent: string, maxTouchPoints = 0): boolean {
  return /iPhone|iPad|iPod/i.test(userAgent) || (/Macintosh/i.test(userAgent) && maxTouchPoints > 1);
}

export function verifierAppUrl(userAgent: string, maxTouchPoints = 0): string {
  return isAppleMobile(userAgent, maxTouchPoints) ? VERIFIER_APP.ios : VERIFIER_APP.android;
}
