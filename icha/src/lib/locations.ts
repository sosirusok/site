/**
 * 찾아오는 길 — 조사된 안내 문구(네이버 플레이스 업체 안내·블로그) 기반.
 * stores.ts 와 분리해 둔 이유: 위치 설명은 자주 바뀌고, 매장 마스터와 별도로 관리한다.
 */
import type { StoreId } from "./config";

export type StoreLocation = {
  /** 지하철 안내 */
  subway: string;
  /** 업체가 안내하는 길 설명 */
  directions: string;
  /** 층 */
  floor: string;
  /** 주변 랜드마크 */
  landmarks: string[];
  /** 주차 */
  parking: string;
};

export const LOCATIONS: Record<StoreId, StoreLocation> = {
  joseon: {
    subway: "서면역 6번 출구에서 도보 약 4분 (238m)",
    directions: "서면 밀리오레 맞은편 골목으로 들어와 다이닝캠프 옆 건물. 1층과 2층(좌식)을 함께 씁니다.",
    floor: "1·2층",
    landmarks: ["서면 밀리오레 맞은편", "다이닝캠프 옆"],
    parking: "주차 정보 없음 (인근 공영주차장 이용)",
  },
  tokyo: {
    subway: "서면역 6번 출구에서 도보 약 2분 (2번 출구 142m)",
    directions: "서면 젊음의 거리 골목, 파란 간판과 '산토리 공식매장' 노렌이 걸린 1층 매장.",
    floor: "1층",
    landmarks: ["서면 젊음의 거리", "서면역 2번 출구 142m"],
    parking: "주차 불가",
  },
  wareureu: {
    subway: "서면역 6번 출구에서 도보 약 3분",
    directions: "서면2번가 해피통닭 바로 옆 건물 2층. 불로장생을 바라보고 오른쪽 골목으로 들어오면 됩니다.",
    floor: "2층",
    landmarks: ["서면2번가 해피통닭 옆 건물", "불로장생 우측 골목"],
    parking: "주차 불가",
  },
};
