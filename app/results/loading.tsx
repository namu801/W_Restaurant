/**
 * 결과를 계산하는 동안 보여주는 뼈대. 빙글빙글 도는 표시 대신 실제 목록과 같은 자리·크기로
 * 회색 덩어리를 깔아, 결과가 뜰 때 화면이 덜컥 움직이지 않게 한다.
 */
function Bar({ className }: { className: string }) {
  return <div className={`animate-pulse rounded-sm bg-cream-strong ${className}`} />;
}

export default function ResultsLoading() {
  return (
    <div className="-mx-6 -mt-8 flex min-h-full flex-col bg-cream-soft px-6 pt-6" aria-busy="true" aria-label="추천 결과를 고르는 중">
      <div className="flex items-center justify-between">
        <Bar className="h-5 w-14" />
        <Bar className="h-5 w-28" />
      </div>

      <div className="mt-4 mb-2 rounded-lg border-2 border-cream-strong px-4 py-4">
        <Bar className="h-4 w-24" />
        <Bar className="mt-3 h-5 w-full" />
        <Bar className="mt-1.5 h-5 w-2/3" />
        <Bar className="mt-4 h-9 w-40 !rounded-full" />
      </div>

      <div className="divide-y divide-line">
        {[0, 1].map((i) => (
          <div key={i} className="py-6">
            <Bar className="h-4 w-40" />
            <Bar className="mt-2 h-7 w-36" />
            <Bar className="mt-2 h-4 w-48" />
            <div className="mt-3 grid h-44 grid-cols-3 grid-rows-2 gap-1">
              <Bar className="col-span-2 row-span-2 h-full" />
              <Bar className="h-full" />
              <Bar className="h-full" />
            </div>
            <Bar className="mt-3 h-11 w-full !rounded-md" />
            <Bar className="mt-3 h-4 w-52" />
          </div>
        ))}
      </div>
    </div>
  );
}
