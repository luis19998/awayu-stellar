const escapeXml = (value) => String(value ?? "")
  .replace(/[\u0000-\u001f\u007f]/g, " ")
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;").replace(/'/g, "&apos;");

export function shareSvg({ contract = "", name = "Mi círculo" } = {}) {
  const safeName = escapeXml(name.slice(0, 100));
  const safeContract = escapeXml(contract.slice(0, 80));
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630" role="img" aria-labelledby="title desc">
  <title id="title">${safeName} · Awayu</title><desc id="desc">Pasanaku en Stellar</desc>
  <defs><linearGradient id="bg" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#142d27"/><stop offset="1" stop-color="#264d3e"/></linearGradient></defs>
  <rect width="1200" height="630" rx="36" fill="url(#bg)"/>
  <g transform="translate(92 108)"><path d="M76 0 152 76 76 152 0 76Z" fill="#e7a94b"/><path d="m76 25 51 51-51 51-51-51Z" fill="#d96c49"/><path d="m76 50 26 26-26 26-26-26Z" fill="#f4dfaa"/><path d="m15 76 61-61 61 61-61 61Z" fill="none" stroke="#f4dfaa" stroke-width="5"/></g>
  <text x="278" y="206" fill="#f4dfaa" font-family="Arial,sans-serif" font-size="42" font-weight="700" letter-spacing="8">AWAYU</text>
  <text x="92" y="365" fill="#fffaf0" font-family="Arial,sans-serif" font-size="64" font-weight="700">${safeName}</text>
  <text x="96" y="440" fill="#e7a94b" font-family="Arial,sans-serif" font-size="34">Pasanaku en Stellar</text>
  ${safeContract ? `<text x="96" y="548" fill="#c5d4c7" font-family="monospace" font-size="18">${safeContract}</text>` : ""}
  <path d="M96 485h1008" stroke="#78917d" stroke-opacity=".6" stroke-width="2"/>
</svg>`;
}

export function handleOg(request) {
  if (request.method !== "GET") return Response.json({ error: "Método no permitido." }, { status: 405, headers: { Allow: "GET" } });
  const url = new URL(request.url);
  const svg = shareSvg({ contract: url.searchParams.get("c") || "", name: url.searchParams.get("n") || "Mi círculo" });
  return new Response(svg, { status: 200, headers: {
    "content-type": "image/svg+xml; charset=utf-8",
    "cache-control": "public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800",
    "x-content-type-options": "nosniff",
  } });
}
