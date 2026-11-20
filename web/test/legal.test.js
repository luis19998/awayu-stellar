import { describe, expect, it } from "vitest";
import { mount } from "../src/views/legal.js";
describe("legal view", () => {
  it.each(["es", "en", "pt", "qu", "ay", "gn"])("mounts all six sections in %s", (lang) => {
    const container = { innerHTML: "", replaceChildren() { this.innerHTML = ""; } }; mount(container, { lang });
    expect(container.innerHTML.match(/id="legal-/g)).toHaveLength(6);
    expect(container.innerHTML).toContain("legal-terms"); expect(container.innerHTML).toContain("legal-contact");
  });
});
