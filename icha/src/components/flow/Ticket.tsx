import { kitPiece } from "./kit";
import { NeonTicket, type TicketProps } from "./NeonTicket";
import { PaperTicket } from "./PaperTicket";

export type { TicketProps, TicketSize } from "./NeonTicket";
export type { TicketData } from "./PaperTicket";

/**
 * 쿠폰 한 장 — 어떤 그림으로 그릴지는 키트 파일명이 정한다(코드 수정 없음):
 *  1. 키트에 ticket.png(55장 세트의 크림 종이 티켓)가 있으면 → 종이 쿠폰(PaperTicket)을 그 그림 위에
 *  2. 없고 ticket-<매장>.png(오늘 받은 네온 티켓)가 있으면 → 네온 쿠폰(NeonTicket)
 *  3. 둘 다 없으면 → 지금의 CSS 종이 쿠폰(PaperTicket)
 */
export function Ticket(props: TicketProps) {
  const cream = kitPiece("ticket");
  if (cream) return <PaperTicket {...props} bg={cream} />;
  if (kitPiece(`ticket-${props.t.storeId}`)) return <NeonTicket {...props} />;
  return <PaperTicket {...props} />;
}
