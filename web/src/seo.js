const SITE_URL = "https://awayu-pasanaku.netlify.app";

export function structuredData() {
  const organization = {
    "@type": "Organization",
    name: "Awayu",
    url: SITE_URL,
    description: "Pasanaku rotativo en Stellar con historial de aportes portable.",
  };
  const software = {
    "@type": "SoftwareApplication",
    name: "Awayu",
    applicationCategory: "FinanceApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description: "Organizá un pasanaku, registrá aportes y consultá el historial de tu círculo en Stellar.",
    publisher: { "@type": "Organization", name: organization.name, url: SITE_URL },
    offers: { "@type": "Offer", price: "0", priceCurrency: "BOB" },
  };
  const faqs = [
    ["¿Qué es Awayu?", "Awayu es una herramienta para organizar un pasanaku rotativo y registrar sus reglas y aportes en Stellar."],
    ["¿Cómo funciona un pasanaku?", "Cada integrante aporta una cuota por ronda y el pozo se entrega por turnos según las reglas del círculo."],
    ["¿Qué es la garantía?", "Es un monto de respaldo que puede cubrir una cuota impaga según las reglas del contrato."],
    ["¿Qué significa la demo en testnet?", "La demo usa la red de prueba de Stellar y activos sin valor real; sirve para experimentar."],
    ["¿El puntaje garantiza un crédito?", "No. El puntaje resume marcas históricas de aportes y no garantiza un préstamo ni una aprobación crediticia."],
  ].map(([question, answer]) => ({ "@type": "Question", name: question, acceptedAnswer: { "@type": "Answer", text: answer } }));

  return {
    "@context": "https://schema.org",
    "@graph": [organization, software, { "@type": "FAQPage", mainEntity: faqs }],
  };
}
