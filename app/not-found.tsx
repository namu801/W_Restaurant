import Link from "next/link";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center gap-4 py-20 text-center">
      <p className="font-serif text-lg font-bold text-ink">페이지를 찾을 수 없어요.</p>
      <p className="text-sm text-ink-soft">주소를 다시 확인하거나 처음으로 돌아가보세요.</p>
      <Link
        href="/"
        className="rounded-full bg-accent px-5 py-2.5 text-sm font-medium text-white hover:bg-accent-strong"
      >
        홈으로
      </Link>
    </div>
  );
}
