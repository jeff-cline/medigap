// Renders an answer with citations woven between the paragraphs — a favicon that matches the
// destination site next to each source (single → favicon + title; multiple → favicon row).
// No hooks, so it works in both server pages and the client search box.
import { interleave, type Cite } from "@/lib/answer-format";

const MUT = "#6b7280", INK = "#1c2128";

export default function AnswerBody({ answer, citations }: { answer: string; citations: Cite[] }) {
  const blocks = interleave(answer, citations || []);
  if (!blocks.length) return null;
  return (
    <div style={{ background: "#faf9f7", border: "1px solid #eee", borderRadius: 16, padding: "22px 24px" }}>
      {blocks.map((b, i) => (
        <div key={i} style={{ marginBottom: i < blocks.length - 1 ? 16 : 0 }}>
          <p style={{ margin: 0, fontSize: 16, lineHeight: 1.65, color: INK, whiteSpace: "pre-wrap" }}>{b.text}</p>
          {b.cites.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 8, marginTop: 9 }}>
              {b.cites.map((c, j) => (
                <a key={j} href={c.url} target="_blank" rel="noopener sponsored" title={c.title}
                   style={{ display: "inline-flex", alignItems: "center", gap: 7, textDecoration: "none", color: MUT, fontSize: 12.5, fontWeight: 600, background: "#fff", border: "1px solid #eee", borderRadius: 100, padding: "3px 11px 3px 4px", maxWidth: "100%" }}>
                  <img src={c.favicon} alt="" width={16} height={16} style={{ borderRadius: 4, display: "block", flex: "none" }} />
                  <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{c.title}</span>
                </a>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
