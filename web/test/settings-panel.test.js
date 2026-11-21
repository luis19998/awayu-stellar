// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { setLang } from "../src/i18n.js";
import { createProfile, updateProfile } from "../src/settings/profiles.js";
import { mountSettings, SETTINGS_COPY } from "../src/settings/panel.js";

let settings;

beforeEach(() => {
  localStorage.clear();
  setLang("es");
  document.body.innerHTML = `<div class="wallet"><button id="btn-sound">Sound</button><button id="btn-settings">⚙</button><button id="btn-wallet">Wallet</button></div><main id="view"></main><button id="help-fab">?</button>`;
  settings = mountSettings();
});

afterEach(() => {
  settings?.destroy?.();
  document.body.innerHTML = "";
  vi.restoreAllMocks();
});

describe("panel de configuración", () => {
  it("abre, cierra con Escape y devuelve el foco al engranaje", () => {
    settings.trigger.click();
    expect(settings.panel.hidden).toBe(false);
    expect(settings.panel.contains(document.activeElement)).toBe(true);
    document.activeElement.dispatchEvent(new KeyboardEvent("keydown", { key: "Escape", bubbles: true }));
    expect(settings.panel.hidden).toBe(true);
    expect(document.activeElement).toBe(settings.trigger);
    expect(settings.trigger.getAttribute("aria-expanded")).toBe("false");
  });

  it("presenta las ocho secciones en los seis idiomas", () => {
    const sectionCount = SETTINGS_COPY.sections.length;
    expect(sectionCount).toBe(8);
    for (const lang of ["es", "en", "pt", "qu", "ay", "gn"]) {
      setLang(lang);
      settings.refresh();
      const headings = [...settings.panel.querySelectorAll(".aw-settings-section > summary > span:nth-child(2)")].map((heading) => heading.textContent.trim());
      expect(headings).toHaveLength(8);
      expect(headings).toEqual(SETTINGS_COPY.sections.map((section) => section[lang] ?? section.es));
    }
  });

  it("exporta JSON válido con los datos del perfil activo", () => {
    localStorage.setItem("awayu.lang", "es");
    const exported = vi.fn();
    window.addEventListener("awayu:profile-export", (event) => exported(event.detail.json), { once: true });
    vi.spyOn(HTMLAnchorElement.prototype, "click").mockImplementation(() => {});
    settings.open();
    settings.panel.querySelector("[data-section='privacy']").open = true;
    settings.panel.querySelector(".aw-export").click();
    const json = exported.mock.calls[0][0];
    expect(JSON.parse(json).data["awayu.lang"]).toBe("es");
  });

  it("pide confirmación antes de borrar un perfil", () => {
    createProfile("Otro perfil", { reload: false });
    settings.refresh();
    settings.open();
    settings.panel.querySelector("[data-section='users']").open = true;
    const confirm = vi.spyOn(window, "confirm").mockReturnValue(false);
    settings.panel.querySelector(".aw-delete-profile").click();
    expect(confirm).toHaveBeenCalledOnce();
  });
});

describe("saludo de la portada", () => {
  it("se escribe una sola vez y no entra en bucle con el observador de #view", async () => {
    document.body.dataset.route = "inicio";
    document.querySelector("#view").innerHTML = `<div class="hero-in"><h1>Awayu</h1></div>`;
    updateProfile({ displayName: "Luis" });
    let mutations = 0;
    const counter = new MutationObserver((list) => { mutations += list.length; });
    counter.observe(document.querySelector("#view"), { childList: true, subtree: true, characterData: true });
    await new Promise((r) => setTimeout(r, 120));
    counter.disconnect();
    const greetings = document.querySelectorAll(".aw-profile-greeting");
    expect(greetings).toHaveLength(1);
    expect(greetings[0].textContent).toBe("Hola, Luis");
    expect(mutations).toBeLessThan(10);
  });
});
