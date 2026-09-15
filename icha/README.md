# 이차(二次) — 서면 2차 연합

조선칼국수와통막걸리 서면밀레오레본점(막걸리) · 도쿄스탠드 서면점(맥주) · 와르르맨숀 서면점(소주).
**세 곳 중 한 곳의 영수증을 사진으로 인증하면, 나머지 두 곳에서 사이드 메뉴 한 가지가 무료.**

| 사이트 | 주소 | 누가 |
|---|---|---|
| 손님 사이트 | `/` | 손님(휴대폰). 전화번호만으로 시작 → 영수증 인증 → 메뉴 선택 → 쿠폰함 → 매장에서 사용 |
| 관리자 사이트 | `/admin` | 사장님·직원. 영수증 확인, 쿠폰 코드 조회/사용 처리, 회원·등급, 메뉴(무료 사이드 지정), 규칙 설정, 포스터 인쇄 |

## 어떻게 동작하나

1. 손님이 포스터 QR 로 사이트에 들어와 **휴대폰 번호**만 입력한다(인증번호 없음 — 사장님 결정). 번호가 곧 계정이다.
2. **영수증 사진**을 올리면 서버가 (1) 사진을 표준화하고 (2) 같은 사진·비슷한 사진·같은 승인번호를 조회한 뒤 (3) Claude 비전으로 상호·사업자번호·결제 일시·금액·승인번호를 읽고 (4) 규칙에 따라 **승인 / 직원 확인 / 반려**를 판정한다. 규칙은 `src/lib/receipt/rules.ts`(순수 함수, 테스트 있음), 매장 매칭은 `match.ts`, 인식은 `ocr.ts`.
3. 승인되면 손님이 **영수증을 받은 매장을 제외한** 두 매장의 무료 사이드 목록에서 하나를 고르고, 쿠폰(6자리 코드)이 쿠폰함에 들어간다. 승인된 결제 금액은 누적되어 등급(단골/VIP/VVIP)이 오른다.
4. 매장에서 손님이 쿠폰 화면을 보여 주고 **직원 앞에서 길게 눌러 사용 처리**한다(사용 완료 화면에 현재 시각이 초 단위로 흘러 스크린샷 재사용을 막는다). 직원은 관리자 화면에서 코드로도 조회·사용 처리할 수 있다.
5. "직원 확인"으로 떨어진 영수증(흐림, 상호 미판독, 자동 인식 불가 등)은 관리자 화면에서 사진을 보고 승인/반려한다. 승인하면 손님 쿠폰함에서 메뉴를 고를 수 있다.

### 부정 사용 방지 (영수증)
- 같은 사진 재업로드: SHA-256 일치 → 반려
- 같은 영수증을 다시 찍어 올림: 승인번호 일치 → 반려, 매장·결제시각·금액 일치 → 반려
- 남이 보내 준 사진(크롭·재압축): dHash 유사도 → 직원 확인
- 화면을 다시 찍은 사진, 재출력 표시, 주문서(빌지): 반려 또는 직원 확인
- 다른 가게 영수증: 상호·사업자번호·전화·주소로 매칭 실패 → 반려
- 오래된 영수증: 결제 후 N시간(기본 24) 초과 → 반려
- 소액: 최소 결제 금액(기본 10,000원) 미만 → 반려
- 하루 한도(기본 3건), 업로드 속도 제한
- 영수증을 받은 매장에서는 쿠폰을 쓸 수 없음(서버에서 강제)
모든 임계값은 관리자 → 설정에서 바꿀 수 있다.

## 실행

```bash
npm install
cp .env.example .env.local   # 값 채우기 (아래 참고)
npm run dev                   # http://localhost:3000 , 관리자 http://localhost:3000/admin
```
- `DATABASE_URL` 이 비어 있으면 로컬 파일 DB(PGlite, `./.data/pg`)로 돌아간다. 설치할 것이 없다.
- `ANTHROPIC_API_KEY` 가 비어 있으면 자동 인식이 꺼지고 모든 영수증이 "직원 확인"으로 들어간다(사이트는 정상 동작).
- 첫 기동 때 스키마·매장·메뉴·초기 관리자(`ADMIN_INITIAL_ID`/`ADMIN_INITIAL_PASSWORD`)가 자동으로 만들어진다.

```bash
npm run typecheck   # 타입 검사
npm test            # 판정 규칙 단위 테스트
npx tsx scripts/smoke.ts                       # DB 계층 스모크 테스트(메모리)
npx tsx scripts/create-admin.ts 아이디 비밀번호 이름 [joseon|tokyo|wareureu]   # 직원 계정
npx tsx scripts/export-schema.ts               # supabase/schema.sql 갱신
```

## 배포 (Vercel + Supabase, 30분)

1. **Supabase** 프로젝트 생성(Region: Northeast Asia/Seoul) → Project Settings → Database → *Connection string* 의 **Transaction pooler**(포트 6543) 주소를 복사. 비밀번호를 넣어 `DATABASE_URL` 로 쓴다. 스키마는 앱이 첫 요청에서 자동 생성한다(미리 만들려면 SQL Editor 에서 `supabase/schema.sql` 실행).
2. **Anthropic** 콘솔에서 API 키 발급 → `ANTHROPIC_API_KEY`. 모델은 기본 `claude-opus-5`(가장 정확). 비용을 줄이려면 `RECEIPT_MODEL=claude-sonnet-5`.
3. **Vercel** → New Project → 이 저장소 → Framework: Next.js. Environment Variables 에 `.env.example` 의 값을 모두 넣는다. `SESSION_SECRET` 은 `openssl rand -base64 48`. `NEXT_PUBLIC_SITE_URL` 은 실제 도메인(포스터 QR 에 들어간다). Deploy.
4. 배포 후 `/admin/login` 에 `ADMIN_INITIAL_ID`/`ADMIN_INITIAL_PASSWORD` 로 들어가 **비밀번호부터 바꾸고**, 매장별 직원 계정을 만든다.
5. 관리자 → 메뉴에서 **무료 사이드로 줄 메뉴**를 확정(토글)하고 사진을 올린다. 설정에서 인정 시간·최소 금액·쿠폰 유효일을 정한다.
6. 관리자 → 포스터에서 매장별 A4 포스터를 인쇄해 붙인다(QR 두 개: 사이트, 네이버 플레이스).

관리자 사이트를 별도 도메인(예: `staff.도메인`)으로 쓰고 싶으면 Vercel 에 도메인을 추가하고 `src/proxy.ts` 에서 호스트가 그 도메인이면 `/admin` 으로 rewrite 하면 된다.

## 새 저장소로 옮기기

이 프로젝트는 `sosirusok/site` 저장소의 `icha/` 폴더에 들어 있다. 별도 저장소(예: `sosirusok/icha`)로 옮기려면:

```bash
# 1) GitHub 에서 빈 저장소 icha 를 만든다 (README 없이)
# 2) 이 저장소에서 icha/ 폴더만 떼어 낸 브랜치를 만들고 밀어 넣는다
git fetch origin claude/restaurant-info-site-kwnkyh
git checkout claude/restaurant-info-site-kwnkyh
git subtree split --prefix=icha -b icha-main
git push https://github.com/sosirusok/icha.git icha-main:main
```
Vercel 은 새 저장소를 그대로 연결하면 된다(Root Directory 기본값).

## 구조

```
src/app/(site)/        손님 사이트 (홈, 매장, 로그인, 인증, 선택, 쿠폰함, 쿠폰, 안내)
src/app/admin/         관리자 사이트
src/app/api/           API (로그인, 영수증 업로드, 쿠폰 발급/사용, 이미지)
src/lib/config.ts      브랜드 문구, 기본 규칙, 사유 코드
src/lib/stores.ts      매장 마스터 데이터(네이버 플레이스 기준) + 메뉴 시드 + 사진 목록
src/lib/db/            드라이버(pg/PGlite), 스키마, 쿼리
src/lib/receipt/       image(표준화·해시) → ocr(Claude) → match(매장) → rules(판정) → service(저장)
src/lib/coupons.ts     쿠폰 발급/사용/취소/일괄 발급
src/lib/settings.ts    운영 규칙(관리자 설정) / 등급 계산
src/proxy.ts           로그인 필요 화면 보호
public/images/stores/  매장 사진(각 매장 네이버 플레이스·제공 사진)
docs/design.md         디자인·구현 가이드
supabase/schema.sql    스키마(참고용)
```

## 알아 둘 것
- 전화번호만으로 로그인하므로 남의 번호를 아는 사람이 그 쿠폰함을 볼 수 있다. 쿠폰은 매장에서 직원 앞에서만 쓸 수 있어 실제 피해는 제한적이지만, 필요하면 SMS 인증(알리고·솔라피 등)을 `/api/auth/login` 앞에 붙이면 된다.
- 영수증 사진은 DB 에 저장된다(분쟁·재확인용). 관리자 화면에서만 볼 수 있다. 보관 기간 정책은 사장님이 정해 `receipts.image` 를 주기적으로 비우면 된다.
- 네이버 플레이스 연동은 링크·QR(트래픽 유도)이다. 네이버가 외부 사이트에 방문 데이터를 주지 않으므로 "실제 방문 1회 인정"은 영수증으로만 한다.
