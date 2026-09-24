"use client";
export default function LogoutLink() {
  return (
    <button
      onClick={async () => { try { await fetch("/api/auth/logout", { method: "POST" }); } catch {} location.href = "https://quuik.com/"; }}
      style={{ background: "transparent", border: "1px solid #26324a", color: "#9fb3cc", borderRadius: 8, padding: "6px 12px", fontSize: 12, cursor: "pointer", width: "100%" }}
    >Log out</button>
  );
}
