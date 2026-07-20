import { PLACES } from "./places";

/**
 * 씽씽·킥고잉 같은 공유 모빌리티 서비스가 초기에 반납 가능 지역을 원형으로 보여주던 것처럼,
 * 지금 큐레이션한 장소들을 감싸는 원을 "서비스 가능 지역"으로 잡는다. 정밀한 행정구역 경계가
 * 아니라 "대략 용산권 정도"를 시각적으로 보여주는 근사치다.
 */
const lats = PLACES.map((p) => p.lat);
const lngs = PLACES.map((p) => p.lng);
const minLat = Math.min(...lats);
const maxLat = Math.max(...lats);
const minLng = Math.min(...lngs);
const maxLng = Math.max(...lngs);

const centerLat = (minLat + maxLat) / 2;
const centerLng = (minLng + maxLng) / 2;

// 장소들을 감싸는 대각선의 절반에 30% 여유를 둬서, 경계가 마커를 바짝 조이지 않고 넉넉하게 감싸게 한다
const halfDiagonal = Math.sqrt((maxLat - minLat) ** 2 + (maxLng - minLng) ** 2) / 2;
const radiusDeg = Math.max(halfDiagonal * 1.3, 0.01);

export const SERVICE_AREA = { centerLat, centerLng, radiusDeg };

/** 경도 1도는 위도가 올라갈수록 실제 거리가 짧아지므로, 위도 보정(cos)을 곱해 원형에 가깝게 판정한다.
 *  법적 경계 판정이 아니라 "현위치가 대략 이 반경 안인가"를 보여주는 용도라 이 정도 근사면 충분하다 */
export function isWithinServiceArea(lat: number, lng: number): boolean {
  const dLat = lat - SERVICE_AREA.centerLat;
  const dLng = (lng - SERVICE_AREA.centerLng) * Math.cos((SERVICE_AREA.centerLat * Math.PI) / 180);
  return Math.sqrt(dLat ** 2 + dLng ** 2) <= SERVICE_AREA.radiusDeg;
}
