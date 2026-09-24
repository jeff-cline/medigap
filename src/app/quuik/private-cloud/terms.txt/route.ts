import { TERMS } from "../legal";

export function GET() {
  return new Response(TERMS, {
    headers: {
      "Content-Type": "text/plain; charset=utf-8",
      "Content-Disposition": 'attachment; filename="private-cloud-terms.txt"',
    },
  });
}
