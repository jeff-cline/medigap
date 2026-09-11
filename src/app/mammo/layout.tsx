// Scopes the light consumer styling for mammo.express. The Core's global form
// rules are written for its dark dashboard; see the .mx block in globals.css.
export default function MammoLayout({ children }: { children: React.ReactNode }) {
  return <div className="mx">{children}</div>;
}
