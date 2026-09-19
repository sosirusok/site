"use client";
/**
 * 실제 지도 위에 세 매장을 표시한다.
 *  - NEXT_PUBLIC_NAVER_MAP_CLIENT_ID 가 있으면 네이버 지도(JS API v3)
 *  - 없으면 Leaflet + OpenStreetMap/CARTO 타일 (키 불필요)
 * 핀을 누르거나 아래 목록을 누르면 해당 매장으로 이동하고 정보가 바뀐다.
 */
import { useEffect, useRef, useState } from "react";
import "leaflet/dist/leaflet.css";
import "./StoreMap.css";
import { googleMapUrl, kakaoMapUrl, naverWalkUrl, SEOMYEON_STATION } from "@/lib/geo";
import styles from "./StoreMap.module.css";

export type MapStore = {
  id: string;
  name: string;
  shortName: string;
  drink: string;
  lat: number;
  lng: number;
  address: string;
  naverPlaceId: string | null;
  subway?: string;
  directions?: string;
  floor?: string;
  parking?: string;
};

type Props = {
  stores: MapStore[];
  /** 처음에 강조할 매장 */
  focusId?: string;
  height?: number;
  /** 목록 숨김 + 첫 매장 중심 (매장 상세 페이지처럼 한 곳만 보여 줄 때) */
  compact?: boolean;
  /** 상세 패널 숨김 (기본: compact 와 같음) */
  hidePanel?: boolean;
  className?: string;
};

const NAVER_KEY = process.env.NEXT_PUBLIC_NAVER_MAP_CLIENT_ID?.trim();

type NaverNS = {
  maps: {
    Map: new (el: HTMLElement, opts: Record<string, unknown>) => NaverMap;
    LatLng: new (lat: number, lng: number) => unknown;
    LatLngBounds: new (sw: unknown, ne: unknown) => unknown;
    Point: new (x: number, y: number) => unknown;
    Marker: new (opts: Record<string, unknown>) => NaverMarker;
    Position: Record<string, unknown>;
    Event: { addListener: (target: unknown, name: string, fn: () => void) => void };
  };
};
type NaverMap = { panTo: (latlng: unknown) => void; fitBounds: (b: unknown, padding?: Record<string, number>) => void; setZoom: (z: number) => void; destroy?: () => void };
type NaverMarker = { setIcon: (icon: unknown) => void; setZIndex: (z: number) => void };

declare global {
  interface Window {
    naver?: NaverNS;
    __naverMapsLoading?: Promise<NaverNS>;
  }
}

function loadNaver(key: string): Promise<NaverNS> {
  if (window.naver?.maps) return Promise.resolve(window.naver);
  if (!window.__naverMapsLoading) {
    window.__naverMapsLoading = new Promise((resolve, reject) => {
      const s = document.createElement("script");
      s.src = `https://oapi.map.naver.com/openapi/v3/maps.js?ncpKeyId=${encodeURIComponent(key)}`;
      s.async = true;
      s.onload = () => (window.naver?.maps ? resolve(window.naver) : reject(new Error("naver maps not available")));
      s.onerror = () => reject(new Error("naver maps script failed"));
      document.head.appendChild(s);
    });
  }
  return window.__naverMapsLoading;
}

function pinHtml(n: number, label: string, active: boolean, storeId?: string, compact = false) {
  const num = compact ? "" : `<div class="sm-pin__num">${n}</div>`;
  return `<div class="sm-pin${active ? " sm-pin--active" : ""}" data-store="${storeId ?? ""}"><div class="sm-pin__body"></div>${num}<div class="sm-pin__label">${label}</div></div>`;
}

export function StoreMap({ stores, focusId, height = 440, compact = false, hidePanel = compact, className = "" }: Props) {
  const elRef = useRef<HTMLDivElement>(null);
  const [activeId, setActiveId] = useState<string>(focusId ?? stores[0]?.id ?? "");
  const [engine, setEngine] = useState<"naver" | "osm" | "loading" | "error">("loading");
  const controls = useRef<{ pan: (id: string) => void; setActive: (id: string) => void } | null>(null);

  const active = stores.find((s) => s.id === activeId) ?? stores[0];

  useEffect(() => {
    const el = elRef.current;
    if (!el || !stores.length) return;
    let disposed = false;
    let cleanup: (() => void) | undefined;

    const center = { lat: stores.reduce((a, s) => a + s.lat, 0) / stores.length, lng: stores.reduce((a, s) => a + s.lng, 0) / stores.length };

    async function initNaver(key: string) {
      const naver = await loadNaver(key);
      if (disposed) return;
      const M = naver.maps;
      const map = new M.Map(el!, {
        center: new M.LatLng(center.lat, center.lng),
        zoom: 17,
        minZoom: 13,
        mapTypeControl: false,
        scaleControl: false,
        logoControlOptions: { position: M.Position.BOTTOM_LEFT },
        zoomControl: !compact,
        zoomControlOptions: { position: M.Position.TOP_RIGHT },
      });
      const markers = new Map<string, NaverMarker>();
      stores.forEach((s, i) => {
        const marker = new M.Marker({
          position: new M.LatLng(s.lat, s.lng),
          map,
          icon: { content: pinHtml(i + 1, s.shortName, s.id === activeId, s.id, compact), anchor: new M.Point(22, 19) },
          zIndex: s.id === activeId ? 10 : 1,
        });
        M.Event.addListener(marker, "click", () => {
          setActiveId(s.id);
          map.panTo(new M.LatLng(s.lat, s.lng));
        });
        markers.set(s.id, marker);
      });
      new M.Marker({
        position: new M.LatLng(SEOMYEON_STATION.lat, SEOMYEON_STATION.lng),
        map,
        icon: { content: `<div class="sm-station"><span class="sm-station__label">${SEOMYEON_STATION.name}</span></div>`, anchor: new M.Point(11, 11) },
      });
      if (!compact && stores.length > 1) {
        const lats = stores.map((s) => s.lat), lngs = stores.map((s) => s.lng);
        map.fitBounds(new M.LatLngBounds(new M.LatLng(Math.min(...lats), Math.min(...lngs)), new M.LatLng(Math.max(...lats), Math.max(...lngs))), { top: 90, right: 60, bottom: 40, left: 60 });
      }
      controls.current = {
        pan: (id) => {
          const s = stores.find((x) => x.id === id);
          if (s) map.panTo(new M.LatLng(s.lat, s.lng));
        },
        setActive: (id) => {
          stores.forEach((s, i) => {
            markers.get(s.id)?.setIcon({ content: pinHtml(i + 1, s.shortName, s.id === id, s.id, compact), anchor: new M.Point(22, 19) });
            markers.get(s.id)?.setZIndex(s.id === id ? 10 : 1);
          });
        },
      };
      setEngine("naver");
      const t0 = setTimeout(() => window.dispatchEvent(new Event("resize")), 0);
      const t1 = setTimeout(() => window.dispatchEvent(new Event("resize")), 300);
      cleanup = () => { clearTimeout(t0); clearTimeout(t1); map.destroy?.(); };
    }

    async function initLeaflet() {
      const L = (await import("leaflet")).default;
      if (disposed) return;
      const map = L.map(el!, { zoomControl: !compact, scrollWheelZoom: false, attributionControl: false });
      // 지도 출처(© OpenStreetMap 기여자)는 왼쪽 위 — 오른쪽 아래는 주소 메모가 덮는 자리. 기본 접두사(Leaflet 글자 + 국기)는 없이
      L.control.attribution({ position: "topleft", prefix: "" }).addTo(map);
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> 기여자',
      }).addTo(map);
      const markers = new Map<string, import("leaflet").Marker>();
      const icon = (i: number, s: MapStore, act: boolean) => L.divIcon({ className: "", html: pinHtml(i + 1, s.shortName, act, s.id, compact), iconSize: [44, 52], iconAnchor: [22, 19] });
      stores.forEach((s, i) => {
        const m = L.marker([s.lat, s.lng], { icon: icon(i, s, s.id === activeId), zIndexOffset: s.id === activeId ? 1000 : 0, keyboard: true, title: s.name }).addTo(map);
        m.on("click", () => {
          setActiveId(s.id);
          map.panTo([s.lat, s.lng]);
        });
        markers.set(s.id, m);
      });
      const station = L.marker([SEOMYEON_STATION.lat, SEOMYEON_STATION.lng], {
        icon: L.divIcon({ className: "", html: `<div class="sm-station"><span class="sm-station__label">${SEOMYEON_STATION.name}</span></div>`, iconSize: [22, 22], iconAnchor: [11, 11] }),
        interactive: false,
      });
      const frame = () => {
        if (!compact && stores.length > 1) {
          map.fitBounds(L.latLngBounds(stores.map((s) => [s.lat, s.lng] as [number, number])), { padding: [70, 50], maxZoom: 18 });
        } else if (stores.length > 1) {
          // 홈의 작은 지도(190px): 세 핀과 라벨(핀 아래로 붙는다)이 모두 안에 — 위 56, 좌우 56, 아래 44. 서면역까지 넣으면 세 핀이 뭉쳐 라벨이 겹치므로 역은 아래에서 보이는 경우에만 표시
          map.fitBounds(L.latLngBounds(stores.map((s) => [s.lat, s.lng] as [number, number])), { paddingTopLeft: [56, 56], paddingBottomRight: [56, 44], maxZoom: 18 });
        } else {
          // 매장 화면의 작은 지도: 그 매장 핀과 서면역 표시가 같이 들어오게(역 라벨은 오른쪽으로 붙는다)
          map.fitBounds(L.latLngBounds([[stores[0]!.lat, stores[0]!.lng], [SEOMYEON_STATION.lat, SEOMYEON_STATION.lng]]), { paddingTopLeft: [40, 56], paddingBottomRight: [80, 44], maxZoom: 17 });
        }
        // 서면역 표시(22px 원 + 오른쪽 라벨 약 60px)가 지도 안에 통째로 들어올 때만 — 가장자리에 반쯤 걸치지 않는다
        const size = map.getSize();
        const pt = map.latLngToContainerPoint([SEOMYEON_STATION.lat, SEOMYEON_STATION.lng]);
        const fits = pt.x - 11 >= 4 && pt.y - 11 >= 4 && pt.x + 11 + 64 <= size.x - 4 && pt.y + 11 <= size.y - 4;
        if (fits) { if (!map.hasLayer(station)) station.addTo(map); } else if (map.hasLayer(station)) station.remove();
      };
      frame();
      // 컨테이너 크기는 글꼴·이미지가 자리 잡은 뒤 바뀔 수 있다(오른쪽이 희게 남고 핀이 잘리던 문제) — 표시 직후와 300ms 뒤, 그리고 크기가 바뀔 때마다 다시 잰다
      const refit = () => { if (disposed) return; map.invalidateSize({ animate: false }); frame(); };
      const t0 = setTimeout(refit, 0);
      const t1 = setTimeout(refit, 300);
      const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(() => { if (!disposed) map.invalidateSize({ animate: false }); }) : null;
      ro?.observe(el!);
      controls.current = {
        pan: (id) => {
          const s = stores.find((x) => x.id === id);
          if (s) map.panTo([s.lat, s.lng]);
        },
        setActive: (id) => {
          stores.forEach((s, i) => {
            markers.get(s.id)?.setIcon(icon(i, s, s.id === id));
            markers.get(s.id)?.setZIndexOffset(s.id === id ? 1000 : 0);
          });
        },
      };
      setEngine("osm");
      cleanup = () => { clearTimeout(t0); clearTimeout(t1); ro?.disconnect(); map.remove(); };
    }

    (NAVER_KEY ? initNaver(NAVER_KEY).catch(() => initLeaflet()) : initLeaflet()).catch((e) => {
      console.error("[StoreMap]", e);
      setEngine("error");
    });

    return () => {
      disposed = true;
      cleanup?.();
      controls.current = null;
    };
    // 매장 목록이 바뀌면 다시 만든다. activeId 변경은 setActive 로 처리.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stores, compact]);

  useEffect(() => {
    controls.current?.setActive(activeId);
  }, [activeId]);

  const select = (id: string) => {
    setActiveId(id);
    controls.current?.pan(id);
  };

  return (
    <div className={`${styles.wrap} ${className}`} data-engine={engine}>
      <div className={styles.mapBox} style={{ height }}>
        <div ref={elRef} className={styles.map} role="application" aria-label="매장 위치 지도" />
        {engine === "loading" && <div className={styles.loading}>지도를 불러오는 중…</div>}
        {engine === "error" && (
          <div className={styles.loading}>
            지도를 불러올 수 없습니다.{" "}
            {active && (
              <a href={naverWalkUrl({ lat: active.lat, lng: active.lng, name: active.name })} target="_blank" rel="noreferrer">
                네이버 지도 보기
              </a>
            )}
          </div>
        )}
      </div>

      {!compact && (
        <ol className={styles.list} aria-label="매장 목록">
          {stores.map((s, i) => {
            const isActive = s.id === activeId;
            return (
              <li key={s.id}>
                <button type="button" className={`${styles.item} ${isActive ? styles.itemActive : ""}`} onClick={() => select(s.id)} aria-pressed={isActive}>
                  <span className={styles.num}>{i + 1}</span>
                  <span className={styles.itemBody}>
                    <span className={styles.itemName}>{s.shortName} <em>{s.drink}</em></span>
                    <span className={styles.itemMeta}>{s.subway ?? ""}{s.floor ? ` · ${s.floor}` : ""}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      )}

      {active && !hidePanel && (
        <div className={styles.panel} aria-live="polite">
          <p className={styles.panelName}>{active.name}</p>
          <p className={styles.panelAddr}>{active.address}</p>
          {active.subway && <p className={styles.panelLine}>{active.subway}</p>}
          {active.directions && <p className={styles.panelLine}>{active.directions}</p>}
          {active.parking && <p className={styles.panelLine}>{active.parking}</p>}
          <div className={styles.links}>
            <a href={naverWalkUrl({ lat: active.lat, lng: active.lng, name: active.name })} target="_blank" rel="noreferrer">네이버 지도 길찾기</a>
            <a href={kakaoMapUrl({ lat: active.lat, lng: active.lng, name: active.name })} target="_blank" rel="noreferrer">카카오맵</a>
            <a href={googleMapUrl(active)} target="_blank" rel="noreferrer">구글 지도</a>
            {active.naverPlaceId && (
              <a href={`https://map.naver.com/p/entry/place/${active.naverPlaceId}`} target="_blank" rel="noreferrer">네이버 플레이스</a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
