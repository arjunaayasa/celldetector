import type { Summary } from "@/lib/types";

type ResultSummaryProps = {
  summary: Summary | null;
};

const summaryItems = [
  {
    key: "total",
    label: "Total Sel",
    valueClass: "text-slate-950",
    percentKey: null,
  },
  {
    key: "normal",
    label: "Normal",
    valueClass: "text-emerald-700",
    percentKey: "normal_percentage",
  },
  {
    key: "abnormal",
    label: "Abnormal",
    valueClass: "text-red-700",
    percentKey: "abnormal_percentage",
  },
  {
    key: "uncertain",
    label: "Tidak Pasti",
    valueClass: "text-amber-700",
    percentKey: "uncertain_percentage",
  },
] as const;

export function ResultSummary({ summary }: ResultSummaryProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="mb-5 flex items-start justify-between gap-4">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Ringkasan</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Ringkasan morfologi berbasis aturan dari Cellpose dan OpenCV.
          </p>
        </div>
      </div>

      {summary ? (
        <div className="grid grid-cols-2 gap-3">
          {summaryItems.map((item) => {
            const value = summary[item.key];
            const percentage = item.percentKey ? summary[item.percentKey] : null;

            return (
              <div
                key={item.key}
                className="rounded-md border border-slate-200 bg-slate-50 px-4 py-4"
              >
                <div className="text-xs font-medium uppercase tracking-[0.08em] text-slate-500">
                  {item.label}
                </div>
                <div className={`mt-2 text-3xl font-semibold ${item.valueClass}`}>
                  {value}
                </div>
                {percentage !== null ? (
                  <div className="mt-1 text-sm text-slate-500">
                    {percentage.toFixed(2)}%
                  </div>
                ) : (
                  <div className="mt-1 text-sm text-slate-500">Objek terdeteksi</div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm leading-6 text-slate-500">
          Ringkasan analisis akan tampil setelah gambar diproses.
        </div>
      )}
    </section>
  );
}
