import { destroyManagerSession } from "@/lib/mammo-auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  await destroyManagerSession();
  return Response.redirect(new URL("/manager/login", req.url), 303);
}
