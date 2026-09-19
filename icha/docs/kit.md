# 포스터 키트 v10 — 그림 61장, 파일 이름만 맞춰 넣으면 화면이 바뀌어요

디자이너가 만든 포스터풍 이미지 61장(주문서 55장 + 추가 6장)과 먼저 받은 네온 티켓·아이콘은 전부 `public/images/kit/` 한 폴더에 들어가요.
코드는 파일 **이름**으로 그림을 찾고, 그 이름의 파일이 있으면 그 그림을, 없으면 지금의 포스터 조각·CSS 를 그대로 써요.
파일을 넣거나 바꾼 뒤에는 아래 두 명령만 돌리면 돼요. 코드는 안 고쳐도 돼요.

```bash
npm run kit     # public/images/kit/ 를 훑어 src/lib/kit-manifest.json(이름 → 경로·가로·세로)을 다시 만들어요 (+ 앱 아이콘, + 바탕·테이프·화살표의 WebP 판 public/images/bg/ → src/lib/kit-variants.json)
npm run build   # 그 목록으로 화면을 다시 만들어요 (개발 중에는 next dev 가 알아서 다시 읽어요; prebuild 가 kit 을 먼저 돌려요)
```

- 크기가 예정과 달라도 그대로 써요(코드가 실제 크기를 읽어요). 다르면 `npm run kit` 이 경고만 해요.
- 그림에 적힌 글자가 아래 표와 다르면 `src/lib/kit.ts` 의 `KIT_ALT` 에서 그 한 줄만 고쳐요(보조기기가 읽는 글자 = 그림에 적힌 글자예요).
- 파일을 지우면 다시 지금 화면(포스터 조각·CSS)으로 돌아가요.
- CSS 배경으로 쓰는 넉 장(`bg-night`·`bg-night-wide`·`tape`·`arrow`)은 `scripts/kit-variants.mjs` 가 가벼운 WebP 판(`public/images/bg/`)을 만들어 `image-set()` 으로 먼저 쓰고, 원본은 그대로 대체용으로 남아요(휴대폰 바탕 786KB → 84KB). 원본을 바꾸면 `npm run kit` 을 다시 돌려요.

## v10 규칙 — 디자이너 README 그대로

1. **키트 그림에는 그림자·외곽선이 이미 그려져 있어요.** 그 위에 CSS 그림자·테두리·둥근 모서리를 겹치지 않아요(`.stk.stk-kit`, `.kbtn`, `.klabel` 은 `filter: none; box-shadow: none; border: 0; border-radius: 0`). CSS 스티커 그림자(`.stk`, `.btn`, `.plate`)는 키트가 **없을 때**의 대체 그리기에만 남아 있어요. 눌린 그림 버튼은 `translateY(2px) + brightness(.96)` 뿐이에요.
2. 투명 PNG 는 투명하게 둬요. 간판·사진 조각을 `object-fit: cover` 로 자르지 않아요(폭이나 높이 하나만 정하고 비율대로).
3. 그림 안 글자와 CSS 글자를 겹쳐 쓰지 않아요. 대신 링크/버튼의 읽히는 이름은 그림에 적힌 글자(`KIT_ALT`)를 `sr-only` 로 둬요. 같은 버튼이 여럿이면 " — 도쿄스탠드" 꼬리(`suffix`)만 덧붙여요.
4. `tape.png` 는 알파가 약해(≈247/255) `opacity: .85` 로 붙여요(`--kit-tape-opacity`).
5. `bg-night.jpg`·`bg-night-wide.jpg` 는 이미 1.15배 확대본이라 `cover` 이상 키우지 않고 흐리지도 않아요. 위에 어두운 한 겹 `rgba(12,8,20,.50)` 만(크림 종이가 앞으로 나오고 골목 불빛은 남는 값).
6. 흰 손글씨 메모(`note-again`·`note-today`)는 키트에서 유일하게 그림자가 구워져 있지 않은 글씨(디자이너: 검정 배경만 뺐어요)라 보케 위에서는 `.note-dark` 로 읽히게 해요 — 받침 상자(직사각형)가 아니라 ① 획마다 검은 테두리 그림자(`drop-shadow` 셋) ② 글자 상자보다 사방 26/40px 큰 타원 어둠(`::before`, 가운데 66% → 가장자리 0%). z-index −1 이라 이웃 제목판·폴라로이드를 물들이지 않아요.
7. 조각을 나란히 견줄 때는 캔버스가 아니라 **보이는 몸통**으로 크기를 맞춰요(알파 상자: `scratchpad/kitview/bbox.json`). `plate-joseon.png` 는 불투명 간판이 캔버스의 70%(x 15~85%) 라 다른 두 간판(95%)과 같은 폭이면 27% 작아 보여요 → 홈·매장 화면 112%(양옆 −6%), 예약 시트 112%, 고르기 72%(230 → 258), 다음 매장 94px. 보이는 간판이 도쿄 341×130 ↔ 조선 282×162 로 같은 넓이(47k ↔ 46k)예요. 넘치는 건 투명 여백뿐이라 화면 밖 판정(`geo-check`)도 알파 몸통으로 해요.
8. 매장 화면의 사진은 **가게 간판을 자르지 않아요**: `HERO_POS` 는 도쿄·조선 `50% 0%`(간판이 맨 위 줄), 상자는 68vw(4:3 사진의 위 91%). 종이 메모 `note-good` 은 간판 띠 아래에 두고(테이프 모서리까지 잰 값, `StoreHero.module.css`), 간판(플레이트)은 사진 아래 32px 만 덮어요.

## 크기 표 — 390px 화면(단 358px) 기준. 430px 은 단 394px

| 그림 | 원본 | 화면 크기 | 어디에 |
| --- | --- | --- | --- |
| `bg-night.jpg` / `bg-night-wide.jpg` | 1080×1920 / 1920×1080 | 화면 전체 고정, cover, 위에 50% 어두운 겹 | 모든 손님 화면 바탕(`--kit-bg`, `--kit-bg-wide`). 가로 화면은 wide |
| `title.png` | 1400×480 | 높이 42px(122px 폭) — 줄에서 가장 커요 | 맨 위 줄 왼쪽 제목(홈은 150px 내려가면 나타남). 검은 붓자국이 그림 안에 있어 받침 없이 읽혀요 |
| `head-banner.jpg` | 1080×420 | 화면 폭 그대로(390×152), 자르지 않음, 덮지 않음 | 홈 첫 장면 |
| `plate-*.png` | 1200×500 | 홈·매장 화면 한 단 가득(358×149) · 예약 시트 ≤200px · 고르기 종이 230px · 다음 매장 84px. `plate-joseon` 은 각각 112% / 112% / 72%(258) / 94px(규칙 7) | 간판 |
| `benefit-*.png` | 1000×300 | 폭 ≤300(90px 높이). 옆 컷아웃 때문에 390 화면에선 맥주·소주 옆 283, 주전자(76px) 옆 274 — 세 상자가 3% 안. 430 화면은 셋 다 300 | 홈 블록·매장 화면 특별 혜택 |
| `cut-beer.png` / `cut-soju.png` | 700×1000 | 높이 96px · 품목 줄 64px | 혜택 상자 옆(홈 1차·도쿄스탠드 화면 / 홈 3차). 와르르맨숀 화면의 혜택 품목 '소주 1병'(사진 없음)은 사진 자리 64px 에 `cut-soju` — 사진 있는 줄과 글자 시작점이 같아요 |
| `cut-makgeolli.png` | 900×800 | 폭 76px | 혜택 상자 옆(홈 2차·조선칼국수 화면). 조선칼국수 혜택 품목에 사진이 없으면 사진 자리(64px 높이)에도 |
| `cut-yogurt.png` | 700×800 | 높이 84px · 포켓 96px 폭(−4°) | 와르르맨숀 화면 혜택 옆, 홈 3차 사진 포켓 |
| `label-*.png`(11장) | 700×200 | 높이 46px(161px 폭), 큰 제목 60px(210px 폭) | 섹션 제목. 큰 제목: `label-guide`(이용 안내), `label-phone`(로그인), `label-wallet`(쿠폰함) |
| `ribbon-event.png` | 1600×260 | 한 단 가득(358×58) | 홈 영수증 릴레이 EVENT |
| `step-1~4.png` | 600×360 | 2×2, 칸 폭 (단−44)/2 → 157px(94px 높이), 줄 사이 28px | 홈·이용 안내 순서. 1→2, 3→4 사이 틈에 화살표, 2→3 은 격자 한가운데에서 135° 꺾인 화살표(40×20) |
| `arrow.png` | 600×300 | 44×22 · 꺾인 것 40×20 | 순서 틈(`--kit-arrow`), 다음 매장 줄 오른쪽 |
| `pill-condition.png` | 1200×140 | 폭 300 가운데 | 홈 조건 알약 |
| `btn-*.png`(900×220, 13장) | 900×220 | 기본 52px(213px 폭) · 작은 것 44px(180px) · 한 줄 가득 64px(262px, 크림 바 가운데; 폭으로 늘리지 않음) | 스티커 버튼 |
| `btn-login.png` `btn-close.png` `btn-directions.png` | 420×150 | 높이 40px(112px 폭), 누르는 상자 44px. 맨 위 줄의 로그인만 36px(101px) — 제목(42px)보다 작게. 로그인 화면에서는 안 보여요 | 꼬리표 |
| `icon-*.png` | 240×240 | 24px | 하단 탭 |
| `note-good.png` | 520×600 | 폭 130px | 매장 화면 사진 오른쪽(사진 위라 받침 없음, 위 모서리 테이프). 가게 간판 띠 아래: 도쿄 top 13vw+13px·right −4px, 조선 top 16.5vw+14px, 와르르 top 12px(규칙 8) |
| `note-phone.png` | 900×420 | 폭 300px | 홈 이벤트 안내 |
| `note-again.png` | 700×360 | 폭 136px(홈 1차 사진 포켓) · 140px(이용 안내 오른쪽 위) | 흰 손글씨 → `.note-dark`(획 그림자 + 타원 어둠, 규칙 6) |
| `note-today.png` | 800×360 | 폭 136px(홈 2차 사진 포켓) · 140px(로그인 오른쪽 위) | 흰 손글씨 → `.note-dark` |
| `tape.png` | 400×120 | 68×20, opacity .85 | 사진 메모 위 모서리, 지도 종이 모서리(`--kit-tape`) |
| `stamp-free.png` | 500×500 | 56px, −12° · 고르기 줄 44px | 매장 화면 혜택 값 줄 오른쪽 끝, 사용 매장 선택의 품목 줄(같은 '무료'는 같은 도장) |
| `stamp-used.png` | 500×500 | 96px, −12° | 쿠폰 화면·쿠폰함의 사용한 쿠폰 반쪽 위. 사용 시각은 티켓의 조건 줄 자리에 글자로("9월 17일 08:58 사용") — 도장은 하나 |
| `ticket.png` | 1400×600 | 한 단 가득(358×153) | 쿠폰 바탕. 글자는 왼쪽 5~71%·위아래 8%(236×129, 가운데 정렬, 줄은 max-content 라 눌려 잘리지 않아요: 매장 판 29 + 이름 20px + 코드 24px + 조건 12.5px 한 줄 = 110), 반쪽(사진 또는 세로 글자)은 76~96% — 절취선이 73.4% 에 있어요 |
| `empty-wallet.png` | 700×700 | 폭 160px | 빈 쿠폰함(봉투) |
| `notfound.png` | 700×700 | 폭 150px | 없는 주소·오류 화면(쓰러진 소주잔) |
| `footer-line.png` | 1400×100 | 한 단 가득(358×26) | 모든 화면 맨 아래 어두운 띠 안(흰 글자라 띠 위에) |
| `share.jpg` | 1200×630 | — | 카톡·인스타 공유 그림(OG) |

## 버튼·제목판 매핑(그림 글자 = 읽히는 이름)

| 그림 | 글자 | 뜨는 곳 |
| --- | --- | --- |
| `btn-book` | 예약하기 | 홈 블록마다 하나(52px), 매장 화면 아래 크림 바(64px), 예약 시트·이용 안내 답·고르기 종이(44px), 쿠폰 화면(44px). **초록은 이것뿐, 가게마다 하나** |
| `btn-wallet` | 쿠폰함 열기 | 홈 이벤트 안내 옆, 발급 완료·만료 화면(64px) |
| `btn-use` | 직원 앞에서 사용하기 | 쿠폰 화면 아래 크림 바(64px), 확인 시트(52px) |
| `btn-pick` | 어디서 쓸지 고르기 | 쿠폰함의 받은 쿠폰(44px) |
| `btn-get` | 이 쿠폰 받기 | 사용 매장 선택 아래 크림 바(64px) |
| `btn-search` | 네이버에서 검색 | 홈 오시는 길 |
| `btn-review` | 네이버 리뷰 남기기 | 매장 화면 리뷰(44px), 사용 완료 화면(64px) |
| `btn-login` | 로그인 | 맨 위 줄 오른쪽(36px, 로그인 화면에선 없음), 로그인 화면 보내기(64px) |
| `btn-close` | 닫기 | 예약 시트 |
| `btn-directions` | 길찾기 | 홈 주소 종이, 매장 화면 오시는 길, 예약 시트 |
| `btn-details` | 사진·메뉴 더 보기 | 홈 블록(44px) |
| `btn-morephoto` | 사진 더 보기 | 매장 화면 사진 아래(44px) |
| `btn-moremenu` | 메뉴 전체 보기 | 매장 화면 메뉴판 아래(44px) |
| `label-benefit` 특별 혜택 · `label-menu` 메뉴 · `label-map` 오시는 길 · `label-review` 리뷰 · `label-photo` 사진 | | 매장 화면 섹션 제목(홈 오시는 길도 `label-map`) |
| `label-howto` 이렇게 받아요 · `label-faq` 자주 묻는 질문 · `label-guide` 이용 안내(60px) | | 이용 안내 |
| `label-wallet` 쿠폰함(60px) · `label-phone` 번호로 시작(60px) · `label-place` 어디부터 갈까요? | | 쿠폰함 제목 · 로그인 제목 · 예약 시트 제목 |

키트에 없는 말(메뉴 더보기, 취소, 홈, 매장 정보)은 CSS 크림·노란 스티커(`.btn`) 그대로예요. 상태 제목(사용된 쿠폰, 사용 매장 선택, 받은 쿠폰 …)은 CSS 판(`.plate`)이에요.

## 아래 고정 크림 바 — `.fixed-col.sticky-bar`

매장 화면(예약하기), 사용 매장 선택(이 쿠폰 받기), 쿠폰 화면(직원 앞에서 사용하기)은 화면 아래 탭 바 바로 위에 **불투명 크림 바**(#F4E9D2, 위 검은 선 1px, 위아래 8px)를 두고 그 안에 64px 그림 버튼 하나를 가운데 둬요. 바 높이 `--stickybar-h`(80px) + 탭 바 60px = 140px. 본문은 `.app:has(.sticky-bar)` 가 그만큼(+16px) 아래를 비워서 무엇도 가려지지 않아요. 오류 줄이 있으면 바가 위로 자라요.

## 먼저 받은 것(지금도 들어 있어요)

| 파일 | 크기 | 뜨는 곳 |
| --- | --- | --- |
| `ticket-tokyo.png` `ticket-joseon.png` `ticket-wareureu.png` | 880×290 | `ticket.png` 가 없을 때의 쿠폰(가게 색 네온 테두리) |
| `icon.png` | 512×512 | 앱 아이콘·파비콘(`npm run kit` 이 `src/app/icon.png`, `apple-icon.png` 로 줄여 넣어요) |
| `sign-wareureu.png` | 440×100 | (지금 폴더에 없음) 있으면 와르르맨숀 장식 선 |

## 코드가 그림을 찾는 자리

- `src/lib/kit-manifest.json` — `npm run kit` 이 만드는 목록. 손으로 고치지 않아요.
- `src/lib/kit.ts` — `kitPiece(이름)` → `{ src, w, h } | null`, `KIT_ALT`(그림 글자), `kitCssVars()`(바탕·테이프·화살표 변수).
- `src/components/site/Poster.tsx` — `<Piece name>` 은 키트 우선(`hero-top`→`head-banner`, `mug`→`cut-beer`, 나머지는 같은 이름).
- `src/components/site/Kit.tsx` — `<StickerButton kind suffix srText>`, `<SectionLabel kind big>`, `<TabIcon kind>`, `<KitPiece name bare fallback>`, `<KitDivider name>`. 크기는 `Kit.module.css`(버튼 52/44/64/40, 제목판 46/60).
- `src/components/site/storePhotos.ts` — 폴라로이드 사진·4:3 창 위치·캡션(홈 3장, 매장 화면 5장), `HERO_POS`, `capParts`(캡션은 값 앞에서만 둘째 줄로 접혀요: 실제 글꼴로 잰 가장 긴 캡션 227px > 홈 큰 카드 198px).
- `src/app/globals.css` — `--kit-bg`, `--kit-bg-wide`, `--kit-tape`, `--kit-tape-opacity`, `--kit-arrow`; `.stk-kit`, `.note-dark`, `.sticky-bar`, `.pola .cap`.
- 검수: `scratchpad/pw/geo-check.mjs`(가로 스크롤·이미지 비율·44px·대비·겹침·고정 바 덮임)를 390·430 두 폭으로 돌려요.
