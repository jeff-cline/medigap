import { PRIVACY } from "../legal";

export function GET() {
  return new Response(PRIVACY, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="private-cloud-privacy.txt"',
    },
  });
}
