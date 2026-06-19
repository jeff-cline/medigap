// Played to the agent (not the caller) when they answer, so they know it's our call.
export async function POST() {
  return new Response(
    `<?xml version="1.0" encoding="UTF-8"?><Response><Say voice="alice">Medigap dot plus inbound call. Connecting the caller now.</Say></Response>`,
    { headers: { "Content-Type": "text/xml" } }
  );
}
