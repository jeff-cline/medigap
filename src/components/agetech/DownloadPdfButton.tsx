"use client";
// Triggers the browser's print dialog → "Save as PDF" (the one-sheet is print-formatted).
export default function DownloadPdfButton({ className = "" }: { className?: string }) {
  return (
    <button onClick={() => window.print()} className={`ag-btn ag-btn-primary ${className}`}>
      ⬇ Download PDF
    </button>
  );
}
