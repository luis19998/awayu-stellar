import "../guide/ia.css";
export const LEGAL_VERSION = "2026-11-19";
const pick = (o, l) => o[l] ?? o.es;
const tr = (es, en, pt) => ({ es, en, pt, qu: es, ay: es, gn: es });
const KEY = "awayu.legal.accepted";
export function hasConsent(storage = globalThis.localStorage) { try { return JSON.parse(storage.getItem(KEY) || "null")?.version === LEGAL_VERSION; } catch { return false; } }
export function ensureConsent(lang = "es") {
  if (hasConsent()) return Promise.resolve(true);
  return new Promise((resolve) => {
    const d = document.createElement("dialog"); d.className = "ia-dialog consent-dialog";
    const bullets = [tr("Testnet: prototipo sin dinero real.", "Testnet: prototype with no real money.", "Testnet: protótipo sem dinheiro real."), tr("Awayu no custodia fondos.", "Awayu does not custody funds.", "Awayu não mantém custódia dos fundos."), tr("Lo que escribes en la cadena es público y permanente.", "What you write on-chain is public and permanent.", "O que você grava na rede é público e permanente.")];
    let finished = false;
    const done = (value) => {
      if (finished) return;
      finished = true;
      window.removeEventListener("awayu:lang", onLanguage);
      d.close(); d.remove(); resolve(value);
    };
    const render = (selectedLang, checked = false) => {
      lang = selectedLang;
      d.innerHTML = "<form method=\"dialog\"><h2>" + pick(tr("Antes de firmar", "Before signing", "Antes de assinar"), lang) +
        "</h2><ul>" + bullets.map((item) => "<li>" + pick(item, lang) + "</li>").join("") +
        "</ul><label><input type=\"checkbox\" name=\"accept\"> " + pick(tr("Leí y acepto los términos y el aviso de riesgos", "I have read and accept the terms and risk notice", "Li e aceito os termos e o aviso de riscos"), lang) +
        "</label><p><a href=\"#/legal\" target=\"_blank\">" + pick(tr("Leer términos y aviso de riesgos", "Read terms and risk notice", "Ler termos e aviso de riscos"), lang) +
        "</a></p><menu><button value=\"cancel\">" + pick(tr("Cancelar", "Cancel", "Cancelar"), lang) +
        "</button><button value=\"accept\" class=\"primary\" disabled>" + pick(tr("Aceptar", "Accept", "Aceitar"), lang) + "</button></menu></form>";
      const form = d.querySelector("form"), checkbox = form.elements.accept, accept = form.querySelector('[value="accept"]');
      checkbox.checked = checked; accept.disabled = !checked;
      checkbox.onchange = () => { accept.disabled = !checkbox.checked; };
      form.onsubmit = (e) => { e.preventDefault(); if (e.submitter?.value === "accept" && checkbox.checked) { try { localStorage.setItem(KEY, JSON.stringify({ version: LEGAL_VERSION, date: new Date().toISOString() })); } catch {} done(true); } else done(false); };
      if (!checked) checkbox.focus();
    };
    const onLanguage = (event) => render(event.detail?.lang || lang, !!d.querySelector('[name="accept"]')?.checked);
    render(lang);
    window.addEventListener("awayu:lang", onLanguage);
    document.body.append(d);
    d.addEventListener("cancel", (e) => { e.preventDefault(); done(false); }, { once: true }); d.showModal();
  });
}
