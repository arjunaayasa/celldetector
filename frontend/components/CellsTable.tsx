import type { CellLabel, CellResult } from "@/lib/types";

type CellsTableProps = {
  cells: CellResult[];
  selectedCellId: number | null;
  onSelectCell: (cell: CellResult) => void;
};

const labelStyles: Record<CellLabel, string> = {
  normal: "border-emerald-200 bg-emerald-50 text-emerald-700",
  abnormal: "border-red-200 bg-red-50 text-red-700",
  uncertain: "border-amber-200 bg-amber-50 text-amber-700",
};

const labelText: Record<CellLabel, string> = {
  normal: "normal",
  abnormal: "abnormal",
  uncertain: "tidak pasti",
};

export function CellsTable({
  cells,
  selectedCellId,
  onSelectCell,
}: CellsTableProps) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-panel">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-slate-950">Sel Terdeteksi</h2>
        <p className="mt-1 text-sm leading-6 text-slate-600">
          Klik baris untuk menyorot sel terkait pada gambar hasil marker.
        </p>
      </div>

      {cells.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-300 bg-slate-50 px-4 py-8 text-sm text-slate-500">
          Tidak ada objek sel yang terdeteksi di atas batas area minimum.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-slate-200">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50 text-left text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
              <tr>
                <th className="px-3 py-3">ID Sel</th>
                <th className="px-3 py-3">Label</th>
                <th className="px-3 py-3">Kebulatan</th>
                <th className="px-3 py-3">Rasio Aspek</th>
                <th className="px-3 py-3">Soliditas</th>
                <th className="px-3 py-3">BBox</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {cells.map((cell) => {
                const selected = selectedCellId === cell.cell_id;

                return (
                <tr
                  key={cell.cell_id}
                  tabIndex={0}
                  onClick={() => onSelectCell(cell)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" || event.key === " ") {
                      event.preventDefault();
                      onSelectCell(cell);
                    }
                  }}
                  className={`cursor-pointer outline-none transition hover:bg-slate-50 focus:bg-medical-50 ${
                    selected ? "bg-medical-50 ring-1 ring-inset ring-medical-200" : ""
                  }`}
                >
                  <td className="whitespace-nowrap px-3 py-3 font-medium text-slate-900">
                    {cell.cell_id}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3">
                    <span
                      className={`rounded-full border px-2 py-1 text-xs font-semibold ${labelStyles[cell.label]}`}
                    >
                      {labelText[cell.label]}
                    </span>
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-slate-700">
                    {cell.metrics.circularity.toFixed(3)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-slate-700">
                    {cell.metrics.aspect_ratio.toFixed(3)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-slate-700">
                    {cell.metrics.solidity.toFixed(3)}
                  </td>
                  <td className="whitespace-nowrap px-3 py-3 font-mono text-slate-600">
                    x:{cell.bbox.x} y:{cell.bbox.y} w:{cell.bbox.w} h:{cell.bbox.h}
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
