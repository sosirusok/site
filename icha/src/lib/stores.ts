/**
 * 매장 마스터 데이터 (정적). DB stores/menu_items 는 최초 기동 시 여기서 시드된다.
 * 조사 근거: 네이버 플레이스 / 네이버 검색 결과 / 방문 블로그 메뉴판 사진 (2026-09-15 기준). 확인되지 않은 값은 null.
 * 메뉴 사진·가격: 네이버 플레이스 업체 등록 메뉴(2026-09-19 수집)와 맞췄다. 네이버에 없는 메뉴는 메뉴판 사진 기준.
 * 사진은 scripts/import-store-images.mjs 가 public/images/stores/<id>/ 로 복사한다.
 */
import type { StoreId } from "./config";

export type MenuSeed = {
  name: string;
  price: number | null;
  description?: string;
  /** /public 기준 경로 */
  image?: string;
  /** 무료 사이드로 고를 수 있는 항목 (관리자 화면에서 변경 가능) */
  gift?: boolean;
};

export type StoreImage = {
  src: string;
  alt: string;
  kind: "hero" | "exterior" | "interior" | "food" | "drink" | "menu";
};

export type Store = {
  id: StoreId;
  /** 네이버 플레이스 공식 상호 */
  name: string;
  /** 화면용 짧은 이름 */
  shortName: string;
  /** 영수증 상호 매칭용 별칭 */
  aliases: string[];
  /** 대표 술 */
  drink: "막걸리" | "맥주" | "소주";
  /** 포스터의 코스 순서와 한 마디(1차 맥주로 시작 → 2차 막걸리로 이어서 → 3차 소주로 마무리) */
  course: { n: 1 | 2 | 3; line: string };
  /** 포스터에 적힌 혜택 이름(짧게) */
  benefitLabel: string;
  /** 매장 색 */
  accent: string;
  accentInk: string;
  naverPlaceId: string | null;
  address: string;
  addressJibun: string | null;
  /** 영수증 주소 매칭 키워드 */
  addressKeywords: string[];
  /** 대표 전화(공개용; 네이버 안심번호일 수 있음) */
  phone: string | null;
  /** 영수증에 인쇄될 수 있는 다른 번호(유선 등) — 매칭용 */
  phoneAliases: string[];
  bizNo: string | null;
  hours: { days: string; time: string }[];
  hoursNote: string | null;
  lat: number | null;
  lng: number | null;
  /** 한 문장 소개 */
  headline: string;
  intro: string;
  keywords: string[];
  /** 방문자 리뷰 인용 (실제 리뷰, 날짜 포함) */
  quotes: { text: string; date: string }[];
  /** 네이버 방문자 평점·리뷰 수 (조사 시점 값, 확인된 것만) */
  naverRating: { score: number; count: number; asOf: string } | null;
  images: StoreImage[];
  menu: MenuSeed[];
  sort: number;
};

const J = "/images/stores/joseon";
const T = "/images/stores/tokyo";
const W = "/images/stores/wareureu";

export const STORES: Store[] = [
  {
    id: "joseon",
    name: "조선칼국수와통막걸리 서면밀레오레본점",
    shortName: "조선칼국수",
    aliases: [
      "조선칼국수",
      "조선칼국수와통막걸리",
      "조선칼국수와 통막걸리",
      "조선칼국수 통막걸리",
      "조선칼국수 서면점",
      "조선칼국수 서면본점",
      "조선칼국수와 통막걸리 서면본점",
      "조선칼국수 서면밀레오레본점",
      "통막걸리",
      "조칼",
    ],
    drink: "막걸리",
    course: { n: 2, line: "막걸리로 이어서!" },
    benefitLabel: "막걸리 2통1반",
    accent: "#c8553d",
    accentInk: "#5a1f12",
    naverPlaceId: "32874065",
    address: "부산 부산진구 동천로85번길 14 1,2층",
    addressJibun: "부산 부산진구 부전동 168-326",
    addressKeywords: ["동천로85번길 14", "동천로85번길", "부전동 168-326"],
    phone: "0507-1426-6681",
    // 유선 051-806-6679 는 오래된 디렉터리에만 남아 있어 현재 사용 여부 미확인 — 매칭용으로만 둔다.
    phoneAliases: ["051-806-6679"],
    bizNo: null,
    hours: [
      { days: "일~목", time: "15:00 – 다음날 09:00 · 주문 마감 08:00" },
      { days: "금·토", time: "15:00 – 다음날 10:00 · 주문 마감 09:00" },
    ],
    hoursNote: "정기 휴무 없음. 주문은 테이블 태블릿으로 합니다.",
    lat: 35.1564299,
    lng: 129.061563,
    headline: "칼국수·전·통막걸리를 내는 요리주점. 아침 9시까지 영업합니다.",
    intro:
      "서면 밀리오레 맞은편 골목에 있는 통나무 건물의 1·2층 요리주점입니다. 입구에 물이 흐르는 돌벽과 장승이 있고, 2층은 좌식입니다.\n칼국수·수제비·냉면 같은 식사와 김치전·호박전·빈대떡 같은 전, 양은 통에 담아 내는 조선막걸리가 주 메뉴입니다. 오후 3시에 열어 다음날 아침까지 영업합니다.",
    keywords: ["통막걸리", "칼국수·수제비", "전 모듬", "아침까지 영업", "2층 좌식·단체석"],
    quotes: [
      { text: "비 오는 날 퇴근 후 칼국수에 막걸리가 생각나서 방문했어요. 메뉴가 엄청 다양한데 실패했다 하는 맛은 아닌 것 같아서 좋아요.", date: "2026.06" },
      { text: "영업시간이 길어서 늦게 가기 좋은 술집입니다. 수제비와 냉면이 맛있었어요.", date: "2026.02" },
      { text: "조칼 가면 무조건 먹어야 하는 칼국수와 전. 그리고 조칼이 계란말이 맛집이거덩여.", date: "2024.11" },
    ],
    naverRating: { score: 4.52, count: 729, asOf: "2026-09-15" },
    images: [
      { src: `${J}/hero.jpg`, alt: "밤에 불을 켠 통나무 매장과 조선칼국수·통막걸리 간판, 장승과 테라스", kind: "hero" },
      { src: `${J}/exterior-day.jpg`, alt: "낮에 본 정면. 돌길 진입로와 나무 장승, 1층 목조 테라스", kind: "exterior" },
      { src: `${J}/exterior-sign-night.jpg`, alt: "밤의 둥근 조명 간판과 동천로85번길 14 표지판", kind: "exterior" },
      { src: `${J}/entrance-door.jpg`, alt: "통나무 기둥 사이 출입문과 '조선칼국수와 통막걸리' 나무 현판", kind: "exterior" },
      { src: `${J}/entrance-garden.jpg`, alt: "돌판길과 물이 흐르는 검은 돌벽, 장승이 있는 밤의 진입로", kind: "exterior" },
      { src: `${J}/interior-hall.jpg`, alt: "황토 벽과 통나무 테이블이 놓인 1층 홀", kind: "interior" },
      { src: `${J}/interior-window.jpg`, alt: "창 너머 정원과 장승이 보이는 창가 자리", kind: "interior" },
      { src: `${J}/interior-2f-room.jpg`, alt: "원목 좌탁을 둔 2층 좌식 방", kind: "interior" },
      { src: `${J}/kalguksu.jpg`, alt: "맑은 멸치 육수에 파와 김가루를 올린 조선 칼국수", kind: "food" },
      { src: `${J}/haemul-pajeon.jpg`, alt: "쪽파와 해물을 넣어 크게 부친 해물파전", kind: "food" },
      { src: `${J}/modeum-jeon.jpg`, alt: "김치전·호박전·빈대떡·감자전·땡초정구지전 모듬전과 초장·간장", kind: "food" },
      { src: `${J}/haemul-maeun-kalguksu.jpg`, alt: "홍합과 바지락이 든 빨간 국물의 해물매운칼국수", kind: "food" },
      { src: `${J}/kimchi-jeon.jpg`, alt: "로고 접시에 담긴 김치전과 간장·초장", kind: "food" },
      { src: `${J}/makgeolli-2tong1ban.jpg`, alt: "막걸리 2통에 사이다 1병을 섞어 큰 사발에 낸 2통 1반", kind: "drink" },
      { src: `${J}/honey-makgeolli.jpg`, alt: "유리 주전자에 담긴 꿀막걸리를 국자로 젓는 모습", kind: "drink" },
      { src: `${J}/makgeolli-cheers.jpg`, alt: "막걸리 사발 세 잔으로 건배", kind: "drink" },
      { src: `${J}/menu-board-anju.jpg`, alt: "안주류 메뉴판(2026년 2월). 해물파전·모듬전 14,000원, 전류 12,000원", kind: "menu" },
      { src: `${J}/menu-board-drinks.jpg`, alt: "주류 메뉴판(2026년 2월). 조선막걸리 1통 5,500원, 2통 1반 11,500원", kind: "menu" },
    ],
    // 가격: 네이버 등록 메뉴(2026-09-19 수집)에 있는 항목은 네이버 등록가, 나머지는 2026-02 메뉴판 사진 기준(2026-06 매장 앞 현수막·태블릿 사진과 일치 확인).
    // 네이버와 메뉴판이 다른 항목은 줄 끝 주석에 적었다. 사진은 업체 등록 메뉴 사진(네이버에 없는 메뉴는 방문 사진).
    menu: [
      // 식사류(면)
      { name: "조선 칼국수", price: 7000, description: "맑은 멸치 육수", image: `${J}/menu/kalguksu.jpg` },
      { name: "조선 수제비", price: 7000 },
      { name: "조선 김치칼국수", price: 7500 },
      { name: "조선 김치수제비", price: 7500 },
      { name: "조선 바지락칼국수", price: 7500, description: "바지락을 넣은 맑은 칼국수", image: `${J}/menu/bajirak-kalguksu.jpg` },
      { name: "조선 바지락수제비", price: 7500 },
      { name: "조선 해물매운칼국수", price: 7500, description: "홍합·바지락이 든 얼큰한 국물", image: `${J}/menu/haemul-maeun-kalguksu.jpg` },
      { name: "조선 해물매운수제비", price: 7500 },
      { name: "조선 황태칼국수", price: 7000 },
      { name: "조선 황태수제비", price: 7000 },
      { name: "조선 물냉면", price: 7500, description: "주문이 가장 많은 메뉴", image: `${J}/menu/mul-naengmyeon.jpg` },
      { name: "조선 만두", price: 6000, description: "찐만두 8개", image: `${J}/menu/mandu.jpg` },
      { name: "계란 추가", price: 700 },
      // 식사류(밥)
      { name: "조선 야채참치비빔밥", price: 8000 },
      { name: "조선 김치참치비빔밥(돌솥)", price: 8000 },
      { name: "조선 김치알밥(돌솥)", price: 8000 },
      { name: "조선 고추장불고기비빔밥(돌솥)", price: 8000 },
      { name: "공기밥", price: 1000 },
      // 안주류
      { name: "조선 계란말이", price: 7000, description: "두툼하게 말아 썰어 내는 계란말이" },
      { name: "조선 해물파전", price: 14000, description: "쪽파와 해물을 넣은 큰 파전", image: `${J}/menu/haemul-pajeon.jpg` }, // 매장 메뉴판 사진(2026-02) 14,000원 기준. 네이버 등록가는 13,500원(2026-09-19 확인) — 사장님 확인 필요
      { name: "조선 반반전(김치+정구지)", price: 12000, description: "김치전 반, 정구지(부추)전 반", image: `${J}/menu/banban-jeon.jpg` },
      { name: "조선 김치전", price: 12000, image: `${J}/menu/kimchi-jeon.jpg` },
      { name: "조선 땡초정구지전", price: 12000, description: "청양고추를 넣은 부추전" },
      { name: "조선 호박전", price: 12000, image: `${J}/menu/hobak-jeon.jpg` }, // 매장 메뉴판 사진(2026-02) 12,000원 기준. 네이버 등록가는 11,500원(2026-09-19 확인) — 사장님 확인 필요
      { name: "조선 빈대떡", price: 12000, description: "녹두 빈대떡", image: `${J}/menu/bindaetteok.jpg` },
      { name: "조선 모듬전", price: 14000, description: "김치전·호박전·빈대떡·감자전·땡초정구지전 다섯 가지", image: `${J}/menu/modeum-jeon.jpg` },
      { name: "조선 두부김치", price: 11500, image: `${J}/menu/dubu-kimchi.jpg` },
      { name: "조선 순대볶음", price: 11500, image: `${J}/menu/sundae-bokkeum.jpg` },
      { name: "조선 두루치기", price: 11500, image: `${J}/menu/duruchigi.jpg` },
      { name: "조선 골뱅이소면무침", price: 13000, image: `${J}/menu/golbaengi-somyeon.jpg` },
      { name: "조선 닭똥집볶음", price: 12000, description: "간장 양념 철판 볶음", image: `${J}/menu/dakttongjip.jpg` },
      { name: "조선 뼈없는매운닭발", price: 13000 },
      { name: "조선 오뎅탕", price: 11000, image: `${J}/menu/odeng-tang.jpg` },
      { name: "조선 김치오뎅탕", price: 12000 },
      { name: "조선 홍합탕", price: 11000 },
      { name: "조선 순두부탕", price: 12000, image: `${J}/menu/sundubu-tang.jpg` },
      { name: "조선 불고기전골", price: 12500, image: `${J}/menu/bulgogi-jeongol.jpg` },
      { name: "조선 부대찌개", price: 12500 },
      { name: "조선 김치두부삼겹살", price: 13000, image: `${J}/menu/kimchi-dubu-samgyeop.jpg` },
      { name: "조선 김치묵사발", price: 10500, description: "냉면 육수에 도토리묵과 김치", image: `${J}/menu/kimchi-muksabal.jpg` },
      { name: "조선 도토리묵", price: 10500 },
      { name: "사리 추가(라면·당면·소면)", price: 1500 },
      // 주류·음료
      { name: "조선막걸리 1통", price: 5500, description: "양은 통에 담아 내는 하우스 막걸리", image: `${J}/menu/joseon-makgeolli.jpg` },
      { name: "조선막걸리 2통 1반", price: 11500, description: "막걸리 2통에 사이다 1병을 섞어 큰 사발에", image: `${J}/menu/makgeolli-2tong1ban.jpg`, gift: true },
      { name: "칵테일막걸리", price: 9000, description: "딸기·바나나·망고·키위·살구·복분자", image: `${J}/menu/cocktail-makgeolli.jpg` },
      { name: "꿀막걸리", price: 7500, image: `${J}/menu/honey-makgeolli.jpg` },
      { name: "보늬밤막걸리", price: 6000 },
      { name: "지평 생막걸리", price: 5000 },
      { name: "느린마을막걸리(방울톡)", price: 6000, image: `${J}/menu/neurinmaeul-makgeolli.jpg` },
      { name: "복사주", price: 14000, description: "복분자·사이다·각얼음 칵테일" },
      { name: "복분자", price: 13000 },
      { name: "크림생맥주 500cc", price: 5000 },
      { name: "크림생맥주 1,700cc", price: 15000 },
      { name: "소주", price: 5000 },
      { name: "새로", price: 5000 },
      { name: "맥주", price: 5000 },
      { name: "음료수", price: 2000, description: "콜라·제로콜라·사이다·제로사이다·환타" },
    ],
    sort: 1,
  },
  {
    id: "tokyo",
    name: "도쿄스탠드 서면점",
    shortName: "도쿄스탠드",
    aliases: ["도쿄스탠드", "도쿄 스탠드", "도쿄스탠드 서면", "도-쿄 스탠드", "TOKYO STAND", "Tokyo Stand 서면점", "tokyostand", "東京スタンド"],
    drink: "맥주",
    course: { n: 1, line: "맥주로 시작!" },
    benefitLabel: "산토리 프리미엄 생맥주",
    accent: "#d99a2b",
    accentInk: "#4a3305",
    naverPlaceId: "2071490466",
    address: "부산 부산진구 서전로10번길 31-5 1층",
    addressJibun: "부산 부산진구 부전동 168-137",
    addressKeywords: ["서전로10번길 31-5", "서전로10번길", "부전동 168-137"],
    phone: "0507-1393-8977",
    // 네이버 예약 데이터의 대표 전화. 영수증에 이 번호가 찍힐 수 있다.
    phoneAliases: ["051-818-8977"],
    bizNo: "307-18-15409",
    hours: [
      { days: "월~목·일", time: "17:00 – 다음날 03:00 · 주문 마감 02:00" },
      { days: "금·토", time: "17:00 – 다음날 04:00 · 주문 마감 03:00" },
    ],
    hoursNote: "정기 휴무 없음. 2026년 9월에 문을 연 매장이라 영업시간이 바뀔 수 있습니다.",
    lat: 35.156364,
    lng: 129.0601968,
    headline: "서서 마시는 산토리 공식 생맥주 매장. 생맥주 한 잔 8,900원입니다.",
    intro:
      "서면역 6번 출구에서 걸어서 2분, 2026년 9월에 문을 연 일본식 타치노미(서서 마시는 술집)입니다. 산토리 공식 매장으로 크리미·소프트·밀코 세 가지 산토리 생맥주와 직접 만든 밀맥주 '도쿄 윗 비어'를 한 잔 8,900원에 냅니다. 17년 동안 생맥주를 다룬 경험으로 잔을 냅니다.\n안주는 비어슁켄·약드부어스트·본레스 세 가지 수제 햄을 담은 콜드햄 플레이트가 중심이고, 오이사라다·계란볶음밥처럼 가볍게 곁들일 것도 있습니다. 카운터석과 바 테이블 위주라 혼자 와서 한 잔 하기에도 편합니다.",
    keywords: ["산토리 생맥주", "타치노미", "콜드햄 플레이트", "혼술", "서면역 도보 2분"],
    quotes: [
      { text: "맥주 종류도 다양하고 취향에 맞게 골라 마실 수 있어서 좋네요. 무엇보다 생맥주가 시원하고 목넘김이 좋아서 계속 들어가요!", date: "2026.09" },
      { text: "서서 마시는데도 전혀 불편함 없고, 오히려 옆 테이블과 자연스럽게 소통하는 재미도 있었습니다.", date: "2026.09" },
      { text: "교토 산토리 공장 갔을 때랑 비슷한 맛이 납니다. 비싸지 않고 좋아요.", date: "2026.09" },
    ],
    naverRating: { score: 4.82, count: 17, asOf: "2026-09-15" },
    images: [
      { src: `${T}/hero.jpg`, alt: "밤의 정면. 파란 '도쿄스탠드' 간판과 '산토리공식매장' 노렌, 유리창의 콜드햄·생맥주 그림", kind: "hero" },
      { src: `${T}/exterior-alley.jpg`, alt: "골목에서 비스듬히 본 매장. 파란 간판과 돌출 간판", kind: "exterior" },
      { src: `${T}/exterior-window.jpg`, alt: "전면 유리창의 곰 캐릭터와 '시그니처 콜드햄 플레이트 인기 No.1' 그림", kind: "exterior" },
      { src: `${T}/exterior-light-sign.jpg`, alt: "입구 앞 주황빛 입간판 '東京スタンド 도-쿄 스탠드'", kind: "exterior" },
      { src: `${T}/interior-counter.jpg`, alt: "매화 무늬 노렌과 파란 '東京スタンド' 라이트 패널이 걸린 카운터", kind: "interior" },
      { src: `${T}/interior-noren.jpg`, alt: "노렌과 라이트 패널, 주방 식기 선반", kind: "interior" },
      { src: `${T}/interior-keg-fridge.jpg`, alt: "'생맥주 대기실' 문구가 붙은 냉장고 속 산토리 생맥주 케그", kind: "interior" },
      { src: `${T}/draft-tap.jpg`, alt: "탭에서 로고 잔에 생맥주를 따르는 직원의 손", kind: "drink" },
      { src: `${T}/draft-foam.jpg`, alt: "크림 거품이 넘치게 따른 생맥주", kind: "drink" },
      { src: `${T}/wheat-beer.jpg`, alt: "오렌지 슬라이스를 올린 도쿄 윗 비어", kind: "drink" },
      { src: `${T}/cold-ham-plate-beers.jpg`, alt: "산토리 생맥주와 도쿄 윗 비어, 콜드햄 플레이트와 소스 두 가지", kind: "food" },
      { src: `${T}/cold-ham-plate-top.jpg`, alt: "위에서 본 시그니처 콜드햄 플레이트. 햄·크래커·파프리카·피클·토마토·코울슬로", kind: "food" },
      { src: `${T}/egg-fried-rice.jpg`, alt: "검은 볼에 담긴 계란볶음밥과 피클·마요네즈", kind: "food" },
      { src: `${T}/beer-cheesecake.jpg`, alt: "나무 바 테이블 위 생맥주와 치즈케이크", kind: "food" },
      { src: `${T}/menu-board-beers.jpg`, alt: "맥주 메뉴판. 산토리 생맥주 3종·도쿄 윗 비어 8,900원, 코젤 다크 10,900원", kind: "menu" },
      { src: `${T}/menu-board-food.jpg`, alt: "안주 메뉴판. 시그니처 콜드햄 플레이트 13,900원부터 디저트까지", kind: "menu" },
    ],
    // 가격: 네이버 등록 메뉴(2026-09-19 다시 확인)와 매장 메뉴판 사진(2026-09-11) 일치. 사진은 업체 등록 메뉴 사진.
    menu: [
      // 맥주
      { name: "산토리 프리미엄 생맥주", price: 8900, description: "퍼펙트 푸어링 크리미 거품", image: `${T}/menu/suntory-creamy.png`, gift: true },
      { name: "산토리 소프트 생맥주", price: 8900, description: "쫀쫀한 거품에 탄산이 또렷한 잔", image: `${T}/menu/suntory-soft.png` },
      { name: "산토리 밀코 생맥주", price: 8900, description: "우유처럼 하얀 거품이 잔을 덮는 생맥주", image: `${T}/menu/suntory-milko.png` },
      { name: "도쿄 윗 비어", price: 8900, description: "직접 만든 호가든 스타일 밀맥주. 오렌지 슬라이스를 올려 냅니다", image: `${T}/menu/wheat-beer.png` },
      { name: "코젤다크 생맥주", price: 10900, description: "카라멜 풍미의 체코 흑맥주", image: `${T}/menu/kozel-dark.png` },
      // 콜드햄
      { name: "시그니처 콜드햄 플레이트", price: 13900, description: "비어슁켄·약드부어스트·본레스 수제 햄 12조각 · 대표 메뉴", image: `${T}/menu/signature-cold-ham-plate.png` },
      { name: "시그니처 햄세트", price: 28900, description: "생맥주 2잔 + 시그니처 콜드햄 플레이트", image: `${T}/menu/signature-ham-set.png` }, // 네이버 메뉴 기준(매장 메뉴판에는 없음)
      { name: "콜드햄 플레이트(비어슁켄)", price: 8900, description: "독일식 햄 한 종류 6조각", image: `${T}/menu/cold-ham-plate.png` },
      { name: "콜드햄 플레이트(약드부어스트)", price: 8900, description: "한 종류 6조각", image: `${T}/menu/cold-ham-plate.png` },
      { name: "콜드햄 플레이트(본레스)", price: 8900, description: "훈연 향이 있는 본레스햄 6조각", image: `${T}/menu/cold-ham-plate.png` },
      { name: "그릴부어스트 소시지", price: 9900, description: "수제 소시지에 스위트칠리 소스", image: `${T}/menu/grill-wurst.png` },
      // 가벼운 안주
      { name: "콜드햄 샐러드", price: 6900, description: "수제 햄을 올린 샐러드", image: `${T}/menu/cold-ham-salad.png` },
      { name: "유자토마토", price: 5900, description: "유자 드레싱을 뿌린 토마토", image: `${T}/menu/yuzu-tomato.png` },
      { name: "오이사라다", price: 5900, description: "특제 소스에 버무린 오이", image: `${T}/menu/oi-salad.png` },
      { name: "계란볶음밥", price: 5900, description: "고슬하게 볶은 볶음밥", image: `${T}/menu/egg-fried-rice.png` },
      { name: "테바사키 윙", price: 7900, description: "일본식 닭날개 튀김", image: `${T}/menu/tebasaki.png` },
      { name: "트러플 감자튀김", price: 7900, description: "트러플 마요를 뿌린 감자튀김", image: `${T}/menu/truffle-fries.png` },
      { name: "토마토 달걀볶음", price: 9900, description: "방울토마토·베이컨을 넣은 달걀 볶음", image: `${T}/menu/tomato-egg.png` },
      // 면
      { name: "나폴리탄", price: 9900, description: "케첩 소스의 일본식 스파게티", image: `${T}/menu/napolitan.png` },
      { name: "야끼소바", price: 9900, description: "가쓰오부시를 올린 일본식 볶음면", image: `${T}/menu/yakisoba.png` },
      { name: "매콤 야끼소바", price: 9900, image: `${T}/menu/spicy-yakisoba.png` }, // 네이버 메뉴 기준(매장 메뉴판에는 야끼소바만 있음)
      { name: "얼큰우동", price: 6900, description: "칼칼한 국물 우동", image: `${T}/menu/spicy-udon.png` },
      // 디저트
      { name: "시나몬 오렌지", price: 4900, description: "오렌지 슬라이스에 시나몬 설탕", image: `${T}/menu/cinnamon-orange.png` },
      { name: "치즈케이크", price: 6900, image: `${T}/menu/cheesecake.png` },
      { name: "아이스크림", price: 7900, description: "초코 시럽과 견과류를 올린 바닐라", image: `${T}/menu/ice-cream.png` },
    ],
    sort: 2,
  },
  {
    id: "wareureu",
    name: "와르르맨숀 서면점",
    shortName: "와르르맨숀",
    aliases: [
      "와르르맨숀",
      "와르르맨션",
      "와르르 맨숀",
      "와르르맨숀 서면",
      "와르르맨숀서면",
      "와르르맨숀 한식요리주점",
      "와르르맨숀 한식다이닝",
      "와르르",
      "WA-R-R MANSION",
      "WARR MANSION",
      "프로그로스",
    ],
    drink: "소주",
    course: { n: 3, line: "소주로 마무리!" },
    benefitLabel: "요거트 아이스크림 or 소주",
    accent: "#2f6b4f",
    accentInk: "#0f2e21",
    naverPlaceId: "2013923953",
    address: "부산 부산진구 중앙대로680번가길 72 2층",
    addressJibun: "부산 부산진구 부전동 168-331",
    addressKeywords: ["중앙대로680번가길 72", "중앙대로680번가길", "부전동 168-331"],
    phone: "0507-1475-1712",
    phoneAliases: [],
    bizNo: null,
    hours: [
      { days: "일~목", time: "17:00 – 다음날 04:00 · 주문 마감 03:00" },
      { days: "금·토", time: "17:00 – 다음날 05:00 · 주문 마감 04:00" },
    ],
    hoursNote: "정기 휴무 없음.",
    lat: 35.1565856,
    lng: 129.0610548,
    headline: "식사와 안주가 모두 되는 한식요리주점. 새벽 4시까지 영업합니다.",
    intro:
      "식사가 되는 한식요리주점입니다. 초저녁에는 맥주나 하이볼에 곁들일 과일·디저트, 밤이 깊으면 스지전골·크림짬뽕·육회차돌쌈 같은 안주까지 메뉴가 일흔 가지가 넘습니다.\n서면2번가 해피통닭 옆 건물 2층입니다. 천장 선풍기와 스테인드글라스 조명, 접이식 철문을 둔 홀에 최대 40명까지 앉을 수 있고, 주문은 테이블 태블릿으로 합니다. 오후 5시에 열어 새벽 4시(금·토 5시)까지 영업합니다.",
    keywords: ["한식요리주점", "스지전골", "크림짬뽕", "단체 40명", "새벽 4시까지"],
    quotes: [
      { text: "길 걷다가 분위기 좋아 보여서 들어왔는데 매장 분위기가 너무 시끄럽지도 않고 좋네요. 크림짬뽕 나오자마자 순삭했어요!", date: "2026.09" },
      { text: "김피탕 추천합니다. 진짜 소주든 맥주든 잘 어울려요. 분위기도 좋고 혼술하기도 좋을 것 같아요.", date: "2026.09" },
      { text: "좌석 간 간격도 넓어서 대화하기도 편하고 대형 스크린도 있어서 스포츠 보기도 좋아요!", date: "2026.08" },
    ],
    naverRating: { score: 4.89, count: 939, asOf: "2026-09-15" },
    images: [
      { src: `${W}/exterior-sign-night.jpg`, alt: "밤의 초록 돌출 간판 'WA-R-R MANSION'", kind: "hero" },
      { src: `${W}/hero.jpg`, alt: "티파니 조명 두 개 아래 '와르르맨숀' 로고 벽과 접이식 철문, 소파 위 인형", kind: "interior" },
      { src: `${W}/exterior-dusk.jpg`, alt: "해질녘 골목에서 올려다본 2층 초록 간판 '와르르맨숀'", kind: "exterior" },
      { src: `${W}/interior-hall.jpg`, alt: "로고 벽과 태블릿이 놓인 나무 테이블이 있는 홀", kind: "interior" },
      { src: `${W}/interior-overview.jpg`, alt: "천장 선풍기와 펜던트 조명, 칸막이 좌석이 있는 홀 전경", kind: "interior" },
      { src: `${W}/interior-booth.jpg`, alt: "다마스크 무늬 기둥과 부스 좌석, 칸막이 위 인형", kind: "interior" },
      { src: `${W}/interior-stained-glass.jpg`, alt: "노란 스테인드글라스 조명 상자와 무늬 벽지 기둥", kind: "interior" },
      { src: `${W}/interior-screen.jpg`, alt: "야구 중계가 나오는 대형 프로젝터 화면", kind: "interior" },
      { src: `${W}/yukhoe-chadol-ssam.jpg`, alt: "돌판에 낸 투뿔한우육회차돌쌈. 노른자를 올린 육회와 구운 차돌, 김치·무쌈", kind: "food" },
      { src: `${W}/daechang-dakdoritang.jpg`, alt: "감자와 미나리를 넣고 끓인 한우대창묵도리탕", kind: "food" },
      { src: `${W}/gukmul-dakbal.jpg`, alt: "무쇠 솥에 담긴 무뼈국물닭발과 떡·양배추", kind: "food" },
      { src: `${W}/chadol-yukjeon.jpg`, alt: "부추 무침을 올린 차돌육전 한 판", kind: "food" },
      { src: `${W}/muk-golbaengi.jpg`, alt: "소면과 김부각을 곁들인 노포 묵골뱅이", kind: "food" },
      { src: `${W}/bulsuji.jpg`, alt: "무쇠 팬에 담긴 키리모찌불스지", kind: "food" },
      { src: `${W}/potato-balls.jpg`, alt: "꽃무늬 접시에 담긴 동그란 감자 튀김과 소스 두 가지", kind: "food" },
      { src: `${W}/menu-board.jpg`, alt: "전체 메뉴판(2026년 7월). 시그니처·전골·요리·튀김·디저트·사이드", kind: "menu" },
      { src: `${W}/menu-board-signature.jpg`, alt: "시그니처 메뉴판. 불스지 25,900원, 아롱사태스지전골 28,900원 등", kind: "menu" },
      { src: `${W}/kiosk-new-menu.jpg`, alt: "테이블 태블릿의 신메뉴 화면. 통모짜렐라튀김+웨지감자 10,900원, 쫀득감자 8,900원", kind: "menu" },
    ],
    // 가격: 네이버 등록 메뉴(2026-09-19 수집)에 있는 항목은 네이버 등록가, 나머지는 매장 메뉴판 사진(2026-07-15) 기준.
    // 네이버와 메뉴판이 다른 항목은 줄 끝 주석에 적었다(손님 화면에는 보이지 않음). 사진은 업체 등록 메뉴 사진.
    menu: [
      // 시즌 한정
      { name: "동해초코오징어통찜", price: 32900, description: "시즌 한정. 동해 오징어를 통으로 쪄 냅니다", image: `${W}/menu/ojingeo-tongjjim.jpg` },
      { name: "신안당일바리생새우회", price: 35900, description: "시즌 한정. 하루 10접시", image: `${W}/menu/saengsaewoo-hoe.jpg` },
      // 와르르 시그니처
      { name: "매일 삶는 가브리모둠수육", price: 36900, description: "미나리 향 고기 육수에 수육 모둠", image: `${W}/menu/modum-suyuk.jpg` },
      { name: "얼큰아롱사태스지전골", price: 28900, description: "다섯 시간 삶은 아롱사태와 스지. 주문 많은 전골", image: `${W}/menu/suji-jeongol.jpg` },
      { name: "사천마라스지전골", price: 26900, description: "한국식으로 맞춘 마라 스지전골", image: `${W}/menu/mara-suji-jeongol.jpg` },
      { name: "와르르 키리모찌불스지", price: 25900, description: "불향 나게 볶은 스지에 키리모찌(구운 떡)", image: `${W}/menu/bulsuji.jpg` },
      { name: "한우대창묵도리탕(묵은지)", price: 27900, description: "묵은지·한우대창·닭고기를 넣은 닭도리탕", image: `${W}/menu/daechang-dakdoritang.jpg` },
      { name: "얼큰토마토해장빼쉐", price: 19900, description: "조개를 넣은 얼큰한 토마토 국물", image: `${W}/menu/tomato-haejang-ppaeswe.jpg` },
      // 전골류
      { name: "와르르반점 크림짬뽕", price: 19900, description: "크림 베이스 매운 짬뽕 · 대표 메뉴", image: `${W}/menu/cream-jjamppong.jpg` },
      { name: "맨숀밀푀유나베", price: 21900, description: "간장 베이스의 맑은 국물", image: `${W}/menu/mille-feuille-nabe.jpg` },
      { name: "돈짬(돈까스짬뽕탕)", price: 20900, description: "짬뽕탕 위에 돈까스", image: `${W}/menu/donjjam.jpg` },
      { name: "와르르꼬꼬야끼", price: 21900, description: "닭고기와 차돌을 넣은 얼큰한 닭 전골", image: `${W}/menu/kkokko-yaki.jpg` },
      { name: "무뼈국물닭발", price: 17900, image: `${W}/menu/gukmul-dakbal.jpg` },
      // 요리류
      { name: "투뿔한우육회차돌쌈", price: 29900, description: "1++ 한우 육회와 차돌", image: `${W}/menu/yukhoe-chadol-ssam.jpg` }, // 매장 메뉴판 사진(2026-07) 29,900원 기준. 네이버 등록가는 28,900원(2026-09-19 확인) — 사장님 확인 필요
      { name: "투뿔한우육회&김부각", price: 26900, image: `${W}/menu/yukhoe-gimbugak.jpg` }, // 매장 메뉴판 사진(2026-07) 26,900원 기준. 네이버 등록가는 25,900원(2026-09-19 확인) — 사장님 확인 필요
      { name: "육회불닭양파쌈", price: 27900, description: "육회에 불닭, 매운맛 뺀 양파와 김부각", image: `${W}/menu/yukhoe-buldak.jpg` }, // 매장 메뉴판 사진(2026-07) 27,900원 기준. 네이버 등록가는 26,900원(2026-09-19 확인) — 사장님 확인 필요
      { name: "가브리수육 칼빔면", price: 27900, description: "가브리살 수육을 매콤새콤 칼국수 비빔면에 싸서", image: `${W}/menu/suyuk-kalbimmyeon.jpg` }, // 매장 메뉴판 사진(2026-07) 27,900원 기준. 네이버 등록가는 25,900원(2026-09-19 확인) — 사장님 확인 필요
      { name: "노포 묵골뱅이소면", price: 23900, description: "매콤새콤 골뱅이에 소면과 김부각", image: `${W}/menu/muk-golbaengi.jpg` },
      { name: "차돌육전 한 판", price: 22900, description: "계란옷 입혀 부친 차돌 위에 부추 무침", image: `${W}/menu/chadol-yukjeon.jpg` }, // 매장 메뉴판 사진(2026-07) 22,900원 기준. 네이버 등록가는 20,900원(2026-09-19 확인) — 사장님 확인 필요
      { name: "차돌새우미나리전", price: 23900, image: `${W}/menu/chadol-saewoo-minari-jeon.jpg` }, // 매장 메뉴판 사진(2026-07) 23,900원 기준. 네이버 등록가는 20,900원(2026-09-19 확인) — 사장님 확인 필요
      { name: "불고기치즈김치전", price: 18900, image: `${W}/menu/bulgogi-cheese-kimchi-jeon.jpg` }, // 매장 메뉴판 사진(2026-07) 18,900원 기준. 네이버 등록가는 17,900원(2026-09-19 확인) — 사장님 확인 필요
      { name: "살얼음 김치말이묵국수", price: 14900, image: `${W}/menu/kimchimari-muk-guksu.jpg` }, // 매장 메뉴판 사진(2026-07) 14,900원 기준. 네이버 등록가는 14,500원(2026-09-19 확인) — 사장님 확인 필요
      { name: "오리훈제 한판", price: 23900, image: `${W}/menu/ori-hunje.jpg` },
      { name: "명란치즈감자채전", price: 16900, image: `${W}/menu/myeongran-cheese-gamja-jeon.jpg` },
      { name: "매콤무뼈닭발", price: 16900, image: `${W}/menu/maekom-dakbal.jpg` },
      { name: "차돌숙주볶음", price: 14900, image: `${W}/menu/chadol-sukju-bokkeum.jpg` },
      { name: "돼지두부김치삼합", price: 14900, image: `${W}/menu/dubu-kimchi-samhap.jpg` },
      // 튀김류
      { name: "통모짜렐라튀김(2pcs)+웨지감자", price: 10900, description: "매콤한 양념의 통모짜렐라 튀김에 웨지감자", image: `${W}/menu/tongmozzarella-twigim.jpg` },
      { name: "뿌링통모짜(2pcs)+뿌링감자", price: 10900 },
      { name: "와르르 쫀득감자", price: 8900, description: "2026년 신메뉴. 쫀득한 감자볼에 소스 두 가지", image: `${W}/potato-balls.jpg` },
      { name: "김치피자탕수육", price: 18500, description: "탕수육에 김치와 치즈. 줄여서 '김피탕'", image: `${W}/menu/kimchi-pizza-tangsuyuk.jpg` },
      { name: "감자크림탕수육", price: 17500, image: `${W}/menu/gamja-cream-tangsuyuk.jpg` },
      { name: "수제등심탕수육", price: 17500, image: `${W}/menu/deungsim-tangsuyuk.jpg` },
      { name: "오지치즈프라이", price: 13500, image: `${W}/menu/aussie-cheese-fries.jpg` },
      { name: "불고기프렌치프라이", price: 12500, image: `${W}/menu/bulgogi-fries.jpg` },
      { name: "버터갈릭프라이", price: 8900, image: `${W}/menu/butter-garlic-fries.jpg` },
      { name: "매콤똥집튀김", price: 13900, image: `${W}/menu/maekom-ttongjip.jpg` },
      { name: "종갓집양념순살치킨", price: 12500, image: `${W}/menu/yangnyeom-chicken.jpg` },
      { name: "뿌륑순살치킨", price: 12500, image: `${W}/menu/ppuring-chicken.jpg` },
      { name: "뿌륑뿌륑치즈볼", price: 12500, image: `${W}/menu/ppuring-cheese-ball.jpg` },
      { name: "모듬감자튀김", price: 12500, image: `${W}/menu/modum-fries.jpg` },
      { name: "와르르 우유튀김", price: 11500, image: `${W}/menu/uyu-twigim.jpg` }, // 네이버 메뉴 기준(7월 메뉴판에는 없음)
      { name: "키다리고구마치즈스틱", price: 11500, image: `${W}/menu/goguma-cheese-stick.jpg` },
      { name: "와르르 오코노미야끼", price: 8900, image: `${W}/menu/okonomiyaki.jpg` },
      { name: "와르르 타코야끼", price: 7900, image: `${W}/menu/takoyaki.jpg` },
      // 파스타·피자
      { name: "와르르황제에디션크로와상피자", price: 24000, description: "크로와상 도우에 페퍼로니·새우·베이컨", image: `${W}/menu/croissant-pizza.jpg` },
      { name: "베이컨쉬림프크로와상피자", price: 23000, image: `${W}/menu/bacon-shrimp-croissant-pizza.jpg` },
      { name: "불고기페퍼로니반반크로와상피자", price: 23000, image: `${W}/menu/bulgogi-pepperoni-croissant-pizza.jpg` },
      { name: "페퍼로니대폭발크로와상피자", price: 21000, image: `${W}/menu/pepperoni-croissant-pizza.jpg` },
      { name: "명란청양크림파스타", price: 16900, image: `${W}/menu/myeongran-cream-pasta.jpg` },
      // 과일·디저트
      { name: "와르르요거트(시그니처) 300g", price: 14500, description: "요거트에 초코쉘·벌집꿀·샤인머스켓·초코그래놀라", image: `${W}/menu/yogurt.jpg` },
      { name: "와르르요거트(초코쉘)", price: 6500, image: `${W}/menu/yogurt.jpg`, gift: true },
      { name: "샤인머스켓크림치즈곶감말이", price: 14500, image: `${W}/menu/gotgam-mari.jpg` },
      { name: "무화과 크림치즈", price: 12500, image: `${W}/menu/muhwagwa-cream-cheese.jpg` }, // 네이버 메뉴 기준(7월 메뉴판에는 없음)
      { name: "계절과일플래터", price: 16500 },
      { name: "수박 완전와르르", price: 14900 },
      { name: "메반파반", price: 13500, description: "메론 반, 파인애플 반", image: `${W}/menu/meban-paban.jpg` },
      { name: "메론", price: 13500, image: `${W}/menu/melon.jpg` },
      { name: "파인애플", price: 13500 },
      { name: "설탕토마토", price: 10500, image: `${W}/menu/seoltang-tomato.jpg` },
      { name: "큐브치즈캬라멜팝콘아이스크림", price: 9500 },
      // 사이드·마른안주
      { name: "바삭바삭먹태", price: 13500, image: `${W}/menu/meoktae.jpg` },
      { name: "계란식빵토스트", price: 11000, image: `${W}/menu/gyeran-toast.jpg` },
      { name: "꿀버터 반건오징어", price: 9900, image: `${W}/menu/honey-butter-ojingeo.jpg` },
      { name: "도리토스나쵸칩", price: 7900, image: `${W}/menu/doritos-nacho.jpg` }, // 매장 메뉴판 사진(2026-07) 7,900원 기준. 네이버 등록가는 7,500원(2026-09-19 확인) — 사장님 확인 필요
      { name: "와르르 잔치국수", price: 7500, image: `${W}/menu/janchi-guksu.jpg` },
      { name: "콘치이이이즈", price: 7500, description: "콘치즈", image: `${W}/menu/corn-cheese.jpg` },
      { name: "통실통실물만두", price: 7500, image: `${W}/menu/mul-mandu.jpg` },
      { name: "계란후라이", price: 5000, image: `${W}/menu/gyeran-fry.jpg` }, // 매장 메뉴판 사진(2026-07) 5,000원 기준. 네이버 등록가는 5,500원(2026-09-19 확인) — 사장님 확인 필요
      { name: "혜자간장순두부", price: 4000, image: `${W}/menu/ganjang-sundubu.jpg` },
      { name: "간장버터계란밥", price: 3500, image: `${W}/menu/ganjang-butter-gyeranbap.jpg` },
      { name: "나 한입만 셀프라면", price: 3500 },
      { name: "주먹밥", price: 3000 },
      { name: "공기밥", price: 1500 },
      // 주류 — 공식 메뉴판에 없어 확인된 것만. 가격이 없는 항목은 매장에서 확인.
      { name: "생맥주 600cc", price: null, description: "가격은 매장에서 확인" },
      { name: "소주 1병", price: 5000, description: "좋은데이·진로 중 선택", gift: true },
      { name: "와르르 복소사", price: 16000, description: "세종복분자주 1병 + 소주 1병 + 사이다 1병, 1,100ml" },
      { name: "와르르 복막사", price: 16000, description: "세종복분자주 + 국순당 생막걸리 + 사이다, 1,400ml" },
    ],
    sort: 3,
  },
];

export const STORE_BY_ID: Record<StoreId, Store> = Object.fromEntries(STORES.map((s) => [s.id, s])) as Record<StoreId, Store>;

export function getStore(id: string): Store | null {
  return (STORE_BY_ID as Record<string, Store>)[id] ?? null;
}

/** 영수증 매장을 제외한 나머지(선물 가능) 매장 */
export function giftStoresFor(receiptStoreId: StoreId): Store[] {
  return STORES.filter((s) => s.id !== receiptStoreId);
}

export function naverPlaceUrl(s: Store): string | null {
  return s.naverPlaceId ? `https://map.naver.com/p/entry/place/${s.naverPlaceId}` : null;
}

export function naverMobilePlaceUrl(s: Store): string | null {
  return s.naverPlaceId ? `https://m.place.naver.com/restaurant/${s.naverPlaceId}/home` : null;
}

/** 코스에서 다음 매장 — 1차→2차→3차, 3차 다음은 다시 1차 */
export function nextStore(id: StoreId): Store {
  const cur = STORE_BY_ID[id];
  const n = cur.course.n === 3 ? 1 : cur.course.n + 1;
  return STORES.find((s) => s.course.n === n) ?? cur;
}
