const encoder = new TextEncoder();

function cryptoApi() {
  if (!globalThis.crypto?.subtle) throw new Error("Web Crypto is unavailable");
  return globalThis.crypto;
}

export function toHex(bytes) {
  return Array.from(new Uint8Array(bytes), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function sha256(text) {
  return toHex(await cryptoApi().subtle.digest("SHA-256", encoder.encode(String(text))));
}

export async function sha256File(file) {
  if (!file || typeof file.arrayBuffer !== "function") throw new TypeError("Expected a File or Blob");
  return toHex(await cryptoApi().subtle.digest("SHA-256", await file.arrayBuffer()));
}
