import { redirect } from "next/navigation";

/** 옛 주소 — 쿠폰 받는 법은 이용 안내에 합쳤다. 포스터 QR 은 네이버 플레이스로 가므로 여기로 오는 손님은 거의 없다. */
export default function VerifyPage() {
  redirect("/guide");
}
