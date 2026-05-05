"use client";

type UploadPanelProps = {
  selectedFile: File | null;
  previewUrl: string | null;
  isLoading: boolean;
  error: string | null;
  onFileChange: (file: File | null) => void;
  onAnalyze: () => void;
};

export function UploadPanel({
  selectedFile,
  previewUrl,
  isLoading,
  error,
  onFileChange,
  onAnalyze,
}: UploadPanelProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="mb-5">
        <h2 className="text-lg font-semibold text-slate-950">Unggah Gambar</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Gambar mikroskop JPG atau PNG. Hasil hanya untuk edukasi visual.
        </p>
      </div>

      <label className="block">
        <span className="mb-2 block text-sm font-medium text-slate-800">
          Gambar mikroskop
        </span>
        <input
          type="file"
          accept="image/png,image/jpeg"
          disabled={isLoading}
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
          className="block w-full rounded-md border border-slate-300 bg-white text-sm text-slate-700 file:mr-4 file:border-0 file:bg-slate-100 file:px-4 file:py-3 file:text-sm file:font-medium file:text-slate-800 hover:file:bg-slate-200 disabled:cursor-not-allowed disabled:opacity-60"
        />
      </label>

      <div className="mt-5 overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
        {previewUrl ? (
          <img
            src={previewUrl}
            alt="Pratinjau gambar mikroskop sel darah merah yang dipilih"
            className="h-[280px] w-full object-contain"
          />
        ) : (
          <div className="flex h-[280px] items-center justify-center px-6 text-center text-sm text-slate-500">
            Pratinjau akan tampil setelah gambar dipilih.
          </div>
        )}
      </div>

      {selectedFile ? (
        <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 px-3 py-2 text-sm text-slate-700">
          <span className="font-medium text-slate-900">Dipilih:</span>{" "}
          {selectedFile.name}
        </div>
      ) : null}

      {error ? (
        <div className="mt-4 rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </div>
      ) : null}

      <button
        type="button"
        disabled={!selectedFile || isLoading}
        onClick={onAnalyze}
        className="mt-5 inline-flex w-full items-center justify-center rounded-md bg-medical-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-medical-700 active:translate-y-px disabled:cursor-not-allowed disabled:bg-slate-300"
      >
        {isLoading ? "Menganalisis gambar..." : "Analisis Gambar"}
      </button>
    </section>
  );
}
