// Estilos de aguayo que el círculo puede elegir. Son paletas inspiradas en
// tejidos de distintas regiones de Bolivia, no reproducciones de piezas
// tradicionales concretas.
export const THEMES = {
  cochabamba: {
    label: "Valle (Cochabamba)",
    palette: {
      magenta: "#d81b60", rojo: "#a3122a", naranja: "#f57c1f", amarillo: "#f9c22e", verde: "#1f9d55",
      turquesa: "#13a3b0", azul: "#283c9c", morado: "#5b2a86", crema: "#f3e6c8", negro: "#15101c",
    },
  },
  tarabuco: {
    label: "Rojo y negro (inspirado en Tarabuco)",
    palette: {
      magenta: "#b3202a", rojo: "#7d1418", naranja: "#e0562b", amarillo: "#f2c14e", verde: "#2f6b4f",
      turquesa: "#e9dfc9", azul: "#1c1a24", morado: "#4a1c2a", crema: "#f4ead6", negro: "#120c0e",
    },
  },
  altiplano: {
    label: "Lana natural (Altiplano)",
    palette: {
      magenta: "#8c4a3c", rojo: "#5e3a2b", naranja: "#b9773e", amarillo: "#d8b77a", verde: "#5f6b3d",
      turquesa: "#6f8f99", azul: "#2f3d5c", morado: "#4b3a4f", crema: "#efe3cc", negro: "#1d1712",
    },
  },
  potosi: {
    label: "Vivos (Norte de Potosí)",
    palette: {
      magenta: "#ff2d8a", rojo: "#c4123f", naranja: "#ff8a00", amarillo: "#ffe100", verde: "#00b86b",
      turquesa: "#00c2d1", azul: "#3048ff", morado: "#8a2be2", crema: "#fff2d8", negro: "#14081e",
    },
  },
};

export const DEFAULT_THEME = "cochabamba";

export function loadThemeId() {
  try {
    const id = localStorage.getItem("awayu.theme");
    return id && THEMES[id] ? id : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function saveThemeId(id) {
  try {
    localStorage.setItem("awayu.theme", id);
  } catch {}
}
