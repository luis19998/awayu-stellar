const unavailable = (reason) => ({ available: false, reason });

function errorReason(error) {
  return error?.message || error?.error?.message || error?.details || "No se pudo completar la operación con Pollar.";
}

function txFailed(outcome) {
  return outcome?.status === "error" || outcome?.success === false || Boolean(outcome?.error);
}

function normalizeOpportunity(provider, opportunity) {
  return {
    id: opportunity.id,
    provider: opportunity.provider || provider,
    name: opportunity.name || opportunity.id,
    symbol: opportunity.symbol ?? null,
    kind: opportunity.kind || null,
    asset: opportunity.asset || null,
    apy: Number(opportunity.apy),
    metadata: opportunity.metadata || {},
  };
}

/** Lee los proveedores y APY de Earn en vivo; no proyecta rendimientos. */
export async function earnOverview(client) {
  if (!client?.getEarnProviders || !client?.getEarnOpportunities) return unavailable("Pollar Earn no está disponible.");
  try {
    const providers = await client.getEarnProviders();
    if (!Array.isArray(providers) || providers.length === 0) return unavailable("Earn está deshabilitado para esta aplicación.");
    const opportunities = (await Promise.all(providers.map(async (provider) => {
      const items = await client.getEarnOpportunities(provider);
      return (items || []).map((item) => normalizeOpportunity(provider, item));
    }))).flat();
    return { available: true, providers, opportunities };
  } catch (error) {
    return unavailable(errorReason(error));
  }
}

async function earnAction(client, method, params) {
  if (!client?.[method]) return unavailable("Pollar Earn no está disponible.");
  try {
    const providers = await client.getEarnProviders?.();
    if (Array.isArray(providers) && providers.length === 0) return unavailable("Earn está deshabilitado para esta aplicación.");
    const result = await client[method](params);
    if (txFailed(result)) return unavailable(errorReason(result));
    return { available: true, result };
  } catch (error) {
    return unavailable(errorReason(error));
  }
}

export function depositIdlePot(client, { provider, opportunity, amount } = {}) {
  return earnAction(client, "earnDeposit", { provider, opportunity, amount });
}

export function withdrawFromEarn(client, { provider, opportunity, amount } = {}) {
  return earnAction(client, "earnWithdraw", { provider, opportunity, amount });
}

export async function swapQuote(client, { from, to, amount } = {}) {
  if (!client?.getSwapQuote) return unavailable("Las cotizaciones de swap de Pollar no están disponibles.");
  try {
    const quotes = await client.getSwapQuote({ sellAsset: from, buyAsset: to, amount, provider: "auto" });
    if (!Array.isArray(quotes) || quotes.length === 0) return unavailable("No hay cotizaciones de swap para este par y monto.");
    return { available: true, quotes };
  } catch (error) {
    return unavailable(errorReason(error));
  }
}

const isBoliviaRoute = (route) =>
  route?.fiat?.currency?.toUpperCase() === "BOB" || route?.fiat?.country?.toUpperCase() === "BO";

/** Retorna corredores BOB/Bolivia si el backend expone alguno. */
export async function bolivianRamps(client) {
  if (!client?.getRampRoutes) return unavailable("Las rampas de Pollar no están disponibles.");
  try {
    const responses = await Promise.all(["ONRAMP", "OFFRAMP"].map((direction) => client.getRampRoutes(direction)));
    const allRoutes = responses.flatMap((response, index) =>
      (response?.routes || []).map((route) => ({ ...route, direction: route.direction || ["ONRAMP", "OFFRAMP"][index] })),
    );
    const routes = allRoutes.filter(isBoliviaRoute);
    return {
      available: true,
      routes,
      allRoutes,
      boliviaOnly: routes.length > 0,
      ...(routes.length ? {} : { reason: "Pollar no publica rutas BOB/Bolivia todavía." }),
    };
  } catch (error) {
    return unavailable(errorReason(error));
  }
}
