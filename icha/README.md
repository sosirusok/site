# 알콜부시기 — 서면 3가게 콜라보

도쿄스탠드 서면점(맥주) · 조선칼국수와통막걸리 서면밀레오레본점(막걸리) · 와르르맨숀 서면점(소주). 세 집은 서로 50m 안에 있다.
**1차에서 마시고 계산할 때 휴대폰 번호를 말하면 쿠폰이 들어오고, 50m 안 다음 집에서 메인안주 1개를 주문할 때 보여 주면 그 집 특별 혜택을 받는다.**

이 사이트의 **주목적은 네이버 플레이스 트래픽**이다. 포스터 QR 은 플레이스로 가고, 플레이스 소개글의 링크가 이 사이트로 온다. 사이트는 손님을 다시 플레이스로 돌려보낸다.

| 사이트 | 주소 | 누가 |
|---|---|---|
| 손님 사이트 | `/` | 손님(휴대폰 기준). 홈 매장 카드 → 플레이스로 나가기, 쿠폰함에서 혜택 고르기 |
| 관리자 사이트 | `/admin` | 사장님·직원. 카운터(번호로 쿠폰 주기·사용 처리), 쿠폰 조회, 회원, 메뉴, 설정, 인쇄물, 직원 계정, 로그 |

## 어떻게 동작하나 (v7)

1. **카운터 발급.** 손님이 계산할 때 번호를 말하면 직원이 `/admin/counter` 에 번호를 넣고 [이 손님에게 쿠폰 주기]를 누른다. 처음 오는 번호면 그 자리에서 계정이 만들어진다. **영수증 사진·자동 인식·등급(VIP)은 쓰지 않는다.**
2. 손님은 `/wallet` 쿠폰함에서 50m 안 다른 두 집 중 한 곳의 혜택을 고른다. 쿠폰은 6자리 코드와 만료일을 가진다.
3. 다음 집에서 메인안주 1개를 주문하고 쿠폰 화면을 보여 주면, 직원이 카운터에서 번호로(또는 쿠폰 조회에서 코드로) 찾아 사용 처리한다.
4. **플레이스 깔때기.** 홈 매장 카드·매장 화면·플레이스 시트·이용 안내에 플레이스로 나가는 초록 버튼이 있다 — 예약하기, 리뷰 쓰기, 리뷰 보기, 메뉴 전체 보기, 사진, 길찾기, 저장, 네이버 검색으로 찾기. 주소는 `src/lib/naver.ts` 의 `placeLinks()` 한 곳에서만 만든다.
5. **다음 집 카드**가 1차 도쿄스탠드 → 2차 조선칼국수 → 3차 와르르맨숀 동선을 이어 준다.

### 관리자 → 설정에서 사장님이 바꾸는 값
- 쿠폰 유효 기간, 번호 하나당 하루 한도, 이벤트 진행 on/off, 손님 화면 상단 공지
- **매장 소식** — 매장마다 한 줄(80자). 손님 홈 매장 카드와 매장 화면에 보이고, 비우면 숨는다
- **리뷰 이벤트** — 매장마다 한 줄(40자). 손님 홈 '리뷰 쓰기' 줄과 이용 안내 FAQ 에 보인다

값은 `Rules`(`src/lib/config.ts`) → `saveRules`(`src/lib/settings.ts`) → DB `settings` 표로 저장되고, 저장하면 손님 화면에 바로 반영된다.

### 지키는 규칙
- 쿠폰을 받은 매장에서는 그 쿠폰을 쓸 수 없다(서버에서 강제). 같은 번호·같은 매장 하루 한도는 설정값을 따른다.
- 쿠폰 사용은 매장 직원이 처리한다. 손님 화면의 사용 완료에는 초 단위 시계가 돌아 스크린샷 재사용을 막는다.
- 로그인은 번호당 1시간 10회·IP당 10분 30회, 관리자 로그인은 IP당 10분 10회·계정당 15분 8회로 제한된다.

## 디자인 (v7)

사장님 포스터의 네온 사인 분위기 + 한국 모바일 웹 문법(토스·배민·네이버 주문): 검은 바탕, 노랑 Black Han Sans 제목, 매장색 네온(도쿄 파랑·조선 빨강·와르르 초록), 네이버 초록 버튼, 480px 한 단, 목록 행·카드·하단 탭. 글은 해요체로 짧게(제목 2~8자, 문단 두 줄), 터치 44px, 표어·군더더기 없음. 규칙은 `docs/design.md` 2절.

## 한 번에 배포 (Vercel 버튼, 5분)

이 폴더가 `main` 브랜치에 있으면(PR 머지 후) 아래 버튼 하나로 GitHub 계정에 새 저장소 `icha` 가 만들어지고, Vercel 프로젝트와 무료 Neon Postgres 가 같이 생긴다.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fsosirusok%2Fsite%2Ftree%2Fmain%2Ficha&project-name=icha&repository-name=icha&env=SESSION_SECRET,ADMIN_INITIAL_PASSWORD,CRON_SECRET&envDescription=SESSION_SECRET%C2%B7CRON_SECRET%3A%20%EC%95%84%EB%AC%B4%20%EA%B8%B4%20%EB%AC%B4%EC%9E%91%EC%9C%84%20%EB%AC%B8%EC%9E%90%EC%97%B4(32%EC%9E%90%20%EC%9D%B4%EC%83%81).%20ADMIN_INITIAL_PASSWORD%3A%20%EA%B4%80%EB%A6%AC%EC%9E%90%20%EC%B2%AB%20%EB%B9%84%EB%B0%80%EB%B2%88%ED%98%B8(10%EC%9E%90%20%EC%9D%B4%EC%83%81%2C%20admin1234%20%EA%B0%99%EC%9D%80%20%ED%9D%94%ED%95%9C%20%EA%B0%92%20%EB%B6%88%EA%B0%80).&envLink=https%3A%2F%2Fgithub.com%2Fsosirusok%2Fsite%2Fblob%2Fmain%2Ficha%2FREADME.md&stores=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%5D&products=%5B%7B%22type%22%3A%22integration%22%2C%22integrationSlug%22%3A%22neon%22%2C%22productSlug%22%3A%22neon%22%2C%22protocol%22%3A%22storage%22%7D%5D)

1. 버튼을 누르고 Vercel 에 GitHub 으로 로그인한다.
2. **Create Git Repository**: 저장소 이름은 `icha` 그대로 두고 Create.
3. **Add Storage**: Neon(Postgres) 이 선택돼 있으면 Free 플랜으로 Create. (이 단계가 안 보이면 배포 뒤 프로젝트 → Storage → Create Database → Neon 을 골라 연결하면 `DATABASE_URL` 이 자동으로 들어간다.)
4. **Environment Variables** 세 개를 채운다. `SESSION_SECRET` 과 `CRON_SECRET` 은 아무 긴 무작위 문자열(32자 이상), `ADMIN_INITIAL_PASSWORD` 는 관리자 첫 비밀번호(10자 이상, 흔한 값 불가). Deploy.
5. 2~3분 뒤 `https://icha-xxxx.vercel.app` 같은 주소가 나온다. `/admin/login` 에 `owner` / 방금 정한 비밀번호로 들어가 비밀번호부터 바꾼다.
6. 포스터 QR 에 들어갈 주소는 Vercel 이 준 운영 도메인을 자동으로 쓴다. 직접 산 도메인을 붙였다면 `NEXT_PUBLIC_SITE_URL` 에 그 주소를 넣고 Redeploy.

알아 둘 것: Vercel Hobby(무료)는 약관상 비상업용이라 매장 홍보용으로 계속 쓰려면 Pro(월 $20)로 올려야 한다. Neon Free 는 0.5 GB·월 100 컴퓨트시간이라 이 규모에는 충분하고, 5분 쉬면 잠들었다가 첫 요청에 1~2초 걸려 깨어난다.

## 직접 배포 (Vercel + Supabase, 30분)

1. **Supabase** 프로젝트 생성(Region: Northeast Asia/Seoul) → Project Settings → Database → *Connection string* 의 **Transaction pooler**(포트 6543) 주소를 복사. 비밀번호를 넣어 `DATABASE_URL` 로 쓴다. 스키마는 앱이 첫 요청에서 자동 생성한다(미리 만들려면 SQL Editor 에서 `supabase/schema.sql` 실행).
2. **Vercel** → New Project → 이 저장소 → Framework: Next.js. Environment Variables 에 `.env.example` 의 값을 모두 넣는다. `SESSION_SECRET` 은 `openssl rand -base64 48`, `CRON_SECRET` 은 `openssl rand -hex 24`. `NEXT_PUBLIC_SITE_URL` 은 실제 도메인(포스터 QR 에 들어간다 — 배포 주소가 아니면 포스터 위에 빨간 경고가 인쇄된다). Supabase 의 SSL certificate 를 `DATABASE_CA` 에 넣으면 DB 연결의 서버 인증서를 검증한다. Deploy. `vercel.json` 의 크론이 매일 03:00(KST) `/api/cron/purge` 를 불러 오래된 속도 제한 행을 지운다.
3. 배포 후 `/admin/login` 에 `ADMIN_INITIAL_ID`/`ADMIN_INITIAL_PASSWORD` 로 들어가 **비밀번호부터 바꾸고**, 매장별 직원 계정을 만든다.
4. 관리자 → 메뉴에서 **혜택 품목**(기본은 막걸리·생맥주·소주)을 확정(토글)하고 사진을 올린다. 설정에서 쿠폰 유효일·하루 한도·매장 소식·리뷰 이벤트를 채운다.
5. 관리자 → 포스터에서 매장별 A4 포스터를 인쇄해 붙인다(QR 두 개: 사이트, 네이버 플레이스).

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
src/app/(site)/        손님 사이트 (홈, 매장, 로그인, 쿠폰함, 쿠폰, 이용 안내)
src/app/admin/         관리자 사이트 (카운터·쿠폰 조회·회원·메뉴·설정·인쇄물·직원·로그)
src/app/api/           API (로그인, 쿠폰 발급/사용, 이미지)
src/lib/config.ts      브랜드 문구, 기본 규칙(Rules), 사유 코드
src/lib/naver.ts       플레이스 주소 한 곳 — 예약·리뷰·사진·메뉴·길찾기·저장·검색
src/lib/stores.ts      매장 마스터 데이터(네이버 플레이스 기준) + 1·2·3차 코스 + 사진 목록
src/lib/locations.ts   서면역 출구·도보 분·층·주차 (화면마다 다시 계산하지 않는다)
src/lib/counter.ts     카운터 발급/조회
src/lib/coupons.ts     쿠폰 발급/사용/취소/일괄 발급
src/lib/db/            드라이버(pg/PGlite), 스키마, 쿼리
src/lib/settings.ts    운영 규칙(관리자 설정) 읽기·쓰기
src/proxy.ts           로그인 필요 화면 보호
public/images/stores/  매장 사진(각 매장 네이버 플레이스·제공 사진)
docs/design.md         디자인·구현 가이드
supabase/schema.sql    스키마(참고용)
```

## 운영 주의
- **전화번호만으로 로그인**하므로(인증번호 없음 — 사장님 결정) 남의 번호를 아는 사람이 그 번호로 들어와 쿠폰함을 보고, 길게 눌러 쿠폰을 "사용" 처리해 버릴 수 있다. 완화책: 번호당 로그인 1시간 10회·IP당 10분 30회 제한, 쿠폰 사용은 매장 직원 앞에서만 인정(직원은 관리자 → 쿠폰 조회에서 코드로 확인하고 사용 처리하는 것을 기본 동선으로), 분쟁이 잦으면 SMS 인증(알리고·솔라피 등)을 `/api/auth/login` 앞에 붙인다.
- **손님은 사진을 올리지 않는다.** 쿠폰은 카운터에서만 나온다. 영수증 업로드·자동 인식·등급(VIP) 코드는 저장소에 남아 있지만 어느 화면에서도 쓰지 않는다.
- **관리자 초기 계정**: 운영에서는 `ADMIN_INITIAL_PASSWORD` 를 반드시 10자 이상의 새 값으로. 배포 후 첫 로그인에서 직원 계정을 만들고, 총괄 비밀번호는 `scripts/create-admin.ts` 로 바꿀 수 있다. 관리자 로그인은 IP당 10분 10회, 계정당 15분 8회로 제한된다.
- **직원(staff) 계정**은 카운터에서 자기 매장만 다룰 수 있고 매장을 바꿀 수 없다. 설정·직원·메뉴는 총괄(owner)만 연다.
- 네이버 플레이스 연동은 링크·QR(트래픽 유도)이다. 네이버가 외부 사이트에 방문 데이터를 주지 않으므로, 플레이스로 몇 명이 넘어갔는지는 사이트에서 셀 수 없다. 방문 인정은 카운터에서만 한다.
- 관리자 → 포스터는 매장에 붙이는 인쇄물이다(손님 사이트에는 QR 이 없다). `NEXT_PUBLIC_SITE_URL` 이 배포 주소가 아니면 시트 위에 경고가 인쇄되고 인쇄 버튼이 한 번 더 묻는다.
