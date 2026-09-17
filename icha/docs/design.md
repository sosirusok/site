# 알콜부시기 — 디자인·구현 가이드

이 문서는 화면을 만드는 사람(에이전트 포함)이 반드시 읽고 따르는 계약이다.

## 1. 무엇을 만드는가
서면의 세 술집 — **1차 도쿄스탠드 서면점(맥주) → 2차 조선칼국수와통막걸리 서면밀레오레본점(막걸리) → 3차 와르르맨숀 서면점(소주)** — 의 콜라보 사이트. 세 집은 서로 50m 안에 있다.
규칙: 한 집에서 계산할 때 휴대폰 번호를 말하면 직원이 카운터 화면에 번호를 넣어 쿠폰을 준다. 손님은 50m 안 다른 집에서 메인안주 1개를 주문할 때 그 쿠폰을 보여 주고 그 집 특별 혜택을 받는다. 쿠폰을 받은 매장에서는 쓸 수 없다.

주 사용 환경: **손님이 술집 테이블에서 휴대폰으로** (포스터 QR → 네이버 플레이스 → 소개글 링크 → 이 사이트). 모바일이 기본, 데스크톱은 확장. 직원은 매장 태블릿·휴대폰으로 관리자 화면을 본다.

## 2. 디자인 언어 v10 — "포스터 콜라주 + 키트 61장"

> v10(2026-09): 디자이너의 키트 61장(`public/images/kit/`, `docs/kit.md`)이 포스터 조각·CSS 판·CSS 버튼을 대신한다. 아래 v9 문단 중 조각·판·버튼·배경·캡션 항목은 이 절의 **v10 규칙**이 우선한다.

### v10 규칙 — 키트 그림 위에 CSS 를 겹치지 않는다
- **그림자 없음**: 키트 그림(간판·혜택·제목판·버튼·순서·알약·리본·메모·컷아웃·도장·테이프·화살표·티켓·봉투·소주잔)에는 그림자·외곽선이 이미 그려져 있다. 그 위에 `box-shadow`·`filter: drop-shadow`·`border`·`border-radius` 를 얹지 않는다(`.stk.stk-kit`, `.kbtn`, `.klabel` = `none`). CSS 스티커 그림자는 키트가 없을 때의 대체(`.stk`, `.btn`, `.plate`)에만 남는다. 눌린 그림 버튼은 `translateY(2px) + brightness(.96)`.
- **배경**: `bg-night.jpg`(가로 화면은 `bg-night-wide.jpg`) 고정·cover, 흐림 없음(이미 보케), 확대 없음(1.15배 확대본), 위에 어두운 한 겹 `rgba(12,8,20,.50)` — 0.45~0.58 을 화면으로 비교해 크림 종이가 앞으로 나오면서 골목 불빛이 남는 값. `.app` 은 `isolation: isolate` 라 안의 어떤 z-index 도 body 에 포털된 시트 위로 못 올라온다.
- **크기는 잰 값**(390px 화면 = 단 358px; 표는 `docs/kit.md`): 간판 1200×500 → 한 단 가득 358×149(홈·매장 화면), 혜택 1000×300 → ≤300 + 옆 컷아웃(맥주·소주 96px 높이, 주전자 96px 폭, 요거트 84px 높이), 제목판 700×200 → 46px(큰 제목 60px), 리본 → 한 단 가득 58px, 순서 600×360 → 2×2 칸 폭 (단−44)/2 에 화살표 44×22 는 1→2·3→4 사이에만, 알약 → 300 가운데, 버튼 900×220 → 52px(작은 것 44, 한 줄 가득 64는 크림 바 가운데·폭으로 늘리지 않음), 꼬리표 420×150 → 40px(누르는 상자 44), 아이콘 24, 메모 note-good 130·note-phone 300·note-again/today 136~140, 도장 56(무료)/96(사용 완료) −12°(고르기 줄 44), 테이프 68×20 opacity .85, 티켓 → 한 단 가득 153px(글자 왼쪽 5~71%·위아래 8%, 반쪽 76~96%), 봉투 160, 소주잔 150, 제목 42px(맨 위 줄에서 가장 큼; 로그인 꼬리표는 36), 머리 배너 → 화면 폭 그대로 자르지 않음. 주전자는 76px 폭(세 혜택 상자가 3% 안에서 같은 폭). 조각을 나란히 견줄 때는 **보이는 몸통**으로 맞춘다: `plate-joseon`(불투명 간판이 캔버스의 70%)은 112%/112%/72%/94px(`docs/kit.md` 규칙 7). 순서 2×2 는 줄 사이 28px 에 2→3 꺾인 화살표(40×20, 135°)까지 — 넷이 한 줄로 이어진다.
- **흰 손글씨 메모**(note-again·note-today)는 키트에서 유일하게 그림자가 안 구워진 글씨라 보케 위에서 `.note-dark` — 받침 상자가 아니라 획마다 검은 테두리 그림자 + 글자 상자보다 사방 26/40px 큰 타원 어둠(`::before`, 가장자리 0%, z-index −1). 직사각형이 보이지 않는다. 크림 메모(note-good·note-phone)는 어디서나 그대로. 매장 화면의 note-good 은 가게 간판 띠 아래(사진마다 잰 top, `StoreHero.module.css`), 사진은 68vw 상자에 `50% 0%`(도쿄·조선) — **가게 간판을 자르지 않는다**.
- **아래 고정 크림 바** `.fixed-col.sticky-bar`: 탭 바 바로 위 불투명 크림(#F4E9D2), 위 검은 선 1px, 안에 64px 그림 버튼 하나 가운데. 높이 `--stickybar-h` 80px + 탭 60px = 140px; 본문은 `.app:has(.sticky-bar)` 가 그만큼(+16px) 아래를 비운다. 매장 화면(예약하기)·사용 매장 선택(이 쿠폰 받기)·쿠폰 화면(직원 앞에서 사용하기)이 쓴다. 떠 있는 스티커 `.sticky-cta` 는 없앴다.
- **읽히는 이름 = 그림 글자**: 그림 버튼·제목판의 접근성 이름은 `KIT_ALT`(그림에 적힌 글자). 같은 버튼이 여럿이면 `suffix`(" — 도쿄스탠드")만, 진행 중은 `srText`("발급 중"). 그림 안 글자와 CSS 글자를 겹쳐 쓰지 않는다.
- **사진 캡션**(v9 의 "캡션 없음"을 뒤집음): 폴라로이드 흰 띠 아래에 캡션 — Pretendard 13px/700 잉크색, 왼쪽 정렬, 명사구만(값 앞에서만 접힘, 잘림 없음). 메뉴 사진은 `stores.ts` 의 이름·가격 그대로("조선 김치전 · 12,000원"), 장소는 "매장 입구"·"1층 홀". 문장·농담 없음. 사진은 4:3 창(`storePhotos.ts` 의 `pos` 는 실제 파일을 하나씩 잘라 보고 정한 값). 실제 글꼴로 잰 가장 긴 캡션은 227px(시그니처 콜드햄 플레이트 · 13,900원)라 홈의 큰 카드(단의 3/5, 캡션 폭 198px)에 다 들지 않는 것이 셋(430 화면은 하나) — 값이 '13…'로 잘리는 대신 **값 앞에서만 둘째 줄로 접힌다**(`capParts`: "시그니처 콜드햄 플레이트" / "· 13,900원", 2줄까지). 매장 화면의 한 단 가득 카드(344px)는 다 한 줄. 작은 카드(2/5)는 캡션이 짧은 장소 사진만. 홈 3장: [안주 큰 카드][입구 작은 카드] / [포켓: 손글씨 메모 또는 요거트][술 큰 카드]. 매장 화면 5장: [대표 안주 한 단 가득] / [큰][작은] / [작은][큰] — 서로 덮지 않는다(캡션이 가려지면 안 되므로).
- **지도**: 컨테이너 높이 명시(190px), 표시 직후·300ms 뒤·크기 변할 때 `invalidateSize()` + 다시 맞춤. 홈은 세 핀과 라벨이 다 들어오게(위 56·좌우 56·아래 44 여백), 서면역 표시는 통째로 들어올 때만 그린다(가장자리에 반쯤 걸치지 않는다). 매장 화면은 그 핀 + 서면역.
- **검수**: `scratchpad/pw/geo-check.mjs` 를 390×844·430×932 로 모든 화면에 돌린다 — 가로 스크롤 0, `<img>` 비율 ±2%(object-fit fill 만), a/button ≥44×44, 20px 미만 글자의 뒤 픽셀 대비 ≥4.5(글자를 투명하게 만든 캡처에서 가운데·네 모서리), 글자 요소끼리 8×8 초과 겹침 0, 이미지가 끝까지 내려도 고정 바에 덮이지 않음. 결과는 `scratchpad/shots/geo/*.json`.


사장님 전단지(`public/images/event/poster.jpg`)가 화면 아래로 계속 이어지는 것처럼 보여야 한다. 손님 눈에 "가게가 직접 만든, 지금 운영 중인 사이트"여야지 "코드로 짠 데모"로 보이면 실패다. 상자·테두리·네온·그라데이션·아이콘 세트·생성 이미지는 쓰지 않는다.

- **배경**: 포스터의 밤거리 보케 한 장(`/images/poster/bokeh.jpg`)이 화면 전체에 고정되고(`.app::before`, `position: fixed`) 그 위에 35% 미만의 어두운 겹 하나. 스크롤해도 배경은 그대로고 내용만 지나간다. 배경을 섹션마다 바꾸지 않는다.
- **조각 스티커**: 포스터에서 오려 낸 PNG(`/images/poster/*.png` — hero-top, title, title-tight, plate-*, benefit-*, ribbon-event, steps, step-1..4, pill-condition, note-*, mug, footer-line)를 `<Piece name=…>`(`src/components/site/Poster.tsx`)로 그대로 붙인다. 다시 그리지 않고, 글자가 든 조각은 alt 에 그 글자를 그대로 적는다. 기본은 `.stk`(모서리 6px, 딱딱한 그림자, `--r` 기울기 ±1~6°), 모서리 테이프는 `.tape*`. 매장 이름은 언제나 그 집의 포스터 간판 조각(`plateOf(id)`), 혜택은 `benefitOf(id)`.
- **종이**: 크림색(`--cream`) 종이 카드 `.paper`(살짝 기울임 `.paper-l`/`.paper-r`), 찢은 메모 `.scrap > .scrap-in`, 종이 위 목록 `.row`, 정보표 `.kv`. 종이 위 글자는 잉크색 `--ink`, 보조는 `--ink-2`, 구분선은 점선 `--paper-line`. 쿠폰은 종이 티켓(`src/components/flow/PaperTicket.tsx`: 위아래 구멍, 점선으로 뜯는 반쪽, Do Hyeon 코드). 안내·자주 묻는 질문·입력 폼도 모두 종이 위에 놓는다.
- **사진**: 진짜 매장 사진만 폴라로이드(`.pola`, 흰 테두리)로. (v10) 흰 띠 아래에 명사구 캡션(값 앞에서만 접힘) — 위 v10 규칙. 사진 설명은 `alt` 로도.
- **손글씨**: 놀이 문구는 사장님 포스터 조각(이미지) 안에만 있다. 화면 글자로 손글씨(`.hand`)를 정보에 쓰지 않는다(아래 "문구 규칙"). 굳이 쓴다면 6단어 이하의 짧은 강조뿐이고, 그것도 크림 종이(잉크 `--ink` 또는 빨강 `--red`)나 어두운 띠(흰색) 위에만 — 보케 위에 바로 놓지 않는다.
- **글자**: 제목·간판·버튼·코드 = Do Hyeon(`.disp`, `.plate`, `.outl`, `.mono`), 손글씨 = Nanum Pen Script(`.hand`), 본문 = Pretendard(`--font-sans`). Do Hyeon 과 Nanum Pen Script 는 `src/app/fonts.css` 에서 자체 호스팅한다(`@fontsource/*` 의 한글 한 파일 + 라틴 한 파일) — Google Fonts 를 기다리는 동안 대체 글꼴이 보이거나, 유니코드 조각이 따로 도착해 한 단어 안에서 글꼴이 섞이는 일(막걸 → 막+걸)이 없다. Pretendard 는 layout.tsx 의 CDN 링크(가변 서브셋) 그대로.
- **색 간판**: 섹션 제목과 상태 제목은 글자로 그린 판 `.plate`(`.plate-blue/-red/-green/-yellow/-cream`, 매장색은 `[data-store]` 안에서 `.plate-store`). 검은 테두리 2px, 잉크 그림자, 살짝 기울임. 작은 판은 `.plate-sm`.
- **버튼 규칙**: 버튼은 스티커다 — `.btn`: 노랑, 검은 테두리 2px, 4px 잉크 그림자, 살짝 기울임(`--r`), Do Hyeon 20px, 높이 52px(작은 것 `.btn-sm` 44px), 누르면 그림자 쪽으로 눌린다. **초록(`.btn-naver`)은 가게마다 네이버 "예약하기" 하나뿐**(`placeLinks(store).booking`). 한 화면에 같은 가게의 초록 버튼이 둘 이상 보이면 잘못이다. 그 밖의 모든 행동(쿠폰 받기, 사용하기, 쿠폰 보기, 리뷰 남기기, 쿠폰함 보기, 홈으로, 번호로 시작)은 노란 스티커. 크림 `.btn-secondary` 는 노란 버튼 바로 옆의 보조(확인 시트의 취소)에만. 작은 이동(쿠폰함으로, 리뷰, 길찾기, 로그아웃)은 버튼이 아니라 밑줄 글자 `.link`(44px 터치, 보케 위 `.link-w`). 화면 아래 떠 있는 스티커 `.sticky-cta` 는 판 없이 스티커만 뜨고, 그 아래 내용은 `padding-bottom ≥ 96px` 로 비워 가려지지 않게 한다.
- **도장·꼬리표**: 상태는 빨간(또는 초록 `.stamp-green`) 도장 `.stamp`(사용 완료, 발급 완료, 기간 지남), 꼬리표는 `.tag`(무료, 매장 쿠폰). 배지·칩·아이콘은 없다.
- **플레이스 깔때기**: 이 사이트의 주목적은 네이버 플레이스 방문이다. 주소는 전부 `src/lib/naver.ts` 의 `placeLinks()`·`naverSearchUrl()` 에서만 만든다. 예약하기(초록 하나) 외의 리뷰·길찾기·검색은 밑줄 글자.
- **동선은 1차 → 2차 → 3차**(`store.course.n`, 도쿄스탠드 → 조선칼국수 → 와르르맨숀). 거리·도보는 `src/lib/locations.ts` 값만 쓴다.
- **사장님이 채우는 한 줄 두 가지**(관리자 → 설정): 매장 소식(`Rules.storeNotices`)과 리뷰 이벤트(`Rules.reviewBenefit`). 비우면 그 줄이 사라진다.
- **쿠폰은 카운터에서만 나온다.** 계산할 때 직원이 `/admin/counter` 에 손님 번호를 넣는다. 영수증 사진·자동 인식·등급(VIP)·누적 금액·반려 사유는 손님 화면에 없다.
- **글**: 아래 "문구 규칙"을 따른다 — 정보 문구는 명사구·합니다체. 제목 2~8자, 문단은 390px 에서 두 줄 안. 표어는 `BRAND` 상수에 있는 것만. 이모지·개발 용어·작은 회색 군더더기 금지.
- **터치 44px 이상**, 가로 스크롤 없음(390px 에서 `document.documentElement.scrollWidth === 390`), 첫 화면에 핵심 한 줄과 버튼 하나.

### 문구 규칙 (v9.1 — 사장님 피드백 반영)
기준은 손님이 매일 보는 실제 매장 페이지(네이버 스마트플레이스 매장 정보, 배달의민족 매장 상세, 캐치테이블 매장 페이지)다. 문구 표는 `scratchpad/copy-table.json`, 공용 문구는 `src/lib/copy.ts`·`src/lib/config.ts`(BRAND, REASONS).
- **정보 문구는 합니다체·명사형.** 영업시간·상태·혜택·다음 매장·규칙·주소·안내·오류·FAQ 답은 짧은 명사구("도보 1분", "1일 3장 · 유효기간 30일") 또는 합니다체("쿠폰이 발급됩니다"). 해요체(~요/~어요/~죠)·느낌표·의문형 제목·이모지·"여기서/저기서/이 집/다른 집/가게" 금지 → "매장", "다른 매장".
- **손글씨 금지(정보).** 손글씨(`.hand`, `.hand-w`, `.hand-y`, `.hand-r`)와 찢은 메모로 정보를 쓰지 않는다. 놀이 문구는 포스터 조각(이미지)에만 남는다.
- **사진 설명은 캡션 한 줄.** (v10) 폴라로이드 캡션은 명사구 하나 — 메뉴는 이름·가격, 장소는 "매장 입구"·"1층 홀"(`storePhotos.ts` 의 `cap`).
- **받침 없는 글자 없음.** 보케 위 글자는 어두운 띠 `.info`(#14111a 88%, 크림 Pretendard 15px) 또는 크림 종이 `.paper` 위에만. 노란 글자는 검은 띠(`.marq`)나 `.info` 안에서만. 종이 위 빨강(`--red`)은 Pretendard 작은 글자에 쓰지 않는다(대비 3.9:1) — 잉크색으로. 모든 글자는 뒤에 실제로 있는 색과 4.5:1 이상.
- **고정형**: 영업 상태 칩 `.chip` 4종 — 영업 중 / 영업 전 · 17:00 오픈 / 영업 종료 / 휴무 (뒤에 시간 "15:00~09:00"). 혜택 "다른 매장 쿠폰 제시 시 {품목} 무료". 다음 매장 "다음 매장" / "3차 와르르맨숀 · 도보 1분"(두 줄). 거리 "서면역 6번 출구 도보 N분", "50m 이내". 규칙 "1일 N장 · 유효기간 N일".
- **라벨은 명사**: 섹션 제목(영업시간·주소·전화·메뉴·오시는 길·리뷰·특별 혜택·이용 방법·자주 묻는 질문), 버튼(예약하기·쿠폰함·사용하기·길찾기·로그인·홈·더보기·리뷰 작성·매장 정보). 제목 옆 손글씨 리드(궁금한 것, 다녀온 사람들, ○○의 밤)는 없다. 로딩 중 라벨은 처리 중/확인 중/발급 중.
- **문장은 줄바꿈**: 컬럼을 넘어가는 줄이 없어야 한다(`white-space: nowrap` 은 칩·버튼·간판에만).
- **사실값 유지**: 영업시간·가격·주소·rules 숫자·템플릿 변수는 바꾸지 않는다. 포스터 조각 alt 와 `BRAND.name/eventTag/course/condition/slogan/unionName`, `stores.ts` 의 course.line/benefitLabel/quotes/alt/hoursNote 는 포스터 원문이라 그대로.

토큰·유틸(globals.css): 색 `--yellow --red --blue --green --cream --cream-2 --ink --ink-2 --naver`, 매장색 `[data-store]` → `--store`, 글꼴 `--font-display --font-hand --font-sans`, 그림자 `--shadow-hard --shadow-ink`. 스티커 `.stk .tape .tape-tl .tape-tr`, 종이 `.paper .paper-l .paper-r .scrap .scrap-in .row .kv`, 간판 `.plate .plate-* .plate-sm`, 폴라로이드 `.pola`, 정보 받침 `.info .info-row .star`, 상태 칩 `.chip .chip-on .chip-off`, 버튼 `.btn .btn-naver .btn-secondary .btn-block .btn-sm .btn-r .btn-0 .link .link-d`(`.link-w` 는 보케 위 받침 없는 글자라 더 쓰지 않는다), 도장·꼬리표 `.stamp .stamp-green .tag .tag-free .tag-store`, 검은 띠 `.marq`, 지도 종이 `.map-paper`, 아래 고정 크림 바 `.fixed-col .sticky-bar`, 손글씨 받침 `.note-dark`, 폴라로이드 캡션 `.pola .cap`, 입력 `.field .label .input .help .error`.


## 3. 이미 있는 것 (수정 금지, 사용만)
- `src/app/globals.css` — 토큰과 유틸 클래스(.wrap .btn .btn-store .btn-ghost .btn-block .btn-lg .input .field .label .help .error .paper .dots .row .stamp .rise .eyebrow .lead .small .h1.. .display .mono .serif .rule .rule-thick .sr-only)
- `src/app/layout.tsx`(루트), `src/app/(site)/layout.tsx`(손님 사이트: Header+Footer+TabBar), `src/app/fonts.css`(자체 호스팅 글꼴)
- `src/components/site/Header.tsx`, `Footer.tsx`
- `src/components/site/StoreMap.tsx` (+ StoreMap.css, StoreMap.module.css) — 실제 지도. props: stores(MapStore[]: id,name,shortName,drink,lat,lng,address,naverPlaceId,subway?,directions?,floor?), focusId?, height?, compact?(목록·패널 숨김). 클라이언트 컴포넌트.
- `src/lib/geo.ts` (distanceM, walkMinutes, formatDistance, naverWalkUrl, kakaoMapUrl, googleMapUrl, SEOMYEON_STATION), `src/lib/locations.ts` (LOCATIONS[storeId]: subway, directions, floor, landmarks, parking)
- `src/components/site/Poster.tsx` (PIECES, `<Piece>`, plateOf, benefitOf) — 포스터 조각(키트 우선). `src/components/site/Kit.tsx`(StickerButton·SectionLabel·TabIcon·KitPiece), `StepsStrip.tsx`, `PlaceSheet.tsx`, `PlaceButton.tsx`, `storePhotos.ts`
- `src/lib/config.ts` (BRAND, Rules, REASONS/reasonText, normalizePhone/formatPhone/maskPhone/formatWon)
- `src/lib/stores.ts` (STORES, STORE_BY_ID, getStore, giftStoresFor, naverPlaceUrl) — 데이터는 채워지는 중. 화면은 반드시 이 데이터로 렌더링하고 매장 정보를 하드코딩하지 않는다. 사진은 `store.images[]`(src는 /images/stores/<id>/... , kind: hero/exterior/interior/food/drink/menu).
- `src/lib/db/queries.ts` (회원/영수증/메뉴/쿠폰/관리자/통계), `src/lib/settings.ts`(getRules/saveRules/tierFor), `src/lib/coupons.ts`, `src/lib/receipt/service.ts`(submitReceipt, adminDecideReceipt), `src/lib/auth/session.ts`(getMemberSession/getAdminSession …), `src/lib/auth/password.ts`, `src/lib/http.ts`
- API: `POST /api/auth/login {phone}` `POST /api/auth/logout` `POST /api/receipts (multipart file)` `GET /api/receipts/:id/image?w=480` `POST /api/coupons/issue {receiptId, menuItemId}` `POST /api/coupons/:id/redeem` `GET /api/menu-image/:id` `POST /api/admin/login {id,password}` `POST /api/admin/logout`
- `src/proxy.ts` — 쿠키 없으면 /login 또는 /admin/login 으로 보냄(/verify /wallet /pick /coupons /admin).
공통 파일을 고쳐야 할 이유가 생기면 고치지 말고 보고서에 적는다.

## 4. 구현 규칙
- Next.js 16 App Router, TypeScript strict, `noUncheckedIndexedAccess`. `params`/`searchParams` 는 Promise — `await`. `cookies()` 도 await.
- 스타일은 **CSS Modules**(`X.module.css`) + globals 유틸. 인라인 style 은 동적 값만.
- 서버 컴포넌트 기본. 상호작용이 있는 부분만 `"use client"` 로 작게 분리.
- 사진: `/public` 정적 이미지는 `next/image` (`fill` 또는 width/height 지정, `sizes` 필수). DB 이미지(`/api/...`)는 일반 `<img>`.
- 폼 제출/변경은 API 라우트 fetch 또는 Server Action(관리자). 에러는 사용자 문장으로 표시.
- 접근성: 버튼은 `<button>`, 링크는 `<a>`; 이미지 alt; 폼 label; 키보드 포커스 유지.
- 각자 맡은 파일만 만든다(아래 소유권). 다른 사람의 파일을 만들거나 고치지 않는다.
- 작업 끝에 `npx tsc --noEmit` 이 통과해야 한다. 가능하면 dev 서버를 띄워 화면을 스크린샷으로 확인한다(모바일 390px, 데스크톱 1280px).

## 5. 화면 목록과 요구사항

> 아래는 v1 때 쓴 초기 명세다. **화면 구성·문구·기능 범위는 2절(v9)이 우선한다** — 영수증 사진 인증(/verify, /pick)·VIP 등급·누적 금액은 더 이상 쓰지 않고, 쿠폰은 카운터에서만 나온다. 아래의 "사이드 메뉴"는 모두 "매장 특별 혜택"으로 읽는다. 라우트·API·데이터 흐름 설명은 참고용으로 남겨 둔다.

### 손님 사이트 `(site)` — 소유: A(홈·매장·안내), B(흐름)
A-1 `/` 홈 (`src/app/(site)/page.tsx`) — 실제 매장 사이트처럼 위에서 아래로 정보 순서대로:
 1. **히어로**: 세 매장 외관·내부 실사진 페이드 슬라이드(점 인디케이터, 6초) + `.dim`. 위에 흰 글자로 작은 줄 "서면 2차 연합 · 조선칼국수 × 도쿄스탠드 × 와르르맨숀", 제목(사실 문장) "참여 매장 영수증 인증 시 다른 매장 사이드 메뉴 1개 무료", 한 문단(BRAND.tagline + subwaySummary()), 버튼 [영수증 인증](빨강) [참여 매장 보기](흰 테두리). 표어 금지.
 2. **이용 방법** `#how`: 번호 1~4 + 짧은 설명(합쇼체) 4행 표 또는 가로 4열. "1. 참여 매장에서 결제 2. 영수증 사진 인증(결제 후 N시간 안, 최소 금액, 하루 한도) 3. 다른 매장 사이드 메뉴 선택 4. 매장에서 직원 확인 후 쿠폰 사용". 값은 getRules().
 3. **참여 매장** `#stores`: 매장당 한 블록(사진 1장 사각 + 이름 + 업종/대표 술 + 오늘 영업시간 + 주소 + 서면역 출구·도보(LOCATIONS.subway) + [매장 정보] [네이버 플레이스]). 카드 테두리 없이 선으로 구분.
 4. **무료 사이드 메뉴** `#menu`: 매장별로 `listMenu(id,{giftOnly:true})` 를 표 형태(사진 썸네일 사각·메뉴명·원래 가격 취소선·"무료")로. 사진 없는 항목도 표에 넣는다. 안내 한 줄 "영수증을 받은 매장의 메뉴는 선택할 수 없습니다."
 5. **오시는 길** `#map`: `StoreMap` + 매장별 주소·출구·층·주차 표(`.table`).
 6. **등급 혜택**: 표(등급 / 기준 누적 결제 금액 / 혜택 설명). getRules().tiers.
 7. **고객 리뷰**(선택): 매장별 네이버 방문자 평점(naverRating: 4.52·729건 등 실제 값)과 인용 2개씩을 선·텍스트로만. 큰 따옴표 글리프·카드 금지.
 8. **이용 안내 요약** + 버튼 [이용 안내 전체 보기]. 푸터(공용).
 공지(`rules.notice`)는 헤더 아래 검정 띠에 흰 글자 한 줄.
A-2 `/stores/[id]` 매장 상세 — 상단 실사진(사각, 전체 폭) + 이름·업종·대표 술·오늘 영업시간, 사진 격자 갤러리(사각, 3열)(가로 스크롤 또는 벽돌 배치), 소개(intro), 영업시간 표, 주소·전화·`StoreMap`(compact, 그 매장만) + `LOCATIONS` 의 출구·길 설명·층·주차, 메뉴(DB `listMenu(storeId)`; 무료 사이드 대상은 `isGift` 표시 — “이 메뉴는 다른 매장 영수증으로 무료”), 리뷰 인용 2~3개(`store.quotes` 가 있으면). 상단에 "이 매장 영수증이 있나요? → /verify" / "이 매장에서 쓸 쿠폰이 있나요? → /wallet".
A-3 `/guide` 이용 방법·유의사항 — FAQ 형식(영수증 인정 기간, 인정 안 되는 경우, 쿠폰 유효기간, 직원 확인 방법, 전화번호만으로 로그인하는 이유, 개인정보 처리 한 단락). 값은 `getRules()` 에서 읽어 문장에 넣는다.
A-4 `not-found.tsx`, `error.tsx`(`(site)` 안) — 종이 위에 짧은 문장.

B-1 `/login` — 전화번호만. 큰 입력(`.input.mono`), 자동 하이픈, 숫자 키패드(`inputMode="numeric"`), 안내 "인증번호 없이 번호만으로 시작해요. 쿠폰은 이 번호에 보관됩니다." 성공 시 `?next=` 또는 /verify 로. 이미 로그인 상태면 /wallet 로.
B-2 `/verify` — 영수증 업로드. (1) 카메라/앨범 버튼(`<input type=file accept="image/*" capture="environment">`), 미리보기. (2) 업로드 중: **감열 프린터 연출** — 종이가 위에서 아래로 뽑혀 나오며 "영수증 읽는 중 / 매장 대조 중 / 중복 확인 중" 줄이 한 줄씩 인쇄된다(가짜 진행이 아니라 실제 응답 대기 동안 반복). (3) 결과: `.paper` 위에 읽은 값(매장·일시·금액·승인번호 일부·품목 몇 개)이 인쇄되고, approved 면 `<Stamp text="승인" slam />` 이 찍히며 [무료 사이드 고르러 가기 → /pick/<receiptId>]. review 면 "직원 확인 대기" 도장(회색)과 설명, 쿠폰함에서 확인 안내. rejected 면 사유(reasons[].text)와 다시 찍기 팁(평평하게, 전체가 나오게, 화면 캡처 X). 오류 처리(429, 401 등). 접수 전 안내: 인정 시간(rules.receiptValidHours), 하루 한도, "영수증을 받은 매장에서는 혜택이 없어요".
B-3 `/pick/[receiptId]` — 승인된 영수증으로 메뉴 고르기. 영수증 매장을 제외한 두 매장을 탭/섹션으로, 각 매장의 `listMenu(id,{giftOnly:true})` 를 사진과 함께. 선택 → 확인 시트("도쿄스탠드 · 오이사라다 무료 쿠폰을 받을게요") → `POST /api/coupons/issue` → 성공하면 쿠폰이 "발급되는" 연출(절취선에서 떨어져 나옴) 후 /coupons/<id>. 이미 발급된 영수증이면 해당 쿠폰으로 보냄. 다른 사람 영수증/미승인은 404/안내.
B-4 `/wallet` — 쿠폰함. 상단: 번호(마스킹), 등급과 다음 등급까지 금액(`tierFor`), 누적 방문/금액. 사용 가능 쿠폰(매장 색, 메뉴명, 만료일, 코드), 확인 대기 영수증(review) 목록, 지난 쿠폰(사용/만료)은 접기. 비어 있으면 /verify 로 안내. 로그아웃 버튼(작게).
B-5 `/coupons/[id]` — 쿠폰 상세. 종이 티켓: 매장 색 띠, 메뉴명 크게, 코드(mono 큰 글자), 만료일, "직원에게 이 화면을 보여 주세요". **사용 처리 = 길게 누르기(1.2초)**: 누르는 동안 절취선이 찢어지고 손을 떼면 취소. 완료되면 `POST /api/coupons/:id/redeem` → 화면 전체가 "사용 완료" 상태로 바뀌고 **현재 시각이 초 단위로 흐르는 시계**(스크린샷 재사용 방지)와 사용 시각 표시. 이미 사용/만료/취소된 쿠폰은 그 상태로 표시. 코드 아래 작은 안내: "직원이 관리자 화면에서 코드로도 확인할 수 있어요".

### 관리자 사이트 `/admin` — 소유: C
별도의 사이트처럼 보이게: 손님 사이트의 종이·세리프 대신 **밝은 회색 바탕(#f4f5f6), 잉크색 상단 바, Pretendard, 숫자는 mono, 촘촘한 표**. 실무용. `src/app/admin/layout.tsx` 에 자체 레이아웃(사이드/상단 내비: 대시보드·영수증 확인·쿠폰 조회·회원·메뉴·설정·포스터·직원 계정·로그). 세션은 `getAdminSession()`; 없으면 `/admin/login` 로 redirect. `role==='staff'`(store_id 있음)는 자기 매장 쿠폰 사용 처리·영수증 확인만, 설정/직원/메뉴 편집은 owner 만.
C-1 `/admin/login` (`src/app/admin/login/page.tsx`, 레이아웃 밖으로 보이게 처리) — 아이디/비밀번호 → `POST /api/admin/login`.
C-2 `/admin` 대시보드 — `dashboardStats(new Date())`: 오늘 접수/승인/대기/반려, 오늘 발급/사용, 확인 대기 건수(크게, 링크), 사용 가능 쿠폰, 회원 수, 등급 분포, 매장별 30일(승인 건수·누적 금액·쿠폰 사용), 최근 14일 막대(순수 CSS/SVG).
C-3 `/admin/receipts` — 목록(상태 필터, 매장 필터, 전화 검색, 페이지). 대기 건 우선. `/admin/receipts/[id]` — 원본 사진(`/api/receipts/:id/image`, 확대/회전 버튼), 읽은 값 전체(ocr.raw_text 포함), 사유 코드 설명, 회원(전화·누적), 판정 폼: 매장 선택·금액·결제일시 수정 가능 → 승인/반려 + 메모 → `adminDecideReceipt` (Server Action). 승인되면 회원 쿠폰함에서 메뉴 선택 가능해진다고 안내 문구.
C-4 `/admin/coupons` — 코드 입력 큰 폼(6자리, 자동 대문자) → 조회 결과 카드(매장·메뉴·상태·회원 번호 마스킹) → [사용 처리] (`redeemCoupon({by:{adminId,storeId}})`), 취소(void, owner). 목록(상태·매장 필터, 검색).
C-5 `/admin/members` — 검색(번호), 등급 필터, 표(번호, 등급, 누적 금액, 방문, 최근 로그인). `/admin/members/[id]` — 영수증·쿠폰 이력, 메모, [이 회원에게 쿠폰 발급].
C-6 `/admin/menus` — 매장 탭, 메뉴 표(이름·가격·설명·무료 사이드 여부·노출·순서), 추가/수정/삭제, 사진 업로드(`setMenuImage`, sharp 로 900px 축소 후 저장) — 사진은 `/api/menu-image/:id`. "무료 사이드" 토글이 가장 중요(사장님이 정하지 못한 항목).
C-7 `/admin/settings` — `getRules()` 폼: 인정 시간, 쿠폰 유효일, 최소 금액, 하루 한도, 유사 사진 민감도, 신뢰도, 등급 이름·기준(행 추가/삭제), 이벤트 on/off, 공지. 저장 → `saveRules`. 등급 변경 시 기존 회원 등급 재계산 버튼.
C-8 `/admin/vip` — 등급별/개인 일괄 쿠폰 발급 폼(`issueManualCoupons`): 대상(등급 or 번호), 사용 매장, 메뉴(무료 사이드 목록 or 직접 입력), 유효일, 메모. 발급 건수 결과.
C-9 `/admin/staff` — 직원 계정 목록/추가(아이디, 이름, 매장, 비밀번호)/비활성화/비밀번호 재설정 (owner).
C-10 `/admin/poster` — 매장 선택 → **A4 인쇄용 포스터** 미리보기(`@media print` 로 정확히 A4 한 장): 큰 제목("이 영수증, 옆집에서 한 접시 됩니다" 류), 규칙 3줄, QR 두 개 — 사이트(`SITE_URL/verify?from=<store>`), 네이버 플레이스(`naverPlaceUrl`) — `qrcode` 패키지로 SVG/DataURL 생성, 매장 색. [인쇄] 버튼.
C-11 `/admin/log` — audit_log 최근 200건.
관리자 변경 작업은 `src/app/admin/actions.ts` 의 Server Action 들로 모으고, 모든 액션에서 세션·권한을 다시 확인한다. 변경마다 `audit()` 남긴다.

## 6. 데이터 — 소유: D
`src/lib/stores.ts` 의 STORES 를 조사 자료(`scratchpad/naver/*/info.json`, `images/manifest.json`)로 채우고 사진을 `public/images/stores/<id>/` 로 복사(긴 변 1600px 이하로 축소, JPEG 82). 각 매장 12~18장(hero 1, exterior 2~3, interior 2~3, food/drink 5~8, menu 판 1~2). 메뉴는 현재가 기준으로 전부, 사진 있으면 `image`. `gift` 는 "사이드"로 볼 만한 것(안주 소품·샐러드·전·튀김 등 5,000~12,000원대)만 true 로 제안 — 사장님이 관리자 화면에서 바꿀 수 있음. intro 는 조사된 사실만으로 2~4문장, 광고 말투 금지. quotes(리뷰 인용) 필드는 Store 타입에 `quotes: {text: string; date: string}[]` 로 추가한다(A 가 사용).
