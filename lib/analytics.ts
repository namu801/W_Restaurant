import mixpanel from "mixpanel-browser";

/** PRD 13. 이벤트 설계에 정의된 이벤트명 */
export type AnalyticsEvent =
  | "landing_viewed"
  | "search_started"
  | "condition_step_viewed"
  | "condition_option_selected"
  | "condition_submitted"
  | "result_viewed"
  | "place_card_clicked"
  | "place_detail_viewed"
  | "place_bookmarked"
  | "bookmark_list_viewed"
  | "map_clicked"
  | "recommendation_feedback_submitted"
  | "condition_edit_clicked";

let initialized = false;

/** NEXT_PUBLIC_MIXPANEL_TOKEN이 없으면 콘솔 로그로만 동작하는 no-op 모드가 된다 */
export function initAnalytics() {
  if (initialized || typeof window === "undefined") return;
  const token = process.env.NEXT_PUBLIC_MIXPANEL_TOKEN;
  if (!token) return;
  mixpanel.init(token, { autocapture: false, track_pageview: false });
  initialized = true;
}

export function track(event: AnalyticsEvent, props?: Record<string, unknown>) {
  if (typeof window === "undefined") return;
  if (initialized) {
    mixpanel.track(event, props);
    return;
  }
  if (process.env.NODE_ENV !== "production") {
    console.debug(`[analytics:noop] ${event}`, props ?? {});
  }
}
