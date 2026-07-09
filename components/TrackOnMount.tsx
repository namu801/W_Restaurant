"use client";

import { useEffect, useRef } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/** 서버 컴포넌트 화면에서 진입 이벤트를 1회 전송하기 위한 클라이언트 래퍼 */
export function TrackOnMount({
  event,
  props,
}: {
  event: AnalyticsEvent;
  props?: Record<string, unknown>;
}) {
  const fired = useRef(false);

  useEffect(() => {
    if (fired.current) return;
    fired.current = true;
    track(event, props);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
