import { fail } from "@/lib/http";

/**
 * 영수증 사진 접수는 끝났다(사장님 결정: 사진·자동 인식 대신 카운터 발급).
 * 예전 화면이 남아 있어도 사진을 받지 않도록 410 Gone 으로 답한다. 관리자 화면의 영수증 확인(adminDecideReceipt)은 그대로 남는다.
 */
export function POST() {
  return fail("이제 사진 대신 계산할 때 휴대폰 번호를 말하면 쿠폰이 들어와요.", 410);
}
