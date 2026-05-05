"use client";

import { useState } from "react";

import type { CellResult } from "@/lib/types";
import { buildResultImageUrl, exportResultImage } from "@/lib/api";

type MarkedImageProps = {
  markedImageUrl: string;
  selectedCell: CellResult | null;
};

const legend = [
  { label: "Normal", className: "bg-emerald-500" },
  { label: "Abnormal", className: "bg-red-500" },
  { label: "Tidak Pasti", className: "bg-amber-500" },
];

export function MarkedImage({ markedImageUrl, selectedCell }: MarkedImageProps) {
  const selectedBox = selectedCell?.bbox;
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [isExporting, setIsExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const canShowHighlight =
    selectedBox && naturalSize.width > 0 && naturalSize.height > 0;

  async function handleExport() {
    setIsExporting(true);
    setExportError(null);

    try {
      await exportResultImage(markedImageUrl);
    } catch (error) {
      setExportError(
        error instanceof Error ? error.message : "Gagal mengekspor gambar hasil.",
      );
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <section
      id="marked-image-section"
      className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel"
    >
      <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Gambar Hasil Marker</h2>
          <p className="mt-1 text-sm leading-6 text-slate-600">
            Garis kontur berwarna digambar di area sel yang terdeteksi.
          </p>
          {selectedCell ? (
            <p className="mt-1 text-sm font-medium text-medical-700">
              Menyorot sel #{selectedCell.cell_id}
            </p>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 md:items-end">
          <div className="flex flex-wrap gap-3">
            {legend.map((item) => (
              <div key={item.label} className="flex items-center gap-2 text-sm text-slate-700">
                <span className={`h-3 w-3 rounded-sm ${item.className}`} />
                <span>{item.label}</span>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={handleExport}
            disabled={isExporting}
            className="inline-flex items-center justify-center rounded-md border border-medical-200 bg-medical-50 px-4 py-2 text-sm font-semibold text-medical-700 transition hover:bg-medical-100 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isExporting ? "Mengekspor..." : "Ekspor Gambar"}
          </button>
        </div>
      </div>

      {exportError ? (
        <div className="mb-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {exportError}
        </div>
      ) : null}

      <div className="overflow-x-auto rounded-lg border border-slate-200 bg-slate-50">
        <div className="relative mx-auto max-w-full">
        <img
          src={buildResultImageUrl(markedImageUrl)}
          alt="Hasil marker morfologi sel darah merah"
          onLoad={(event) => {
            setNaturalSize({
              width: event.currentTarget.naturalWidth,
              height: event.currentTarget.naturalHeight,
            });
          }}
          className="block h-auto w-full"
        />
        {canShowHighlight ? (
          <div
            aria-hidden="true"
            className="pointer-events-none absolute border-2 border-medical-600 bg-medical-500/10 shadow-[0_0_0_9999px_rgba(15,23,42,0.18)]"
            style={{
              left: `${(selectedBox.x / naturalSize.width) * 100}%`,
              top: `${(selectedBox.y / naturalSize.height) * 100}%`,
              width: `${(selectedBox.w / naturalSize.width) * 100}%`,
              height: `${(selectedBox.h / naturalSize.height) * 100}%`,
            }}
          />
        ) : null}
        </div>
      </div>
    </section>
  );
}
