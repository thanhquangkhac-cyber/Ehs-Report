import Link from "next/link";

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ qr?: string; xuong?: string; khuvuc?: string }>;
}) {
  const { qr = "", xuong = "", khuvuc = "" } = await searchParams;

  const qsGemba = new URLSearchParams({ qr, xuong, khuvuc }).toString();
  const qsReport = new URLSearchParams({ xuong, vitri: khuvuc }).toString();

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100 px-4">
      <div className="w-full max-w-sm rounded-lg bg-white p-8 text-center shadow">
        <h1 className="mb-1 text-lg font-bold text-slate-800">EHS Report</h1>
        <p className="mb-1 text-sm text-slate-500">Xuong: {xuong || "-"}</p>
        <p className="mb-6 text-sm text-slate-500">Khu vuc: {khuvuc || "-"}</p>

        <div className="flex flex-col gap-3">
          <Link
            href={`/gemba/new?${qsGemba}`}
            className="rounded bg-blue-700 py-2.5 text-sm font-semibold text-white hover:bg-blue-800"
          >
            Gemba - Kiem tra hien truong
          </Link>
          <Link
            href={`/reports/new?${qsReport}`}
            className="rounded border border-slate-300 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            Bao cao an toan
          </Link>
        </div>
      </div>
    </div>
  );
}
