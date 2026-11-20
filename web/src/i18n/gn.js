// Traducción automática revisable por hablantes nativos
import en from "./en.js";

const GN = {
  "Ayni · ayuda mutua": "Ayni · pytyvõ ojupe",
  "Ayuda mutua: un fondo común para emergencias, con votación de la comunidad.": "Ayni: viru oñondivegua ha aty oiporavo hag̃ua.",
  "A tiempo": "Hi'árape", "Tarde": "Tardépe", "Miembros": "Atygua", "Comunidad": "Aty",
  "Conectar billetera": "Billetera digital mbojoaju", "Conecta tu billetera": "Embojoaju nde billetera digital",
  "Dinero": "Viru", "dinero": "viru", "Ayuda": "Pytyvõ", "Simulador": "Techaukaha",
  "Crear círculo": "Ejapo pasanaku", "Ronda": "Jere", "Cuota": "Jehepyme'ẽ", "Pozo": "Viru oñembyatýva",
  "Aportar": "Eme'ẽ", "Compartir enlace": "Emboja'o joajuha", "Cerrar": "Emboty", "Abrir": "Eipe'a",
  "Pasaporte": "Pasaporte", "Billetera": "Billetera digital",
};
export default Object.fromEntries(Object.keys(en).map((key) => [key, GN[key] ?? key]));
