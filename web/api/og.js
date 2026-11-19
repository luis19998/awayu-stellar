import { handleOg } from "../server/og.js";

export async function GET(request) { return handleOg(request); }
export async function POST() { return new Response("Método no permitido.", { status: 405, headers: { Allow: "GET" } }); }
