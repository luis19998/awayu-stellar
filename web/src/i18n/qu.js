// Traducción automática revisable por hablantes nativos
import en from "./en.js";

const QU = {
  "Ayni · ayuda mutua": "Ayni · yanapana",
  "Ayuda mutua: un fondo común para emergencias, con votación de la comunidad.": "Ayni: llakikunapaq qullqi huñusqa, ayllu akllasqanwan.",
  "A tiempo": "Pacha chaypi", "Tarde": "Qhipa", "Miembros": "Ayllu runakuna", "Comunidad": "Ayllu",
  "Conectar billetera": "Billetera digital tinkiy", "Conecta tu billetera": "Billetera digital tinkiy",
  "Dinero": "Qullqi", "dinero": "qullqi", "Ayuda": "Yanapay", "Simulador": "Yachay rikuchiq",
  "Crear círculo": "Pasanaku ruwana", "Ronda": "Mita", "Cuota": "Qullqi churasqa", "Pozo": "Huñusqa qullqi",
  "Aportar": "Qullqi churay", "Compartir enlace": "Tinkina rakiy", "Cerrar": "Wichqay", "Abrir": "Kichay",
  "Pasaporte": "Pasaporte", "Billetera": "Billetera digital", "Cancel": "Sayachiy",
};
export default Object.fromEntries(Object.keys(en).map((key) => [key, QU[key] ?? key]));
