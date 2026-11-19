import { handleEvent } from "../server/notify.js";

export async function POST(request) { return handleEvent(request); }
export async function GET() { return new Response("Método no permitido.", { status: 405, headers: { Allow: "POST" } }); }
