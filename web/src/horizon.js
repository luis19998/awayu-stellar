const DEFAULT_HORIZON = "https://horizon-testnet.stellar.org";

/** Convert Horizon's different error shapes into a safe, consistent error. */
export function normalizeError(error, response) {
  const status = response?.status ?? error?.status ?? null;
  const body = error?.response?.data ?? error?.response ?? error;
  const extras = body?.extras?.result_codes ?? body?.extras ?? {};
  const message = status === 404
    ? "Account not found on Stellar Horizon"
    : body?.detail ?? body?.title ?? body?.message ?? error?.message ?? "Horizon request failed";
  return Object.assign(new Error(String(message)), {
    name: "HorizonError",
    status,
    code: extras.transaction ?? extras.operation ?? body?.type ?? null,
  });
}

export function normalizeAccount(data) {
  return {
    exists: true,
    address: data.account_id,
    sequence: String(data.sequence),
    signers: Array.isArray(data.signers) ? data.signers.length : 0,
    balances: (data.balances ?? []).map((balance) => ({
      asset: balance.asset_type === "native" ? "XLM" : `${balance.asset_code}${balance.asset_issuer ? `:${balance.asset_issuer}` : ""}`,
      code: balance.asset_type === "native" ? "XLM" : balance.asset_code,
      issuer: balance.asset_issuer ?? null,
      balance: String(balance.balance),
    })),
  };
}

export function normalizePayment(record) {
  const asset = record.asset_type === "native"
    ? "XLM"
    : `${record.asset_code ?? record.asset_type ?? "unknown"}${record.asset_issuer ? `:${record.asset_issuer}` : ""}`;
  return {
    id: String(record.id ?? record.paging_token ?? ""),
    type: record.type ?? "payment",
    amount: String(record.amount ?? "0"),
    asset,
    from: record.from ?? record.source_account ?? null,
    to: record.to ?? record.account ?? null,
    at: record.created_at ?? null,
    txHash: record.transaction_hash ?? record.transaction?.hash ?? null,
  };
}

export function normalizeLedger(record = {}) {
  return {
    sequence: Number(record.sequence ?? record.id ?? 0),
    operations: Number(record.operation_count ?? record.operations ?? 0),
    transactions: Number(record.transaction_count ?? record.transactions ?? 0),
    closedAt: record.closed_at ?? null,
  };
}

function accountUrl(address) {
  return `/accounts/${encodeURIComponent(address)}`;
}

function makeClient({ baseUrl = DEFAULT_HORIZON, fetchImpl = globalThis.fetch, EventSourceImpl = globalThis.EventSource } = {}) {
  const base = baseUrl.replace(/\/$/, "");
  async function request(path) {
    let response;
    try {
      response = await fetchImpl(`${base}${path}`, { headers: { Accept: "application/json" } });
    } catch (error) {
      throw normalizeError(error);
    }
    if (!response.ok) {
      let body = {};
      try { body = await response.json(); } catch { /* Horizon may return no JSON body. */ }
      if (response.status === 404) return { notFound: true };
      throw normalizeError(body, response);
    }
    return response.json();
  }

  return {
    async loadAccount(address) {
      const result = await request(accountUrl(address));
      return result.notFound ? { exists: false } : normalizeAccount(result);
    },
    async recentPayments(address, limit = 20) {
      const safeLimit = Math.max(1, Math.min(200, Math.floor(Number(limit) || 20)));
      const result = await request(`${accountUrl(address)}/payments?order=desc&limit=${safeLimit}&include_failed=false`);
      return (result._embedded?.records ?? []).map(normalizePayment);
    },
    streamPayments(address, onPayment) {
      if (!EventSourceImpl) throw normalizeError(new Error("EventSource is unavailable"));
      const source = new EventSourceImpl(`${base}${accountUrl(address)}/payments?cursor=now`);
      const receive = (event) => {
        try { onPayment(normalizePayment(JSON.parse(event.data))); } catch { /* Ignore malformed stream events. */ }
      };
      source.onmessage = receive;
      source.addEventListener?.("payment", receive);
      return Object.assign(() => source.close(), { source });
    },
    streamLedgers(onLedger) {
      if (!EventSourceImpl) throw normalizeError(new Error("EventSource is unavailable"));
      const source = new EventSourceImpl(`${base}/ledgers?cursor=now`);
      const receive = (event) => {
        try { onLedger(normalizeLedger(JSON.parse(event.data))); } catch { /* Ignore malformed stream events. */ }
      };
      source.onmessage = receive;
      source.addEventListener?.("ledger", receive);
      return Object.assign(() => source.close(), { source });
    },
  };
}

const client = makeClient();
export const loadAccount = (...args) => client.loadAccount(...args);
export const recentPayments = (...args) => client.recentPayments(...args);
export const streamPayments = (...args) => client.streamPayments(...args);
export const streamLedgers = (...args) => client.streamLedgers(...args);
export { makeClient, DEFAULT_HORIZON };
