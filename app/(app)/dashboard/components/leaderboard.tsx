export function Leaderboard({
  data,
}: {
  data: { hoTen: string; boPhan: string | null; count: number }[];
}) {
  const maxCount = data[0]?.count || 1;

  return (
    <div className="rounded-lg border border-slate-200 bg-white p-4">
      <p className="mb-3 text-sm font-semibold text-slate-700">
        Top nhan vien bao cao nhieu nhat
      </p>
      {data.length === 0 ? (
        <p className="text-sm text-slate-400">Khong co du lieu</p>
      ) : (
        <div className="space-y-2">
          {data.slice(0, 10).map((v, i) => (
            <div key={`${v.hoTen}-${i}`} className="flex items-center gap-3">
              <span className="w-5 shrink-0 text-center text-xs font-bold text-slate-400">
                {i + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-slate-800">{v.hoTen}</p>
                <p className="truncate text-xs text-slate-400">{v.boPhan || ""}</p>
              </div>
              <div className="h-2 w-24 overflow-hidden rounded-full bg-slate-100">
                <div
                  className="h-full rounded-full bg-orange-500"
                  style={{ width: `${Math.round((v.count / maxCount) * 100)}%` }}
                />
              </div>
              <span className="w-10 shrink-0 text-right text-xs font-semibold text-slate-600">
                {v.count} BC
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
