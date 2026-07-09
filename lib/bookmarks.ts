const STORAGE_KEY = "cheongcheobjari:bookmarks";

function readAll(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed.filter((v) => typeof v === "string") : [];
  } catch {
    return [];
  }
}

function writeAll(ids: string[]) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
}

export function getBookmarkIds(): string[] {
  return readAll();
}

export function isBookmarked(placeId: string): boolean {
  return readAll().includes(placeId);
}

/** 북마크 상태를 토글하고, 토글 후의 저장 여부(true=저장됨)를 반환한다 */
export function toggleBookmark(placeId: string): boolean {
  const ids = readAll();
  const idx = ids.indexOf(placeId);
  if (idx === -1) {
    writeAll([...ids, placeId]);
    return true;
  }
  ids.splice(idx, 1);
  writeAll(ids);
  return false;
}
