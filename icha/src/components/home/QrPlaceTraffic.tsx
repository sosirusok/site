"use client";

import { useEffect, useRef } from "react";
import {
  isQrScanToken,
  QR_PLACE_DWELL_MS,
  QR_PLACE_MAX_LIFETIME_MS,
  QR_PLACE_URLS,
  QR_SCAN_PARAM,
} from "@/lib/qr-traffic";

/** 홈페이지에 들어올 때마다 세 참여 매장 문서를 한 번씩 열고 12초간 백그라운드에 유지한다. */
export function PlaceTraffic() {
  const dispatchedInitialEntry = useRef(false);

  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const hashParams = new URLSearchParams(currentUrl.hash.slice(1));
    const token = hashParams.get(QR_SCAN_PARAM);

    if (token && isQrScanToken(token)) {
      hashParams.delete(QR_SCAN_PARAM);
      const remainingHash = hashParams.toString();
      currentUrl.hash = remainingHash ? remainingHash : "";
      try {
        // Next.js가 감싼 replaceState는 hydration 도중 라우터 갱신을 일으킬 수 있다.
        // QR 표식은 hash 전용이므로 브라우저 원본 메서드로 주소만 조용히 정리한다.
        History.prototype.replaceState.call(
          window.history,
          window.history.state,
          "",
          `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
        );
      } catch {
        // 제한된 웹뷰에서 주소 정리가 실패해도 트래픽 호출은 계속한다.
      }
    }

    const dispatchPlaceTraffic = () => {
      const frameHost = document.createElement("div");
      frameHost.dataset.placeTraffic = String(Date.now());
      frameHost.setAttribute("aria-hidden", "true");
      Object.assign(frameHost.style, {
        position: "fixed",
        inset: "0 auto auto 0",
        width: "1px",
        height: "1px",
        overflow: "hidden",
        opacity: "0",
        pointerEvents: "none",
        clipPath: "inset(50%)",
        zIndex: "-1",
      });

      let completedFrames = 0;

      QR_PLACE_URLS.forEach((url, index) => {
        const frame = document.createElement("iframe");
        let completed = false;
        const completeFrame = () => {
          if (completed) return;
          completed = true;
          completedFrames += 1;
          frame.remove();
          if (completedFrames === QR_PLACE_URLS.length) frameHost.remove();
        };
        const loadTimeout = window.setTimeout(completeFrame, QR_PLACE_MAX_LIFETIME_MS);

        frame.title = `참여 매장 플레이스 ${index + 1}`;
        frame.width = "1";
        frame.height = "1";
        frame.loading = "eager";
        frame.referrerPolicy = "strict-origin-when-cross-origin";
        frame.tabIndex = -1;
        frame.style.border = "0";
        frame.addEventListener(
          "load",
          () => {
            frame.dataset.loadedAt = String(Date.now());
            window.clearTimeout(loadTimeout);
            window.setTimeout(completeFrame, QR_PLACE_DWELL_MS);
          },
          { once: true },
        );
        frame.src = url;
        frameHost.append(frame);
      });

      document.body.append(frameHost);
    };

    if (!dispatchedInitialEntry.current) {
      dispatchedInitialEntry.current = true;
      dispatchPlaceTraffic();
    }

    const handlePageShow = (event: PageTransitionEvent) => {
      if (event.persisted) dispatchPlaceTraffic();
    };
    window.addEventListener("pageshow", handlePageShow);

    // 프레임은 페이지 이동 뒤에도 12초 체류를 마치며, 이벤트 리스너만 컴포넌트와 함께 정리한다.
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, []);

  return null;
}
