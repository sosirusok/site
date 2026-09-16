/**
 * 오시는 길 — 한 곳에서만 관리하고 모든 화면(홈·매장·지도·포스터)이 이 값을 그대로 쓴다.
 * 출구·도보 시간은 네이버 플레이스 업체 안내와 블로그 후기 기준. 화면마다 다른 숫자를 계산해 넣지 않는다.
 */
import type { StoreId } from "./config";

export type StoreLocation = {
  /** 지하철 출구 번호 */
  exit: number;
  /** 서면역 해당 출구에서 도보(분) */
  walkMin: number;
  /** 화면에 그대로 쓰는 한 줄 */
  subway: string;
  /** 업체가 안내하는 길 설명 */
  directions: string;
  floor: string;
  landmarks: string[];
  parking: string;
};

export const LOCATIONS: Record<StoreId, StoreLocation> = {
  joseon: {
    exit: 6,
    walkMin: 4,
    subway: "서면역 6번 출구 도보 4분",
    directions: "서면 밀리오레 맞은편 골목, 다이닝캠프 옆 건물. 1층·2층(좌식) 이용.",
    floor: "1·2층",
    landmarks: ["서면 밀리오레 맞은편", "다이닝캠프 옆"],
    parking: "주차 공간 없음 (인근 공영주차장 이용)",
  },
  tokyo: {
    exit: 6,
    walkMin: 2,
    subway: "서면역 6번 출구 도보 2분",
    directions: "서면 젊음의 거리 골목 안. 파란 간판과 '산토리 공식매장' 노렌이 걸린 1층 매장.",
    floor: "1층",
    landmarks: ["서면 젊음의 거리"],
    parking: "주차 불가",
  },
  wareureu: {
    exit: 6,
    walkMin: 3,
    subway: "서면역 6번 출구 도보 3분",
    directions: "서면2번가 해피통닭 옆 건물 2층. 불로장생 기준 오른쪽 골목 안.",
    floor: "2층",
    landmarks: ["서면2번가 해피통닭 옆 건물", "불로장생 우측 골목"],
    parking: "주차 불가",
  },
};

/** "서면역 6번 출구 도보 2~4분" 처럼 세 매장을 아우르는 한 줄 */
export function subwaySummary(): string {
  const v = Object.values(LOCATIONS);
  const exits = Array.from(new Set(v.map((l) => l.exit)));
  const mins = v.map((l) => l.walkMin);
  const lo = Math.min(...mins), hi = Math.max(...mins);
  return `서면역 ${exits.join("·")}번 출구 도보 ${lo === hi ? `${lo}분` : `${lo}~${hi}분`}`;
}
