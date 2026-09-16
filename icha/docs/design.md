# 알콜부시기 — 디자인·구현 가이드

이 문서는 화면을 만드는 사람(에이전트 포함)이 반드시 읽고 따르는 계약이다.

## 1. 무엇을 만드는가
서면의 세 술집 — **1차 도쿄스탠드 서면점(맥주) → 2차 조선칼국수와통막걸리 서면밀레오레본점(막걸리) → 3차 와르르맨숀 서면점(소주)** — 의 콜라보 사이트. 세 집은 서로 50m 안에 있다.
규칙: 한 집에서 계산할 때 휴대폰 번호를 말하면 직원이 카운터 화면에 번호를 넣어 쿠폰을 준다. 손님은 50m 안 다른 집에서 메인안주 1개를 주문할 때 그 쿠폰을 보여 주고 그 집 특별 혜택을 받는다. 쿠폰을 받은 매장에서는 쓸 수 없다.

주 사용 환경: **손님이 술집 테이블에서 휴대폰으로** (포스터 QR → 네이버 플레이스 → 소개글 링크 → 이 사이트). 모바일이 기본, 데스크톱은 확장. 직원은 매장 태블릿·휴대폰으로 관리자 화면을 본다.

## 2. 디자인 언어 v7 — "네온 사인" + 플레이스 깔때기

- **이 사이트의 주목적은 네이버 플레이스 방문(10초 이상 체류)이다.** 버튼 하나가 아니라 플레이스로 갈 자연스러운 이유를 여러 개 둔다: **예약하기**(`placeLinks(store).booking`, 홈 매장 카드·매장 화면·플레이스 시트에서 가장 눈에 띄게), 리뷰 쓰기·리뷰 보기, 메뉴 전체 보기, 사진, 길찾기, 저장, 네이버 검색으로 찾기. 주소는 전부 `src/lib/naver.ts` 의 `placeLinks()`·`naverSearchUrl()` 에서만 만든다 — 화면에서 m.place 주소를 직접 쓰지 않는다.
- **동선은 1차 → 2차 → 3차.** 매장 카드 아래 **다음 집** 카드가 다음 순서의 매장으로 이어 주고, 거리·도보는 `src/lib/locations.ts` 값만 쓴다.
- **사장님이 채우는 한 줄 두 가지**(관리자 → 설정): **매장 소식**(매장별 80자, 홈 매장 카드·매장 화면에 한 줄) 과 **리뷰 이벤트**(매장별 40자, 홈 '리뷰 쓰기' 줄과 이용 안내 FAQ). 비우면 그 줄이 사라진다. 값은 `Rules.storeNotices` / `Rules.reviewBenefit`.
- **쿠폰은 카운터에서만 나온다.** 계산할 때 직원이 `/admin/counter` 에 손님 번호를 넣는다(`src/lib/counter.ts`). **영수증 사진 업로드·자동 인식·VIP 등급·누적 금액·반려 사유는 손님 화면에 없다.**
- **분위기는 사장님 포스터(`public/images/event/poster.jpg`)**: 밤거리, 네온, 굵은 붓글씨(Black Han Sans, 노랑 `--yellow`), 매장색 네온(도쿄 파랑 `--tokyo`, 조선 빨강 `--joseon`, 와르르 초록 `--wareureu`). 그 위에 한국 모바일 웹 문법(토스·배민·네이버 주문)을 얹는다: 480px 한 단, 목록 행·카드·큰 버튼·하단 탭.
- **글**: 해요체, 제목 2~8자, 문단은 390px 에서 두 줄 안. 표어·개발 용어·이모지·작은 회색 군더더기 금지 — 표어는 `BRAND` 상수에 있는 것만 쓴다. 관리자 화면만 합쇼체.
- **터치 44px 이상**, 첫 화면에 핵심 한 줄과 버튼.

토큰·유틸(globals.css): 바탕 `--bg #0b0a12`, 카드 `--bg-2`, 글자 `--fg/--fg-2/--fg-3`, 제목 `.h1-event`(노랑 네온) `.h2-event`, 네온 글자 `.neon`(data-store 로 매장색), 네온 테두리 카드 `.card-neon`, 플레이스 버튼 `.btn-naver`(초록) `.btn-sm`, 주요 버튼 `.btn`(노랑), 보조 `.btn-secondary`, 목록 `.row .thumb .body .title .sub .chev`, 칩 `.tag-store .tag-neon .tag-free`, 사진 띠 `.strip`, 고정 버튼 `.sticky-cta`. 그림자·그라데이션 대신 **네온 글로우(text-shadow/box-shadow)만** 강조로 쓴다.


## 3. 이미 있는 것 (수정 금지, 사용만)
- `src/app/globals.css` — 토큰과 유틸 클래스(.wrap .btn .btn-store .btn-ghost .btn-block .btn-lg .input .field .label .help .error .paper .dots .row .stamp .rise .eyebrow .lead .small .h1.. .display .mono .serif .rule .rule-thick .sr-only)
- `src/app/layout.tsx`(루트), `src/app/(site)/layout.tsx`(손님 사이트: Header+Footer+Reveal)
- `src/components/site/Header.tsx`, `Footer.tsx`
- `src/components/site/StoreMap.tsx` (+ StoreMap.css, StoreMap.module.css) — 실제 지도. props: stores(MapStore[]: id,name,shortName,drink,lat,lng,address,naverPlaceId,subway?,directions?,floor?), focusId?, height?, compact?(목록·패널 숨김). 클라이언트 컴포넌트.
- `src/lib/geo.ts` (distanceM, walkMinutes, formatDistance, naverWalkUrl, kakaoMapUrl, googleMapUrl, SEOMYEON_STATION), `src/lib/locations.ts` (LOCATIONS[storeId]: subway, directions, floor, landmarks, parking)
- `src/components/ui/icons.tsx` (MakgeolliIcon BeerIcon SojuIcon DrinkIcon ReceiptIcon StampIcon TicketIcon PinIcon ArrowIcon ClockIcon PhoneIcon CameraIcon), `Stamp.tsx`, `Reveal.tsx`
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

> 아래는 v1 때 쓴 초기 명세다. **화면 구성·문구·기능 범위는 2절(v7)이 우선한다** — 영수증 사진 인증(/verify, /pick)·VIP 등급·누적 금액은 더 이상 쓰지 않고, 쿠폰은 카운터에서만 나온다. 아래의 "사이드 메뉴"는 모두 "매장 특별 혜택"으로 읽는다. 라우트·API·데이터 흐름 설명은 참고용으로 남겨 둔다.

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
