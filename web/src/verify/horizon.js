export const DEFAULT_HORIZON = "https://horizon-testnet.stellar.org";
export const labUrl = (id) => `https://lab.stellar.org/smart-contracts/contract-explorer?$=network$id=testnet&label=Testnet&horizonUrl=https:////horizon-testnet.stellar.org&rpcUrl=https:////soroban-testnet.stellar.org&passphrase=Test%20SDF%20Network%20/;%20September%202015;&smartContracts$explorer$contractId=${encodeURIComponent(id)};;`;
export const STELLAR_EXPERT = "https://api.stellar.expert/explorer/testnet";

export function createHorizonClient({ baseUrl = DEFAULT_HORIZON, fetchImpl = globalThis.fetch } = {}) {
  const base = String(baseUrl).replace(/\/$/, "");
  async function get(url, { notFound = false } = {}) {
    let response;
    try {
      response = await fetchImpl(url, { headers: { Accept: "application/json" } });
    } catch (error) {
      throw new Error("Network request failed: " + (error?.message || "no response"));
    }
    if (notFound && response.status === 404) return null;
    if (!response.ok) {
      const error = new Error(response.status === 404 ? "Not found" : "HTTP " + response.status);
      error.status = response.status;
      throw error;
    }
    return response.json();
  }
  return {
    async latestLedger() {
      const data = await get(base + "/ledgers?order=desc&limit=1");
      const record = data?._embedded?.records?.[0];
      if (!record) throw new Error("Horizon returned no ledgers");
      return { sequence: Number(record.sequence), hash: record.hash, closedAt: record.closed_at };
    },
    async ledger(sequence) {
      const row = await get(base + "/ledgers/" + encodeURIComponent(sequence), { notFound: true });
      return row ? { sequence: Number(row.sequence), hash: row.hash, closedAt: row.closed_at } : null;
    },
    transaction(hash) {
      return get(base + "/transactions/" + encodeURIComponent(hash), { notFound: true });
    },
    async operations(hash) {
      const data = await get(base + "/transactions/" + encodeURIComponent(hash) + "/operations?order=asc&limit=200");
      return data?._embedded?.records ?? [];
    },
    account(address) {
      return get(base + "/accounts/" + encodeURIComponent(address), { notFound: true });
    },
    contractInfo(contractId) {
      return get(STELLAR_EXPERT + "/contract/" + encodeURIComponent(contractId), { notFound: true });
    },
  };
}

export function horizonUrl(deployment = {}) {
  if (deployment.horizon || deployment.horizonUrl) return deployment.horizon || deployment.horizonUrl;
  if (/horizon/i.test(deployment.rpc || "")) return deployment.rpc;
  return DEFAULT_HORIZON;
}
