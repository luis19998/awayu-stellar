// Guion del video de pitch de Awayu (3 minutos): una escena por bloque de narración.
// Cada escena tiene su texto (voz), un rótulo (lower third) y una insignia de capítulo.
export const VOICE = "es-BO-SofiaNeural";
export const RATE = "+4%";

export const SCENES = [
  {
    id: "s01_problema", badge: "El problema",
    lower: { title: "Awayu", sub: "Finanzas comunitarias andinas en Stellar" },
    text: "En Bolivia, el ahorro y la ayuda se hacen en comunidad. El pasanaku, el ayni, la minka y las alasitas mueven la economía de millones de familias. Pero toda esa confianza no deja rastro: quien cumple durante años no tiene cómo demostrarlo.",
  },
  {
    id: "s02_solucion", badge: "La solución",
    lower: { title: "Cuatro tradiciones, un solo tejido", sub: "Contratos Soroban · dólares digitales · historial verificable" },
    text: "Awayu lleva estas cuatro tradiciones a Stellar. Las reglas viven en contratos Soroban, los aportes se hacen en dólares digitales, y cada compromiso cumplido teje un aguayo: un historial portable y verificable.",
  },
  {
    id: "s03_pasanaku", badge: "Pasanaku",
    lower: { title: "Pasanaku en 3D", sub: "Turno sorteado por la red · garantía que cubre a quien falla" },
    text: "En el pasanaku, todos aportan y, por turno, alguien recibe el pozo. El orden lo sortea la red, no el organizador. Si alguien no paga, su garantía cubre la cuota, y quien cobra recibe el pozo completo. Cada ronda deja una marca en el aguayo: a tiempo, tarde, faltó o cubierto.",
  },
  {
    id: "s04_personalizar", badge: "Pasanaku",
    lower: { title: "Hecho para la comunidad", sub: "36 personajes · 6 escenarios de Bolivia · aguayos" },
    text: "La mesa del círculo es un mundo en 3D, con treinta y seis personajes inspirados en las alasitas y seis escenarios de Bolivia, del salar de Uyuni al lago Titicaca.",
  },
  {
    id: "s05_ayni", badge: "Ayni",
    lower: { title: "Ayni · ayuda mutua", sub: "Datos reales de Stellar testnet" },
    text: "Ayni es ayuda mutua: un fondo común para emergencias. Carla pidió para medicinas, la comunidad votó, y el contrato le prestó el dinero, que se devuelve sin intereses. Esto no es una simulación: son datos reales de Stellar testnet.",
  },
  {
    id: "s06_minka", badge: "Minka",
    lower: { title: "Minka · proyectos por hitos", sub: "Escrow comunitario programado en Soroban" },
    text: "Minka es trabajo colectivo. Un sistema de riego reunió sesenta lúmenes de prueba, y el dinero solo se libera por hitos, cuando los validadores aprueban la evidencia.",
  },
  {
    id: "s07_alasitas", badge: "Alasitas",
    lower: { title: "Alasitas · metas de ahorro", sub: "Propias o compartidas, con racha y fecha de desbloqueo" },
    text: "Y en Alasitas, como en la feria, cada miniatura es una meta de ahorro, propia o compartida: Ana ahorra para su casita en El Alto.",
  },
  {
    id: "s08_red", badge: "Reputación",
    lower: { title: "Registro, mapa y pasaporte", sub: "La reputación se lleva a cualquier cooperativa" },
    text: "Cada círculo se inscribe en un registro público. El mapa muestra la red por departamento, y el pasaporte reúne las marcas de una persona en todos sus círculos, para que una cooperativa pueda verificarlas sin pedir papeles.",
  },
  {
    id: "s09_acceso", badge: "Acceso",
    lower: { title: "Fácil desde el primer día", sub: "Pollar o Freighter · tutoriales · asistente con IA" },
    text: "Para entrar no hace falta saber de cripto: se ingresa con Pollar, usando correo o Google, o con Freighter. Hay un recorrido guiado, videos tutoriales en cada herramienta y un asistente con inteligencia artificial.",
  },
  {
    id: "s10_cierre", badge: "Awayu",
    lower: { title: "awayu-two.vercel.app", sub: "Código abierto · github.com/luis19998/awayu-stellar" },
    text: "Son cinco contratos en testnet, con pruebas en Rust y en la web, todo de código abierto. Las cooperativas pagarían por administrar círculos y emitir reportes verificables. Awayu no reemplaza la confianza de la comunidad: la convierte en evidencia. Awayu, el pasanaku que teje tu historial.",
  },
];
