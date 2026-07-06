export function StatCards({
  total,
  pending,
  fixed,
  overdue,
}: {
  total: number;
  pending: number;
  fixed: number;
  overdue: number;
}) {
  const cards = [
    {
      label: "Tong",
      value: total,
      icon: "📋",
      iconBg: "bg-slate-100",
      valueCls: "text-slate-800",
    },
    {
      label: "Chua KP",
      value: pending,
      icon: "⏳",
      iconBg: "bg-orange-100",
      valueCls: "text-orange-600",
    },
    {
      label: "Da KP",
      value: fixed,
      icon: "✅",
      iconBg: "bg-green-100",
      valueCls: "text-green-600",
    },
    {
      label: "Qua han",
      value: overdue,
      icon: "🔴",
      iconBg: "bg-red-100",
      valueCls: "text-red-600",
    },
  ];

  return (
    <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
      {cards.map((c) => (
        <div
          key={c.label}
          className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-4 shadow-sm"
        >
          <div className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-lg ${c.iconBg}`}>
            {c.icon}
          </div>
          <div>
            <p className={`text-2xl font-bold leading-tight ${c.valueCls}`}>{c.value}</p>
            <p className="text-xs text-slate-500">{c.label}</p>
          </div>
        </div>
      ))}
    </div>
  );
}
