/**
 * Rutas REST centralizadas para poder ajustarlas sin tocar las operaciones.
 * Los nombres exactos de endpoints y payloads deben confirmarse contra
 * https://docs.trustlesswork.com antes de activar en producción.
 */
export const TRUSTLESS_ROUTES = Object.freeze({
  create: "/deployer/single-release",
  fund: "/escrow/single-release/fund-escrow",
  release: "/escrow/single-release/release-funds",
  get: (contractId) => `/escrow/single-release/${encodeURIComponent(contractId)}`,
});

const unavailable = (reason) => ({ available: false, reason });

async function request({ apiKey, baseUrl, path, method = "GET", body }) {
  if (!apiKey) return unavailable("Falta configurar la clave de Trustless Work.");
  try {
    const response = await fetch(new URL(path, baseUrl), {
      method,
      headers: { "content-type": "application/json", "x-api-key": apiKey },
      ...(body === undefined ? {} : { body: JSON.stringify(body) }),
    });
    const data = await response.json().catch(() => null);
    if (!response.ok) return unavailable(data?.message || `Trustless Work respondió HTTP ${response.status}.`);
    return { available: true, ...data };
  } catch (error) {
    return unavailable(error?.message || "No se pudo conectar con Trustless Work.");
  }
}

/** Solicita XDR sin firmar; la billetera del usuario debe firmarlo. */
export function createGuaranteeEscrow({
  apiKey,
  baseUrl = "https://dev.api.trustlesswork.com",
  signer,
  receiver,
  amount,
  title,
} = {}) {
  return request({
    apiKey,
    baseUrl,
    path: TRUSTLESS_ROUTES.create,
    method: "POST",
    body: { signer, receiver, amount, title, milestones: [{ description: title, amount }] },
  });
}

export function fundEscrow({ apiKey, baseUrl = "https://dev.api.trustlesswork.com", contractId, signer, amount } = {}) {
  return request({ apiKey, baseUrl, path: TRUSTLESS_ROUTES.fund, method: "POST", body: { contractId, signer, amount } });
}

export function releaseEscrow({ apiKey, baseUrl = "https://dev.api.trustlesswork.com", contractId, releaseSigner } = {}) {
  return request({ apiKey, baseUrl, path: TRUSTLESS_ROUTES.release, method: "POST", body: { contractId, releaseSigner } });
}

export function getEscrow({ apiKey, baseUrl = "https://dev.api.trustlesswork.com", contractId } = {}) {
  if (!apiKey) return Promise.resolve(unavailable("Falta configurar la clave de Trustless Work."));
  if (!contractId) return Promise.resolve(unavailable("Falta el identificador del escrow."));
  return request({ apiKey, baseUrl, path: TRUSTLESS_ROUTES.get(contractId) });
}
