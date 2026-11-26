import { afterEach, expect, it, vi } from "vitest";
import { JSDOM } from "jsdom";
import { Address, nativeToScVal, rpc, scValToNative, xdr } from "@stellar/stellar-sdk";
import { readDraw } from "../src/chain.js";
import { mount } from "../src/views/verificar.js";

const contractId = "CA2WAHFJIYHI5ORTOYEE5OUMBUV3RY2NOOJ37BBYB7QYPSTXWSTBIJKD";
const ana = "GAH7ENTDDJDD3I3JJJ35IU4TXUPJX3NN5OXKPDOEIFCTK4EEJ77H36ZU";
const other = "GAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAWHF";

function simulatedDraw(state, fallback = false) {
  const finalized = state === "Finalized";
  const fields = {
    state: xdr.ScVal.scvVec([xdr.ScVal.scvSymbol(state)]),
    commit_deadline: nativeToScVal(1800000000n, { type: "u64" }),
    reveal_deadline: nativeToScVal(1800000600n, { type: "u64" }),
    committed: xdr.ScVal.scvU32(2),
    revealed: xdr.ScVal.scvU32(finalized && !fallback ? 1 : 0),
    order: xdr.ScVal.scvVec(finalized ? [ana, other].map((s) => new Address(s).toScVal()) : []),
    fallback: xdr.ScVal.scvBool(fallback),
  };
  const retval = xdr.ScVal.scvMap(Object.keys(fields).sort().map((key) =>
    new xdr.ScMapEntry({ key: xdr.ScVal.scvSymbol(key), val: fields[key] })
  ));
  return { result: { retval } };
}

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

it("lee get(u32) sin firmar y normaliza el enum, los plazos y las direcciones de Soroban", async () => {
  const payload = simulatedDraw("Finalized");
  expect(scValToNative(payload.result.retval).state).toEqual(["Finalized"]);
  const simulate = vi.spyOn(rpc.Server.prototype, "simulateTransaction").mockResolvedValue(payload);
  await expect(readDraw({}, contractId, 27)).resolves.toEqual({
    state: "Finalized", commitDeadline: 1800000000, revealDeadline: 1800000600,
    committed: 2, revealed: 1, order: [ana, other], fallback: false,
  });
  const [[transaction]] = simulate.mock.calls;
  expect(transaction.signatures).toHaveLength(0);
  const invocation = transaction.operations[0].func.invokeContract;
  expect(Address.fromScAddress(invocation.contractAddress).toString()).toBe(contractId);
  expect(invocation.functionName.toString()).toBe("get");
  expect(invocation.args[0].u32).toBe(27);
});

it("conserva la consulta al cambiar de idioma y muestra el orden de la cadena con nombres y respaldo", async () => {
  const simulate = vi.spyOn(rpc.Server.prototype, "simulateTransaction")
    .mockResolvedValueOnce(simulatedDraw("Ready")).mockResolvedValueOnce(simulatedDraw("Finalized", true));
  const evidence = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ accounts: { Ana: ana } }) });
  vi.stubGlobal("fetch", evidence);
  const { window } = new JSDOM("", { url: "https://awayu.example/#/verificar" });
  vi.stubGlobal("location", window.location);
  const target = window.document.createElement("div");
  const deployment = { sorteo: { contractId, drawId: 17 } };
  let view = mount(target, { deployment });
  target.querySelector('[data-tab="onchain"]').click();
  const form = target.querySelector("#verify-onchain-form");
  expect(form.elements.id.value).toBe("17");
  form.elements.id.value = "27";
  form.requestSubmit();
  const result = target.querySelector("#verify-onchain-result");
  await vi.waitFor(() => expect(result.textContent).toContain("Listo para cerrar"));
  expect(result.querySelector("ol")).toBeNull();
  expect(evidence).not.toHaveBeenCalled();
  form.requestSubmit();
  const onchain = view.getOnchainQuery();
  view.destroy();
  view = mount(target, { deployment, lang: "pt", onchain });
  const panel = target.querySelector("#verify-panel-onchain");
  expect(panel.hidden).toBe(false);
  expect(panel.querySelector("input").value).toBe("27");
  await vi.waitFor(() => expect(panel.querySelector("h2").textContent).toContain("Encerrado"));
  expect([...panel.querySelectorAll("ol li")].map((li) => li.textContent)).toEqual(["Ana", "GAAAAAAA…AAAWHF"]);
  expect(panel.querySelector(".verify-prng").textContent).toContain("PRNG");
  expect(panel.querySelector("dd").textContent).toBe(new Date(1800000000000).toLocaleString("pt-BR", { dateStyle: "medium", timeStyle: "long" }));
  expect(evidence).toHaveBeenCalledWith("/contratos-nuevos.json");
  expect(simulate).toHaveBeenCalledTimes(2);
  view.destroy();
  window.close();
});
