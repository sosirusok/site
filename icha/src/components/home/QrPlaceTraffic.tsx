"use client";

import { useEffect } from "react";
import { isQrScanToken, QR_PLACE_URLS, QR_SCAN_PARAM } from "@/lib/qr-traffic";

const dispatchedTokens = new Set<string>();

/** QR로 들어온 브라우저에서 토큰당 세 참여 매장에 GET을 정확히 한 번씩 보낸다. */
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

    for (const url of QR_PLACE_URLS) {
      void fetch(url, {
        method: "GET",
        mode: "no-cors",
        credentials: "include",
        cache: "no-store",
        redirect: "follow",
        keepalive: true,
        referrerPolicy: "strict-origin-when-cross-origin",
      }).catch(() => undefined);
    }
  }, []);

  return null;
}
