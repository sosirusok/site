# 이차(二次) — 디자인·구현 가이드

이 문서는 화면을 만드는 사람(에이전트 포함)이 반드시 읽고 따르는 계약이다.

## 1. 무엇을 만드는가
서면의 세 술집 — **조선칼국수와통막걸리 서면밀레오레본점(막걸리)**, **도쿄스탠드 서면점(맥주)**, **와르르맨숀 서면점(소주)** — 의 콜라보 사이트.
규칙: *세 곳 중 한 곳에서 결제한 영수증*을 사진으로 인증하면, *나머지 두 곳* 중 한 곳에서 그 집 술 한 잔(막걸리·생맥주·소주)을 고를 수 있고 그 쿠폰이 전화번호 계정의 쿠폰함에 들어간다. 매장에 가서 직원 앞에서 "사용" 처리하면 끝. 영수증을 받은 매장에서는 혜택이 없다(1차는 마음대로, 2차는 우리가). 누적 결제 금액으로 등급(단골/VIP/VVIP)이 오르고, 관리자가 등급별로 쿠폰을 뿌릴 수 있다.

주 사용 환경: **손님이 술집 테이블에서 휴대폰으로** (포스터 QR → 사이트). 모바일이 기본, 데스크톱은 확장. 직원은 매장 태블릿/휴대폰으로 관리자 화면을 본다.

## 2. 디자인 언어 v5 — "매일 쓰는 앱처럼"

의뢰인이 v4(일러스트·종이 바탕·둥근 글꼴)를 "AI 같고 불편하고 구리다"고 했다. v5 는 **휴대폰으로 매일 보는 서비스(토스·배달의민족·네이버 플레이스 상세) 화면의 문법**을 그대로 따른다. 독창성은 화면 구조가 아니라 내용(실제 사진·정확한 정보·짧은 문장)에서 나온다.

- **화면은 항상 폭 480px 한 단.** `src/app/(site)/layout.tsx` 의 `.app` 이 가운데 한 단을 만들고, 헤더·탭·하단 버튼은 `.fixed-col` 로 그 단 안에 고정된다. 데스크톱 전용 레이아웃을 만들지 않는다(바깥은 연회색 바탕).
- **바탕 흰색, 글자 검정(#191f28), 보조 글자 #4e5968, 설명 #8b95a1(13px 이상에서만).** 강조는 한 색(--accent 빨강, '무료' 표시)과 매장색 점(--store) 정도. 파스텔·그라데이션·그림자·굵은 외곽선·종이 질감 금지.
- **글꼴 Pretendard(시스템 느낌).** 제목 22/17px 굵게, 본문 15px, 설명 13px. 장식 글꼴·둥근 글꼴 금지.
- **버튼은 진짜 버튼.** `.btn`(검정 52px, 둥근 12px, 흰 글자) / `.btn-secondary`(연회색) / `.btn-sm`. 그림 버튼(ArtButton) 사용 금지. 주요 동작은 화면 아래 `<StickyCta>`(탭 위 고정) 또는 본문 `.btn-block`.
- **사진이 먼저.** 매장은 실사진(`store.images`)을 크게(둥근 16px, 옆으로 넘기는 `.strip`), 메뉴는 오른쪽 56~72px 정사각 썸네일. 일러스트 자산은 다음에만 쓴다: `logo`(헤더 26px), `coupon-<id>` 티켓(쿠폰함·고르기·쿠폰 상세), `status-*`(영수증 결과), `how-1..3`(순서 아이콘 48~56px), `empty-pocket`(빈 쿠폰함). 카운터 장면·포스터 그림·카드 그림·VIP 카드 프레임·그림 버튼은 손님 화면에서 쓰지 않는다.
- **목록 행(`.row`)과 카드(`.card`)로 짠다.** 정보는 "썸네일 · 제목 · 한 줄 설명 · ›" 행. 섹션 사이는 `.band`(8px 연회색 띠) 로 나눈다. 슬라이드처럼 같은 블록을 반복하지 않되, 목록 행의 반복은 정상이다.
- **글은 짧게.** 제목 2~6자, 설명 한 줄, 문단은 최대 2줄. 표어·감탄·"특별한" 금지, 해요체. 기술 용어(서버·업로드·처리·자동 인식·관리자·시스템·데이터) 금지 — 손님이 쓰는 말만.
- **첫 화면(390×844)** 에 사진·핵심 한 줄·시작 버튼이 보인다. 가로 넘침 금지, 탭 영역 44px 이상.
- 지도는 `StoreMap`(compact, hidePanel). 위치 문구는 `src/lib/locations.ts`. 증정 품목은 `listMenu(id,{giftOnly:true})`.

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

> v1 때 쓴 초기 명세라 화면 구성은 2절(v4)이 우선한다. 아래의 "사이드 메뉴"는 모두 "증정 술 한 잔"으로 읽는다. 문항·API·데이터 흐름은 그대로 유효.

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
