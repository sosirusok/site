# 포스터 키트 — 그림 55장을 파일 이름만 맞춰 넣으면 화면이 바뀌어요

디자이너가 만드는 포스터풍 이미지 55장(+먼저 받은 8장)은 전부 `public/images/kit/` 한 폴더에 들어가요.
코드는 파일 **이름**으로 그림을 찾고, 그 이름의 파일이 있으면 그 그림을, 없으면 지금의 포스터 조각·CSS 를 그대로 써요.
그러니 파일을 넣거나 바꾼 뒤에는 아래 두 명령만 돌리면 돼요. 코드는 안 고쳐도 돼요.

```bash
npm run kit     # public/images/kit/ 를 훑어 src/lib/kit-manifest.json(이름 → 경로·가로·세로)을 다시 만들어요 (+ 앱 아이콘)
npm run build   # 그 목록으로 화면을 다시 만들어요 (개발 중에는 next dev 가 알아서 다시 읽어요)
```

- 크기가 예정과 달라도 그대로 써요(코드가 실제 크기를 읽어요). 다르면 `npm run kit` 이 경고만 해요.
- 그림에 적힌 글자가 아래 표와 다르면 `src/lib/kit.ts` 의 `KIT_ALT` 에서 그 한 줄만 고쳐요(보조기기가 읽는 글자예요).
- 파일을 지우면 다시 지금 화면(포스터 조각·CSS)으로 돌아가요.
- 네온은 어색하지 않은 곳에만: 글자·테두리에 네온 효과는 넣지 않아요. 키트 그림 자체가 네온이면 그대로 붙여요.

## 어디에 뜨나 — 55장

| 파일 | 크기 | 뜨는 곳 | 대신하는 것(없을 때) |
| --- | --- | --- | --- |
| `bg-night.jpg` | 1080×1920 | 모든 손님 화면 바탕(고정, 5px 흐림 + 25% 어둡게) | `/images/poster/bokeh-soft.jpg` (`globals.css .app::before`, 변수 `--kit-bg`) |
| `bg-night-wide.jpg` | 1920×1080 | 가로가 넓은 화면(PC)의 바탕 | `bg-night.jpg` → `bokeh-soft.jpg` (`--kit-bg-wide`) |
| `title.png` | 1400×480 | 맨 위 줄 왼쪽 제목 스티커(26px 높이) | `/images/poster/title-tight.png` |
| `head-banner.jpg` | 1080×420 | 홈 첫 장면(포스터 머리) | `/images/poster/hero-top.png` |
| `footer-line.png` | 1400×100 | 모든 화면 맨 아래 한 줄 | `/images/poster/footer-line.png` |
| `plate-tokyo.png` `plate-joseon.png` `plate-wareureu.png` | 1200×500 | 홈 1·2·3차 간판, 가게 화면 사진 위 간판, 다음 집 메모 모서리, 예약 시트 | `/images/poster/plate-*.png` |
| `benefit-tokyo.png` `benefit-joseon.png` `benefit-wareureu.png` | 1000×300 | 홈 블록의 혜택 조각, 가게 화면 특별 혜택 | `/images/poster/benefit-*.png` |
| `ribbon-event.png` | 1600×260 | 홈 "영수증 릴레이 EVENT" 리본 | `/images/poster/ribbon-event.png` |
| `step-1.png` ~ `step-4.png` | 600×360 | 홈·이용 안내의 순서 네 칸(2×2, 높이 66px) | `/images/poster/step-*.png` |
| `pill-condition.png` | 1200×140 | 홈 조건 알약 | `/images/poster/pill-condition.png` |
| `label-benefit.png` | 700×200 | 가게 화면 "특별 혜택" 제목 | CSS 빨간 판 `.plate.plate-red` |
| `label-menu.png` | 700×200 | 가게 화면 "메뉴" 제목 | CSS 노란 판 |
| `label-map.png` | 700×200 | 홈·가게 화면 "오시는 길" 제목 | CSS 파란 판 |
| `label-review.png` | 700×200 | 가게 화면 "리뷰" 제목 | CSS 초록 판 |
| `label-howto.png` | 700×200 | 이용 안내 "순서" 제목 | CSS 파란 판 |
| `label-faq.png` | 700×200 | 이용 안내 "자주 묻는 질문" 제목 | CSS 초록 판 |
| `label-wallet.png` | 700×200 | 쿠폰함 제목(`<SectionLabel kind="wallet">`) | CSS 판 |
| `label-guide.png` | 700×200 | 이용 안내 큰 제목(h1, 60px) | CSS 빨간 판(30px) |
| `btn-book.png` | 900×220 | 초록 [예약하기] — 홈 블록마다 하나, 가게 화면 아래 고정(가득), 예약 시트, 이용 안내 답. 초록은 이것뿐 | CSS `.btn.btn-naver` |
| `btn-wallet.png` | 900×220 | 홈 [내 쿠폰함 열기] | CSS 노란 `.btn` |
| `btn-use.png` `btn-pick.png` `btn-get.png` | 900×220 | 쿠폰함·혜택 고르기·쿠폰 받기 흐름(`<StickerButton kind="use|pick|get">`) | CSS 노란 `.btn` |
| `btn-search.png` | 900×220 | 홈 오시는 길 [네이버에서 검색] | CSS 노란 `.btn` |
| `btn-review.png` | 900×220 | 리뷰 쓰기(`<StickerButton kind="review">`) | CSS 노란 `.btn` |
| `btn-login.png` | 420×150 | 맨 위 줄 오른쪽 [로그인](36px) | CSS 크림 꼬리표 |
| `btn-close.png` | 420×150 | 예약 시트 [닫기] | CSS 크림 `.btn.btn-secondary` |
| `btn-directions.png` | 420×150 | 길찾기(`<StickerButton kind="directions">`) | CSS `.btn` |
| `icon-home.png` `icon-wallet.png` `icon-place.png` `icon-info.png` | 240×240 | 하단 탭 아이콘 4개(24px) | 인라인 SVG 선 아이콘 |
| `note-good.png` | 520×600 | 포스터 메모 "좋은 술, 좋은 음식, 좋은 사람." (`<Piece name="note-good">`) | `/images/poster/note-good.png` |
| `note-again.png` | 700×360 | 홈 1차 간판 옆, 이용 안내 오른쪽 위 | `/images/poster/note-again.png` |
| `note-today.png` | 800×360 | 홈 2차 간판 옆, 홈 지도 모서리 | `/images/poster/note-today.png` |
| `note-phone.png` | 900×420 | 홈 "계산할 때 휴대폰 번호를 말하면 쿠폰이 들어와요" 메모 | CSS 찢은 종이 + 손글씨 |
| `arrow.png` | 600×300 | 순서 칸 사이 화살표(26×13px) | CSS 빨간 SVG 화살표 (`--kit-arrow`) |
| `tape.png` | 400×120 | 스티커·지도 모서리 테이프(68×20px) | CSS 반투명 크림 띠 (`--kit-tape`) |
| `stamp-free.png` | 500×500 | 가게 화면 혜택 값 옆 "무료" 도장(52px) | CSS 빨간 테두리 도장 `.stamp` |
| `stamp-used.png` | 500×500 | 쿠폰함 사용 완료 도장(`<KitPiece name="stamp-used">`) | CSS `.stamp` |
| `cut-beer.png` | 700×1000 | 홈 1차 손글씨 옆 맥주잔, 도쿄스탠드 혜택 옆 | `/images/poster/mug.png` (홈), 가게 화면은 DB 품목 PNG |
| `cut-makgeolli.png` | 900×800 | 홈 2차 손글씨 옆, 조선칼국수 혜택 옆 | 없음(키트가 와야 보여요) |
| `cut-soju.png` | 700×1000 | 홈 3차 손글씨 옆 | 없음 |
| `cut-yogurt.png` | 700×800 | 와르르맨숀 혜택 옆 | 없음 |
| `ticket.png` | 1400×600 | 쿠폰 티켓 바탕(쿠폰함·쿠폰 화면) | 먼저 받은 `ticket-<가게>.png` → CSS 종이 티켓 |
| `empty-wallet.png` | 700×700 | 빈 쿠폰함 | 먼저 받은 360×360 |
| `notfound.png` | 700×700 | 없는 주소 화면 | 먼저 받은 360×360 |
| `share.jpg` | 1200×630 | 카톡·인스타 공유 그림(OG) | 먼저 받은 것 |

## 먼저 받은 8장(지금 들어 있어요)

| 파일 | 크기 | 뜨는 곳 |
| --- | --- | --- |
| `ticket-tokyo.png` `ticket-joseon.png` `ticket-wareureu.png` | 880×290 | 쿠폰 티켓(가게 색 네온 테두리, 왼쪽 75% 에 살아 있는 글자) |
| `empty-wallet.png` | 360×360 | 빈 쿠폰함(영수증 꽂이) |
| `notfound.png` | 360×360 | 없는 주소(쓰러진 소주잔) |
| `icon.png` | 512×512 | 앱 아이콘·파비콘(`npm run kit` 이 `src/app/icon.png`, `apple-icon.png` 로 줄여 넣어요) |
| `sign-wareureu.png` | 440×100 | 와르르맨숀 민트 네온 장식 선 — 홈 3차 블록 아래, 와르르맨숀 가게 화면 간판 아래(가운데 60%, 장식). 이 두 곳뿐 |
| `share.jpg` | 1200×630 | 공유 그림(OG) |

## 코드가 그림을 찾는 자리

- `src/lib/kit-manifest.json` — `npm run kit` 이 만드는 목록. 손으로 고치지 않아요.
- `src/lib/kit.ts` — `kitPiece(이름)` → `{ src, w, h } | null`, `KIT_ALT`(그림 글자), `kitCssVars()`(바탕·테이프·화살표 변수).
- `src/components/site/Poster.tsx` — `<Piece name>` 은 키트 우선(`hero-top`→`head-banner`, `mug`→`cut-beer`, 나머지는 같은 이름), `pieceSrc(name)` 로 경로만 얻어요.
- `src/components/site/Kit.tsx` — `<StickerButton kind>`, `<SectionLabel kind>`, `<TabIcon kind>`, `<KitPiece name fallback>`, `<KitDivider name>`.
- `src/app/globals.css` — `--kit-bg`, `--kit-bg-wide`, `--kit-tape`, `--kit-arrow` 변수를 읽어요. 키트 그림(투명 PNG)의 그림자는 `drop-shadow` 로 모양을 따라가요.
- 그림에 그림자가 이미 들어 있으면 `Kit.module.css` 의 `--kit-btn-shadow`, `--kit-label-shadow` 를 `none` 으로 바꿔요.
