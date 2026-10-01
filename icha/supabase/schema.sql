-- 이차(二次) 스키마. 앱이 최초 기동 시 자동으로 같은 SQL 을 실행하므로 보통 손으로 돌릴 필요는 없다.
-- Supabase SQL Editor 에서 미리 만들고 싶을 때 이 파일을 실행한다. (생성: npx tsx scripts/export-schema.ts)
create table if not exists stores (
  id            text primary key,
  name          text not null,
  short_name    text not null,
  drink         text not null,
  naver_place_id text,
  address       text,
  phone         text,
  biz_no        text,
  sort          int  not null default 0
);

create table if not exists menu_items (
  id          serial primary key,
  store_id    text not null references stores(id),
  name        text not null,
  price       int,
  description text,
  image_path  text,
  image_data  bytea,
  image_mime  text,
  is_gift     boolean not null default false,
  active      boolean not null default true,
  sort        int not null default 0
);
alter table menu_items add column if not exists image_updated_at timestamptz;
create index if not exists menu_items_store_idx on menu_items(store_id, sort);

create table if not exists members (
  id            uuid primary key default gen_random_uuid(),
  phone         text not null unique,
  created_at    timestamptz not null default now(),
  last_login_at timestamptz,
  total_spend   int not null default 0,
  visit_count   int not null default 0,
  tier          text not null default 'none',
  memo          text
);

create table if not exists receipts (
  id           uuid primary key default gen_random_uuid(),
  member_id    uuid not null references members(id),
  store_id     text references stores(id),
  status       text not null check (status in ('approved','review','rejected')),
  reasons      text[] not null default '{}',
  image        bytea,
  image_mime   text,
  sha256       text not null,
  dhash        text,
  ocr          jsonb,
  receipt_at   timestamptz,
  amount       int,
  approval_no  text,
  card_last4   text,
  created_at   timestamptz not null default now(),
  reviewed_at  timestamptz,
  reviewed_by  text,
  review_note  text,
  coupon_id    uuid
);
create index if not exists receipts_sha_idx on receipts(sha256);
create unique index if not exists receipts_sha_live_uq on receipts(sha256) where status <> 'rejected';
-- 승인번호 유니크는 매장 단위. 카드 승인번호는 단말·카드사별 일련번호라 다른 매장끼리는 같은 8자리가 나올 수 있다. 매장 미확정 건은 제외.
drop index if exists receipts_approval_live_uq;
create unique index if not exists receipts_approval_store_live_uq on receipts(store_id, approval_no) where approval_no is not null and store_id is not null and status <> 'rejected';
create index if not exists receipts_member_idx on receipts(member_id, created_at desc);
create index if not exists receipts_status_idx on receipts(status, created_at desc);
create index if not exists receipts_approval_idx on receipts(approval_no) where approval_no is not null;

create table if not exists coupons (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,
  member_id     uuid not null references members(id),
  receipt_id    uuid references receipts(id),
  use_store_id  text not null references stores(id),
  menu_item_id  int references menu_items(id),
  menu_name     text not null,
  kind          text not null check (kind in ('side','vip','manual')),
  status        text not null check (status in ('active','used','expired','void')),
  issued_at     timestamptz not null default now(),
  expires_at    timestamptz not null,
  used_at       timestamptz,
  used_via      text,
  note          text
);
create index if not exists coupons_member_idx on coupons(member_id, issued_at desc);
create unique index if not exists coupons_receipt_uq on coupons(receipt_id) where receipt_id is not null;

create table if not exists spend_ledger (
  id         serial primary key,
  member_id  uuid not null references members(id),
  store_id   text references stores(id),
  receipt_id uuid references receipts(id),
  amount     int not null,
  at         timestamptz not null default now()
);
create index if not exists spend_ledger_member_idx on spend_ledger(member_id);

create table if not exists settings (
  key        text primary key,
  value      jsonb not null,
  updated_at timestamptz not null default now()
);

create table if not exists admins (
  id         text primary key,
  name       text not null,
  store_id   text references stores(id),
  pw_hash    text not null,
  role       text not null check (role in ('owner','staff')),
  active     boolean not null default true,
  created_at timestamptz not null default now()
);

create table if not exists audit_log (
  id     serial primary key,
  at     timestamptz not null default now(),
  actor  text not null,
  action text not null,
  target text,
  meta   jsonb
);

create table if not exists rate_limits (
  key          text primary key,
  count        int not null default 0,
  window_start timestamptz not null default now()
);

-- ── 테이블톡: 같은 가게 테이블끼리 대화 (src/lib/tabletalk) ──
-- 자리 = 한 테이블에 앉은 일행. 테이블 QR 을 처음 찍은 폰이 열고, 같은 테이블 폰들이 같이 쓴다.
-- 일행이 떠나거나·직원이 비우거나·3시간 아무도 안 보거나·영업일(한국 낮 12시)이 바뀌면 끝난다. 날짜(day)는 영업일.
-- v = 이 자리 화면의 변경 번호. 이 자리가 볼 것이 바뀔 때마다 tt_v_seq 에서 새 번호를 받는다(자리끼리 번호가 겹치지 않는다)
create sequence if not exists tt_v_seq;
create table if not exists tt_seats (
  id         uuid primary key default gen_random_uuid(),
  store_id   text not null references stores(id),
  table_no   int  not null,
  day        date not null,
  status     text not null default 'on' check (status in ('on','off')),
  started_at timestamptz not null default now(),
  seen_at    timestamptz not null default now(),
  ended_at   timestamptz,
  ended_by   text,
  v          bigint not null default nextval('tt_v_seq')
);
alter table tt_seats add column if not exists v bigint not null default nextval('tt_v_seq');
create unique index if not exists tt_seats_live_uq on tt_seats(store_id, table_no) where status = 'on';
create index if not exists tt_seats_store_idx on tt_seats(store_id, status, day);
create index if not exists tt_seats_day_idx on tt_seats(day);

-- 폰 한 대 = 한 줄. in 들어옴 · wait 일행 허락 기다림 · out 나감 · no 허락 안 됨/시간 지남
create table if not exists tt_devs (
  id         uuid primary key default gen_random_uuid(),
  seat_id    uuid not null references tt_seats(id) on delete cascade,
  status     text not null check (status in ('in','wait','out','no')),
  out_reason text,
  created_at timestamptz not null default now(),
  seen_at    timestamptz not null default now(),
  decided_at timestamptz
);
create index if not exists tt_devs_seat_idx on tt_devs(seat_id, status);

-- 말 걸기(대화 신청). 상대가 수락하면 대화방이 열린다
create table if not exists tt_asks (
  id         uuid primary key default gen_random_uuid(),
  store_id   text not null references stores(id),
  from_seat  uuid not null references tt_seats(id) on delete cascade,
  to_seat    uuid not null references tt_seats(id) on delete cascade,
  note       text,
  status     text not null default 'wait' check (status in ('wait','ok','no','cancel','gone')),
  created_at timestamptz not null default now(),
  decided_at timestamptz
);
create unique index if not exists tt_asks_wait_uq on tt_asks(from_seat, to_seat) where status = 'wait';
create index if not exists tt_asks_from_idx on tt_asks(from_seat, status);
create index if not exists tt_asks_to_idx on tt_asks(to_seat, status);

-- 대화방 = 두 자리의 단체 대화. 한 쌍에 열린 방은 하나뿐
create table if not exists tt_rooms (
  id           uuid primary key default gen_random_uuid(),
  store_id     text not null references stores(id),
  seat_a       uuid not null references tt_seats(id) on delete cascade,
  seat_b       uuid not null references tt_seats(id) on delete cascade,
  status       text not null default 'open' check (status in ('open','closed')),
  created_at   timestamptz not null default now(),
  closed_at    timestamptz,
  closed_by    uuid,
  close_reason text
);
create unique index if not exists tt_rooms_open_uq on tt_rooms(least(seat_a, seat_b), greatest(seat_a, seat_b)) where status = 'open';
create index if not exists tt_rooms_a_idx on tt_rooms(seat_a);
create index if not exists tt_rooms_b_idx on tt_rooms(seat_b);

-- 글. seat_id 가 없으면 시스템 줄(kind: start·left·gone·end·staff). nonce 는 폰이 붙이는 표식 — 다시 보내도 두 번 안 들어간다
create table if not exists tt_msgs (
  id         bigserial primary key,
  room_id    uuid not null references tt_rooms(id) on delete cascade,
  seat_id    uuid,
  dev        uuid,
  kind       text,
  body       text not null,
  nonce      text,
  created_at timestamptz not null default now()
);
create index if not exists tt_msgs_room_idx on tt_msgs(room_id, id);
create unique index if not exists tt_msgs_nonce_uq on tt_msgs(room_id, nonce) where nonce is not null;

-- 차단 = 막은 자리(seat_id)가 그 테이블 번호(other_table)를 오늘 밤 막는다. 상대가 자리를 떠났다 다시 찍어도(새 자리) 그대로 막힌다
create table if not exists tt_blocks (
  seat_id     uuid not null references tt_seats(id) on delete cascade,
  other_seat  uuid not null references tt_seats(id) on delete cascade,
  other_table int,
  created_at  timestamptz not null default now(),
  primary key (seat_id, other_seat)
);
alter table tt_blocks add column if not exists other_table int;

-- 신고. 자리가 지워져도 직원이 볼 수 있게 테이블 번호와 마지막 글들을 복사해 둔다(14일 보관)
create table if not exists tt_reports (
  id          uuid primary key default gen_random_uuid(),
  store_id    text not null references stores(id),
  day         date not null,
  by_table    int not null,
  on_table    int not null,
  on_seat     uuid,
  lines       jsonb not null default '[]',
  created_at  timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by text
);
create index if not exists tt_reports_store_idx on tt_reports(store_id, created_at desc);

-- 직원이 오늘 막은 테이블
create table if not exists tt_locks (
  store_id   text not null references stores(id),
  table_no   int  not null,
  day        date not null,
  by_admin   text,
  created_at timestamptz not null default now(),
  primary key (store_id, table_no, day)
);

-- 매장마다 한 줄. 매장의 쓰기는 이 줄을 잠그고 한 줄로 선다(service.ts lockStores). swept_at = 마지막 정리 시각
create table if not exists tt_state (
  store_id text primary key references stores(id),
  v        bigint not null default 0,
  swept_at timestamptz
);

-- 테이블톡 호출 수(영업일별) — 무료 요금제 보호(src/lib/tabletalk/pace.ts)
create table if not exists tt_usage (
  day date primary key,
  n   bigint not null default 0
);

-- 매장 줄은 미리 있어야 한다(쓰기가 이 줄을 잠근다). 앱은 매장을 넣은 뒤 한 번 더 넣는다
insert into tt_state (store_id) select id from stores on conflict (store_id) do nothing;
