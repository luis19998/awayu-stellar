// Traducción automática revisable por hablantes nativos
import en from "./en.js";

const AY = {
  "Ayni · ayuda mutua": "Ayni · yanapaña",
  "Ayuda mutua: un fondo común para emergencias, con votación de la comunidad.": "Ayni: qullqi tantachawi ukhamaraki ayllu amuyt'awi.",
  "A tiempo": "Pachaparu", "Tarde": "Qhiparu", "Miembros": "Ayllu jaqinaka", "Comunidad": "Ayllu",
  "Conectar billetera": "Billetera digital ukaru mantaña", "Conecta tu billetera": "Billetera digital ukaru mantaña",
  "Dinero": "Qullqi", "dinero": "qullqi", "Ayuda": "Yanapaña", "Simulador": "Uñacht'awi",
  "Crear círculo": "Pasanaku luraña", "Ronda": "Mita", "Cuota": "Qullqi churaña", "Pozo": "Tantachata qullqi",
  "Aportar": "Qullqi churaña", "Compartir enlace": "Chinuñapa jaljaña", "Cerrar": "Jist'antaña", "Abrir": "Jist'araña",
  "Pasaporte": "Pasaporte", "Billetera": "Billetera digital",
};
export default Object.fromEntries(Object.keys(en).map((key) => [key, AY[key] ?? key]));
