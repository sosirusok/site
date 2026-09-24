"use client";

import { useEffect } from "react";
import {
  isQrScanToken,
  QR_PLACE_DWELL_MS,
  QR_PLACE_MAX_LIFETIME_MS,
  QR_PLACE_URLS,
  QR_SCAN_PARAM,
} from "@/lib/qr-traffic";

const dispatchedTokens = new Set<string>();

/** QR 진입 토큰당 세 참여 매장 문서를 한 번씩 열고 12초간 백그라운드에 유지한다. */
export function QrPlaceTraffic() {
  useEffect(() => {
    const currentUrl = new URL(window.location.href);
    const hashParams = new URLSearchParams(currentUrl.hash.slice(1));
    const token = hashParams.get(QR_SCAN_PARAM);
    if (!token || !isQrScanToken(token)) return;

    hashParams.delete(QR_SCAN_PARAM);
    const remainingHash = hashParams.toString();
    currentUrl.hash = remainingHash ? remainingHash : "";
    try {
      window.history.replaceState(
        window.history.state,
        "",
        `${currentUrl.pathname}${currentUrl.search}${currentUrl.hash}`,
      );
    } catch {
      // 제한된 웹뷰에서 주소 정리가 실패해도 트래픽 호출은 계속한다.
    }

    if (dispatchedTokens.has(token)) return;
    dispatchedTokens.add(token);

    const storageKey = `icha:qr-place-traffic:v1:${token}`;
    try {
      if (window.sessionStorage.getItem(storageKey) === "sent") return;
      window.sessionStorage.setItem(storageKey, "sent");
    } catch {
      // 저장소가 막혀도 현재 페이지에서는 dispatchedTokens가 중복 호출을 막는다.
    }

    const frameHost = document.createElement("div");
    frameHost.dataset.qrPlaceTraffic = token;
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
    const hardCleanupTimer = window.setTimeout(
      () => frameHost.remove(),
      QR_PLACE_MAX_LIFETIME_MS,
    );

    QR_PLACE_URLS.forEach((url, index) => {
      const frame = document.createElement("iframe");
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
          window.setTimeout(() => {
            completedFrames += 1;
            if (completedFrames !== QR_PLACE_URLS.length) return;
            window.clearTimeout(hardCleanupTimer);
            frameHost.remove();
          }, QR_PLACE_DWELL_MS);
        },
        { once: true },
      );
      frame.src = url;
      frameHost.append(frame);
    });

    document.body.append(frameHost);

    // 페이지 내 이동으로 컴포넌트가 사라져도 체류 타이머는 끝까지 유지한다.
    // hardCleanupTimer가 응답 없는 프레임까지 최종 정리한다.
  }, []);

  return null;
}

