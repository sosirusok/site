import { STORES, type Store } from "@/lib/stores";
import { DrinkIcon } from "@/components/ui/icons";
import styles from "./SeomyeonMap.module.css";

/** 서면역(1·2호선) 기준점 */
const STATION = { name: "서면역", lat: 35.15774, lng: 129.05946 };
const M_PER_DEG_LAT = 111_320;
/** 보통 걸음 — 분당 약 70m */
const WALK_M_PER_MIN = 70;

type Pt = { lat: number; lng: number };
type Placed = Store & { lat: number; lng: number };

function metersBetween(a: Pt, b: Pt): number {
  const cos = Math.cos((((a.lat + b.lat) / 2) * Math.PI) / 180);
  const dx = (b.lng - a.lng) * M_PER_DEG_LAT * cos;
  const dy = (b.lat - a.lat) * M_PER_DEG_LAT;
  return Math.sqrt(dx * dx + dy * dy);
}

export function walkMinutes(meters: number): number {
  return Math.max(1, Math.round(meters / WALK_M_PER_MIN));
}

/** 좌표가 있는 매장만. 하나도 없으면 null(섹션 숨김). */
export function placedStores(source: Store[] = STORES): Placed[] | null {
  const list = source.filter((s): s is Placed => s.lat != null && s.lng != null);
  return list.length ? list : null;
}

const W = 360;
const H = 300;
const PAD = 46;

export function SeomyeonMap({ id = "seomyeon-map", source }: { id?: string; source?: Store[] }) {
  const stores = placedStores(source);
  if (!stores) return null;

  // 기준점(서면역)에서의 미터 단위 상대 좌표 → 화면 좌표. 북쪽이 위.
  const cosLat = Math.cos((STATION.lat * Math.PI) / 180);
  const pts = [STATION, ...stores].map((p) => ({
    x: (p.lng - STATION.lng) * M_PER_DEG_LAT * cosLat,
    y: -(p.lat - STATION.lat) * M_PER_DEG_LAT,
  }));
  const xs = pts.map((p) => p.x);
  const ys = pts.map((p) => p.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const bw = Math.max(maxX - minX, 40);
  const bh = Math.max(maxY - minY, 40);
  const scale = Math.min((W - PAD * 2) / bw, (H - PAD * 2) / bh);
  const ox = (W - bw * scale) / 2 - minX * scale;
  const oy = (H - bh * scale) / 2 - minY * scale;
  const toPx = (p: { x: number; y: number }) => ({ x: p.x * scale + ox, y: p.y * scale + oy });

  const station = toPx(pts[0]!);
  const placed = stores.map((s, i) => ({ store: s, px: toPx(pts[i + 1]!), meters: metersBetween(STATION, s) }));
  // 라벨 위/아래를 x 순서대로 번갈아 두어 겹침을 피한다.
  const order = [...placed].sort((a, b) => a.px.x - b.px.x);
  const labelBelow = new Map(order.map((p, i) => [p.store.id, i % 2 === 0]));

  const scaleBarM = 50;
  const scaleBarPx = scaleBarM * scale;
  const furthestPair = (() => {
    let best = 0;
    for (let i = 0; i < stores.length; i++)
      for (let j = i + 1; j < stores.length; j++) best = Math.max(best, metersBetween(stores[i]!, stores[j]!));
    return best;
  })();
  const filterId = `${id}-hand`;

  return (
    <div className={styles.root}>
      <svg
        className={styles.svg}
        viewBox={`0 0 ${W} ${H}`}
        role="img"
        aria-labelledby={`${id}-title`}
        aria-describedby={`${id}-desc`}
      >
        <title id={`${id}-title`}>서면역과 세 매장의 위치 약도</title>
        <desc id={`${id}-desc`}>
          {placed.map((p) => `${p.store.shortName}은 서면역에서 약 ${Math.round(p.meters / 10) * 10}m`).join(", ")}.
        </desc>
        <defs>
          <filter id={filterId} x="-5%" y="-5%" width="110%" height="110%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="3" result="n" />
            <feDisplacementMap in="SourceGraphic" in2="n" scale="1.6" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <pattern id={`${id}-grid`} width="18" height="18" patternUnits="userSpaceOnUse">
            <circle cx="1" cy="1" r="0.7" className={styles.gridDot} />
          </pattern>
        </defs>
        <rect x="0" y="0" width={W} height={H} fill={`url(#${id}-grid)`} />

        {/* 역을 지나는 큰길(남북)과 매장 쪽으로 난 골목(동서) — 위치 감만 주는 추상화 */}
        <g className={styles.roads} filter={`url(#${filterId})`}>
          <path d={`M ${station.x - 6} -10 L ${station.x + 6} ${H + 10}`} className={styles.roadWide} />
          <path d={`M ${station.x + 8} ${station.y + 26} L ${W - 20} ${station.y + 26}`} className={styles.road} />
        </g>

        {/* 역에서 매장까지 걷는 길 */}
        <g filter={`url(#${filterId})`}>
          {placed.map((p) => {
            const mx = (station.x + p.px.x) / 2 + (p.px.y - station.y) * 0.12;
            const my = (station.y + p.px.y) / 2 - (p.px.x - station.x) * 0.12;
            return <path key={p.store.id} d={`M ${station.x} ${station.y} Q ${mx} ${my} ${p.px.x} ${p.px.y}`} className={styles.path} />;
          })}
        </g>

        {/* 서면역 */}
        <g transform={`translate(${station.x} ${station.y})`}>
          <circle r="11" className={styles.stationOuter} />
          <circle r="5" className={styles.stationInner} />
          <text x="16" y="-6" className={styles.stationLabel}>{STATION.name}</text>
          <text x="16" y="8" className={styles.stationSub}>1·2호선</text>
        </g>

        {/* 매장 */}
        {placed.map((p, i) => {
          const below = labelBelow.get(p.store.id) ?? true;
          const ly = below ? 30 : -22;
          return (
            <g key={p.store.id} data-store={p.store.id} transform={`translate(${p.px.x} ${p.px.y})`}>
              <circle r="13" className={styles.pin} />
              <text y="4.5" textAnchor="middle" className={styles.pinNum}>{i + 1}</text>
              <text y={ly} textAnchor="middle" className={styles.pinLabel}>{p.store.shortName}</text>
            </g>
          );
        })}

        {/* 방위와 축척 */}
        <g transform={`translate(${W - 28} 26)`} className={styles.compass}>
          <path d="M0 -12 L4 4 L0 1 L-4 4 Z" />
          <text y="18" textAnchor="middle" className={styles.compassLabel}>북</text>
        </g>
        <g transform={`translate(18 ${H - 18})`} className={styles.scaleBar}>
          <path d={`M0 0 h${scaleBarPx}`} />
          <path d="M0 -4 v8" />
          <path d={`M${scaleBarPx} -4 v8`} />
          <text x={scaleBarPx / 2} y="-7" textAnchor="middle" className={styles.scaleLabel}>{scaleBarM}m</text>
        </g>
      </svg>

      <ol className={styles.legend}>
        {placed.map((p, i) => (
          <li key={p.store.id} data-store={p.store.id} className={styles.legendItem}>
            <span className={`mono ${styles.legendNum}`}>{i + 1}</span>
            <span className={styles.legendIcon}><DrinkIcon drink={p.store.drink} size={20} /></span>
            <span className={styles.legendName}>{p.store.shortName}</span>
            <span className={`mono ${styles.legendDist}`}>
              서면역에서 약 {Math.round(p.meters / 10) * 10}m · 걸어서 {walkMinutes(p.meters)}분
            </span>
          </li>
        ))}
        {stores.length > 1 && (
          <li className={styles.legendNote}>
            가장 먼 두 곳 사이도 약 {Math.round(furthestPair / 10) * 10}m, 걸어서 {walkMinutes(furthestPair)}분이에요.
          </li>
        )}
      </ol>
    </div>
  );
}
