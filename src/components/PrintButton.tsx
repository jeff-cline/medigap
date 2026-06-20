"use client";
export default function PrintButton() {
  return <button onClick={() => window.print()} className="btn btn-brand text-sm">🖨 Print / Save as PDF</button>;
}
