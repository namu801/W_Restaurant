/**
 * "상관없어요" 선택. 예산·메뉴·분위기 화면에서 모두 같은 모양으로 쓴다 — 왼쪽 체크박스 + 글자만,
 * 카드 배경 없이 가볍게 둔다. 사진 카드와 같은 무게로 그리면 또 하나의 메뉴·분위기처럼 읽혀서,
 * 고르기 전에 먼저 보이도록 선택지 위에 두되 모양은 가장 가볍게 한다.
 */
export function AnyCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 self-start text-label font-medium text-ink">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4 accent-accent-strong"
      />
      {label}
    </label>
  );
}
