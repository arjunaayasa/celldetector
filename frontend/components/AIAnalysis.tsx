import type { AIAnalysis as AIAnalysisType, CellLabel } from "@/lib/types";

type AIAnalysisProps = {
  analysis: AIAnalysisType;
};

const statusStyles: Record<CellLabel, string> = {
  normal: "border-emerald-200 bg-emerald-50 text-emerald-700",
  abnormal: "border-red-200 bg-red-50 text-red-700",
  uncertain: "border-amber-200 bg-amber-50 text-amber-700",
};

const statusLabels: Record<CellLabel, string> = {
  normal: "normal",
  abnormal: "abnormal",
  uncertain: "tidak pasti",
};

function formatConfidence(confidence: number): string {
  if (!Number.isFinite(confidence)) {
    return "0%";
  }

  const normalized = confidence <= 1 ? confidence * 100 : confidence;
  return `${Math.round(normalized)}%`;
}

function isAiWarning(analysis: AIAnalysisType): boolean {
  const text = analysis.visual_reasoning.toLowerCase();
  return (
    analysis.confidence === 0 ||
    text.includes("ollama") ||
    text.includes("tidak tersedia") ||
    text.includes("gagal")
  );
}

export function AIAnalysis({ analysis }: AIAnalysisProps) {
  const warning = isAiWarning(analysis);

  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Analisis Visual AI</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Tinjauan visual dari Ollama memakai gambar dan ringkasan berbasis aturan.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <span
            className={`rounded-full border px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] ${
              statusStyles[analysis.overall_status]
            }`}
          >
            {statusLabels[analysis.overall_status]}
          </span>
          <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.08em] text-slate-600">
            keyakinan {formatConfidence(analysis.confidence)}
          </span>
        </div>
      </div>

      {warning ? (
        <div className="mb-4 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
          Analisis AI mungkin tidak lengkap. Segmentasi dan gambar marker tetap tersedia.
        </div>
      ) : null}

      <div className="grid gap-4">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Penalaran Visual</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {analysis.visual_reasoning}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-slate-900">Rekomendasi</h3>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            {analysis.recommendation}
          </p>
        </div>

        <div className="rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm leading-6 text-slate-600">
          {analysis.medical_disclaimer}
        </div>
      </div>
    </section>
  );
}
