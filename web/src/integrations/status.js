import { earnOverview } from "./pollar-earn.js";

export async function integrationStatus({ pollarClient, trustlessKey } = {}) {
  const pollar = Boolean(pollarClient);
  const earn = pollar ? await earnOverview(pollarClient) : { available: false, reason: "Pollar no está configurado." };
  const trustless = Boolean(trustlessKey);
  return {
    pollar: { active: pollar, reason: pollar ? null : "Falta VITE_POLLAR_KEY." },
    earn: { active: earn.available, reason: earn.available ? null : earn.reason },
    trustless: {
      active: trustless,
      reason: trustless ? null : "Falta la clave de Trustless Work; debe usarse desde un backend seguro.",
    },
    ecosystemActive: pollar || trustless,
  };
}
