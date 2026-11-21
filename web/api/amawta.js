import { handleAmawta } from "../server/ai.js";

export async function POST(request) { return handleAmawta(request); }
export async function GET() { return new Response("Método no permitido.", { status: 405, headers: { Allow: "POST" } }); }

// Gemini puede tardar unos segundos: margen para no cortar la respuesta
export const maxDuration = 30;
