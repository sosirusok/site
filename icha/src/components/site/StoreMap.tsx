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
          icon: { content: pinHtml(i + 1, s.shortName, s.id === activeId, s.id, compact), anchor: new M.Point(19, 48) },
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
            markers.get(s.id)?.setIcon({ content: pinHtml(i + 1, s.shortName, s.id === id, s.id, compact), anchor: new M.Point(19, 48) });
            markers.get(s.id)?.setZIndex(s.id === id ? 10 : 1);
          });
        },
      };
      setEngine("naver");
      cleanup = () => map.destroy?.();
    }

    async function initLeaflet() {
      const L = (await import("leaflet")).default;
      if (disposed) return;
      const map = L.map(el!, { zoomControl: !compact, scrollWheelZoom: false, attributionControl: true });
      // 기본 접두사(Leaflet 글자 + 우크라이나 국기 SVG)는 지우고 지도 출처만 남긴다
      map.attributionControl.setPrefix("");
      L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> 기여자',
      }).addTo(map);
      const markers = new Map<string, import("leaflet").Marker>();
      const icon = (i: number, s: MapStore, act: boolean) => L.divIcon({ className: "", html: pinHtml(i + 1, s.shortName, act, s.id, compact), iconSize: [44, 48], iconAnchor: [22, 48] });
      stores.forEach((s, i) => {
        const m = L.marker([s.lat, s.lng], { icon: icon(i, s, s.id === activeId), zIndexOffset: s.id === activeId ? 1000 : 0, keyboard: true, title: s.name }).addTo(map);
        m.on("click", () => {
          setActiveId(s.id);
          map.panTo([s.lat, s.lng]);
        });
        markers.set(s.id, m);
      });
      L.marker([SEOMYEON_STATION.lat, SEOMYEON_STATION.lng], {
        icon: L.divIcon({ className: "", html: `<div class="sm-station"><span class="sm-station__label">${SEOMYEON_STATION.name}</span></div>`, iconSize: [22, 22], iconAnchor: [11, 11] }),
        interactive: false,
      }).addTo(map);
      if (!compact && stores.length > 1) {
        map.fitBounds(L.latLngBounds(stores.map((s) => [s.lat, s.lng] as [number, number])), { padding: [70, 50], maxZoom: 18 });
      } else {
        map.setView([stores[0]!.lat, stores[0]!.lng], 17);
      }
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
      cleanup = () => map.remove();
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
