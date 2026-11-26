import { pickLang } from "../i18n.js";

const topic = (esTitle, enTitle, esSteps, enSteps, localized = {}) => ({
  title: { es: esTitle, en: enTitle, pt: localized.pt?.title ?? esTitle, qu: localized.qu?.title ?? esTitle, ay: localized.ay?.title ?? esTitle, gn: localized.gn?.title ?? esTitle },
  steps: Object.fromEntries(["es", "en", "pt", "qu", "ay", "gn"].map((code) => [code, localized[code]?.steps ?? (code === "en" ? enSteps : esSteps)])),
});

export const HELP_TOPICS = Object.freeze({
  bolivia: topic("Juegos y costumbres de Bolivia", "Bolivian games and customs", [
    "En Cacho, escribe un nombre por línea y fija la lista antes de lanzar los dados. Si falla la conexión, puedes practicar sin verificación.",
    "Comparte el código y pégalo en la misma pestaña para repetir el resultado con el mismo ledger de Stellar.",
    "En Rifa, indica el premio, el precio y la cuenta de prueba. Muestra el QR de cada número, comprueba el pago y registra el nombre antes de cerrar el sorteo.",
    "En Anticrético, ajusta el depósito, el plazo, el alquiler y el tipo de cambio para comparar los resultados en bolivianos."
  ], [
    "In Cacho, enter one name per line and lock the list before rolling. If the connection fails, you can practice without verification.",
    "Share the code and paste it into the same tab to reproduce the result with the same Stellar ledger.",
    "In Raffle, enter the prize, price and test account. Show each ticket’s QR, check the payment and register the name before closing the draw.",
    "In Anticrético, adjust the deposit, term, rent and exchange rate to compare the results in bolivianos."
  ]),
  wallet: topic("Conectar billetera", "Connect a wallet", ["Elige Freighter, Google o correo.", "Revisa la red y la cuenta que aparece.", "Confirma cada acción en tu billetera."], ["Choose Freighter, Google, or email.", "Check the network and account shown.", "Confirm each action in your wallet."]),
  contribute: topic("Aportar", "Contribute", ["Revisa la cuota y la ronda actual.", "Elige Aportar y confirma la firma.", "Espera el resultado de la red."], ["Review the contribution and current round.", "Choose Contribute and confirm the signature.", "Wait for the network result."]),
  payout: topic("Pagar el pozo", "Pay the pot", ["Comprueba quién está de turno.", "El pozo se puede pagar cuando todos aportaron o venció el plazo.", "La red registra el pago y el avance de ronda."], ["Check whose turn it is.", "The pot can be paid once everyone contributed or the deadline passed.", "The network records the payment and next round."]),
  guarantee: topic("Garantía", "Guarantee", ["Es opcional y equivale a una cuota.", "Puede cubrir un aporte pendiente según las reglas del círculo.", "Al terminar, se puede retirar lo que quede."], ["It is optional and equals one contribution.", "It can cover an unpaid contribution under the circle rules.", "Any remaining amount can be withdrawn when the circle ends."]),
  create: topic("Crear un círculo", "Create a circle", ["Define cuota y duración de ronda.", "Agrega las direcciones de las personas participantes.", "Revisa los datos antes de firmar; quedan públicos en Stellar."], ["Set the contribution and round length.", "Add the participants' addresses.", "Review the details before signing; they become public on Stellar."]),
  customize: topic("Personalizar", "Customize", ["Elige personajes, escenario y aguayo.", "Los cambios son visuales y sirven para la demo.", "Vuelve al círculo para ver el tejido actualizado."], ["Choose characters, a scene, and a woven pattern.", "These visual changes are for the demo.", "Return to the circle to see the updated weave."]),
  simulator: topic("Simulador", "Simulator", ["Prueba distintos montos y cantidad de miembros.", "Los resultados son cálculos de ejemplo.", "No representan ganancias ni una recomendación."], ["Try different amounts and group sizes.", "Results are example calculations.", "They do not represent earnings or advice."]),
  map: topic("Mapa", "Map", ["Busca círculos registrados por departamento.", "Abre una ficha para conocer sus datos públicos.", "El mapa depende de los círculos registrados."], ["Browse registered circles by department.", "Open a card to see its public details.", "The map depends on circles being registered."]),
  passport: topic("Pasaporte", "Passport", ["Conecta la cuenta que declaró su participación.", "Revisa las marcas reunidas de tus círculos.", "El puntaje es un resumen y no garantiza crédito."], ["Connect the account that declared its participation.", "Review marks gathered from your circles.", "The score is a summary and does not guarantee credit."]),
  amawta: topic("Amawta", "Amawta", ["Escribe una pregunta sobre cómo funciona Awayu.", "Lee la respuesta y verifica los detalles importantes en la interfaz.", "No compartas información privada ni claves."], ["Ask a question about how Awayu works.", "Read the answer and verify important details in the interface.", "Do not share private information or keys."]),
  "ayni-contribute": topic("Aportar al fondo Ayni", "Contribute to the Ayni fund", ["Entra a Ayni desde el menú.", "Toca Aportar: tu cuota mensual entra al fondo común.", "El fondo crece y queda en el historial."], ["Open Ayni from the menu.", "Press Contribute: your monthly share joins the fund.", "The fund grows and the history records it."]),
  "ayni-request": topic("Pedir ayuda en Ayni", "Ask for help in Ayni", ["Toca Pedir ayuda.", "Escribe el monto y para qué lo necesitas.", "Envía el pedido: la comunidad lo vota."], ["Press Ask for help.", "Enter the amount and what it is for.", "Send it: the community votes on it."]),
  "ayni-vote": topic("Votar un pedido", "Vote on a request", ["Busca el pedido en votación.", "Toca A favor o En contra.", "Con el quórum, se cierra y el fondo presta el dinero."], ["Find the request being voted on.", "Press In favor or Against.", "Once quorum is reached it closes and the fund lends the money."]),
  "minka-fund": topic("Aportar a una Minka", "Back a Minka project", ["Mira la meta y los hitos del proyecto.", "Escribe cuánto quieres aportar y toca Aportar.", "La barra avanza; el dinero queda guardado hasta cada hito."], ["Check the goal and the project's milestones.", "Type how much to give and press Contribute.", "The bar moves; money stays locked until each milestone."]),
  "minka-milestone": topic("Liberar un hito", "Release a milestone", ["Con la meta completa, se sube la evidencia del avance.", "Los validadores la revisan y aprueban.", "Con mayoría, el hito se libera al organizador."], ["Once fully funded, the organizer uploads evidence.", "Validators review and approve it.", "With a majority, the milestone is paid out."]),
  "alasitas-create": topic("Crear una meta Alasitas", "Create an Alasitas goal", ["Toca Nueva meta.", "Elige la miniatura, el monto y la fecha de retiro.", "Suma participantes si es una meta compartida."], ["Press New goal.", "Pick the miniature, target and unlock date.", "Add people if the goal is shared."]),
  "alasitas-save": topic("Ahorrar en una meta", "Save toward a goal", ["Elige la miniatura de tu meta.", "Toca Ahorrar y escribe el monto.", "La barra y tu racha semanal crecen."], ["Pick your goal's miniature.", "Press Save and enter the amount.", "The bar and your weekly streak grow."]),
  "live-mode": topic("Ver datos reales en testnet", "See live testnet data", ["Arriba de cada tradición está el selector Demo / Testnet en vivo.", "Elige Testnet en vivo para leer el contrato real.", "Conecta tu billetera para firmar acciones."], ["Above each tradition there is a Demo / Live testnet switch.", "Pick Live testnet to read the real contract.", "Connect your wallet to sign actions."]),
  risk: topic("Leer las probabilidades", "Read the probabilities", ["Abre un círculo y entra a Probabilidades.", "Mira la chance de que el círculo termine bien.", "Revisa la confiabilidad de cada miembro según su historial."], ["Open a circle and go to Probabilities.", "See the chance the circle finishes well.", "Check each member's reliability from their history."]),
  latam: topic("Círculos de Latinoamérica", "Savings circles across Latin America", ["Elige un país y una forma local de ahorro rotativo.", "Revisa sus reglas, riesgos y la simulación de ejemplo.", "Si es rotativo, puedes abrir la creación en Stellar testnet."], ["Choose a country and a local rotating savings circle.", "Review its rules, risks and example simulation.", "For rotating circles, you can open creation on Stellar testnet."], { pt: { title: "Círculos de poupança da América Latina", steps: ["Escolha um país e uma forma local de poupança rotativa.", "Confira as regras, os riscos e a simulação de exemplo.", "Nos círculos rotativos, você pode abrir a criação na Stellar testnet."] } }),
  "ayni-join": topic("Unirse al fondo Ayni", "Join the Ayni fund", ["En Ayni, elige Testnet en vivo.", "Conecta tu billetera.", "Toca Unirme al fondo y firma: aportas tu primera cuota y ya puedes pedir ayuda y votar los pedidos nuevos."], ["In Ayni, pick Live testnet.", "Connect your wallet.", "Press Join the fund and sign: you pay your first share and can ask for help and vote on new requests."]),
  "verify-draw": topic("Sorteo verificable", "Verifiable draw", ["En Verificar, escribe el título y la lista de participantes.", "Toca Fijar lista: la huella queda fijada y se elige un ledger futuro de Stellar.", "Cuando ese ledger cierra sale el resultado; comparte el enlace o el QR para que cualquiera lo compruebe."], ["In Verify, enter the title and the participant list.", "Press Fix list: the fingerprint is locked and a future Stellar ledger is chosen.", "When that ledger closes the result appears; share the link or QR so anyone can check it."]),
  "verify-onchain": topic("Sorteo en la cadena", "On-chain draw", [
    "En Verificar, abre Sorteo en la cadena.",
    "Usa el ID del ejemplo o escribe el de otro sorteo y toca Consultar.",
    "Revisa la etapa, los plazos y cuántas personas revelaron su secreto. Cuando el sorteo esté cerrado, verás el orden final.",
  ], [
    "In Verify, open On-chain draw.",
    "Use the example ID or enter another draw ID and select Look up.",
    "Check the stage, the deadlines and how many people revealed their secret. Once the draw is closed, you can see the final order.",
  ]),
  "verify-check": topic("Comprobar un pago o un círculo", "Check a payment or a circle", ["En Verificar, abre Comprobante o Círculo u organizador.", "Pega el código de la transacción o la dirección del círculo.", "Revisa qué pasó, cuándo y el semáforo de confianza con sus razones."], ["In Verify, open Receipt or Circle or organizer.", "Paste the transaction code or the circle address.", "Check what happened, when, and the trust light with its reasons."]),
  "verify-report": topic("Reportar una irregularidad", "Report an irregularity", ["En Verificar, abre Reportar y describe lo que pasó.", "Agrega tus evidencias: no se suben, solo se calcula su huella.", "Guarda tu código de seguimiento y la constancia; si quieres, séllala en Stellar."], ["In Verify, open Report and describe what happened.", "Add your evidence: nothing is uploaded, only its fingerprint is computed.", "Keep your tracking code and certificate; optionally seal it on Stellar."]),
  settings: topic("Tu configuración", "Your settings", ["Toca ⚙ arriba a la derecha.", "Pon tu nombre, idioma, tamaño de letra o crea otro usuario en el mismo celular.", "Desde ahí también exportas o borras tus datos y repites el recorrido."], ["Press ⚙ at the top right.", "Set your name, language, text size or create another user on the same phone.", "From there you can also export or delete your data and replay the tour."]),
  "qr-invite": topic("Invitar con QR", "Invite with QR", ["En el círculo, toca Invitar con QR.", "Muestra el código o compártelo por mensaje.", "Quien lo escanea abre el círculo y revisa las reglas antes de unirse."], ["In the circle, press Invite with QR.", "Show the code or share it in a message.", "Whoever scans it opens the circle and checks the rules before joining."]),
  "qr-receive": topic("Recibir pagos con QR", "Receive payments with QR", ["En Billetera, toca Recibir con QR.", "Si quieres, escribe el monto y elige la moneda.", "La otra persona lo escanea con una billetera Stellar y te paga."], ["In Wallet, press Receive with QR.", "Optionally enter the amount and pick the asset.", "The other person scans it with a Stellar wallet and pays you."]),
  "qr-scan": topic("Escanear un QR", "Scan a QR", ["En Billetera, toca Escanear QR y permite la cámara.", "Apunta a una invitación, un pedido de pago o una dirección.", "Awayu te dice qué es y te ofrece abrirlo."], ["In Wallet, press Scan QR and allow the camera.", "Point at an invite, a payment request or an address.", "Awayu tells you what it is and offers to open it."]),
  "qr-bank": topic("Recargar con el QR del banco", "Top up with a bank QR", ["Toca Recargar con el QR de tu banco.", "Paga en bolivianos con la app de tu banco.", "Un proveedor autorizado te envía dólares digitales (USDC)."], ["Press Top up with your bank's QR.", "Pay in bolivianos with your bank app.", "A licensed provider sends you digital dollars (USDC)."]),
  "test-account": topic("Cuenta de prueba instantánea", "Instant test account", ["Toca Conectar billetera.", "Elige Cuenta de prueba instantánea: no hay que instalar nada.", "La red de prueba la fondea; se borra al cerrar la pestaña."], ["Press Connect wallet.", "Choose Instant test account: nothing to install.", "The test network funds it; it is erased when you close the tab."]),
  "test-usdc": topic("Obtener USDC de prueba", "Get test USDC", ["Al crear un círculo en USDC, o en Billetera, toca Obtener USDC de prueba.", "Firma la línea de confianza y el cambio de XLM por USDC.", "Es dinero de prueba, sin valor real."], ["When creating a USDC circle, or in Wallet, press Get test USDC.", "Sign the trustline and the XLM to USDC swap.", "It is test money with no real value."]),
  studio: topic("Estudio de personalización", "Customization studio", ["En el círculo, toca Estudio.", "Elige la hora del día, el clima y los colores de tu aguayo.", "Ajusta el color, el tamaño de letra o el contraste de la interfaz."], ["In the circle, press Studio.", "Pick the time of day, the weather and your aguayo colors.", "Adjust the interface color, text size or contrast."]),
});

// Traducciones de los temas de ayuda. Portugués completo; en quechua, aymara y
// guaraní los títulos (los pasos caen al español hasta la revisión de hablantes).
const LOCAL = {
  "verify-onchain": { pt: ["Sorteio na rede", [
    "Em Verificar, abra Sorteio na rede.",
    "Use o ID do exemplo ou digite o ID de outro sorteio e toque em Consultar.",
    "Confira a etapa, os prazos e quantas pessoas revelaram seu segredo. Quando o sorteio terminar, você verá a ordem final.",
  ]] },
  bolivia: { pt: ["Jogos e costumes da Bolívia", [
    "Em Cacho, digite um nome por linha e fixe a lista antes de lançar os dados. Se a conexão falhar, você pode praticar sem verificação.",
    "Compartilhe o código e cole-o na mesma aba para reproduzir o resultado com o mesmo ledger da Stellar.",
    "Em Rifa, informe o prêmio, o preço e a conta de teste. Mostre o QR de cada número, confira o pagamento e registre o nome antes de encerrar o sorteio.",
    "Em Anticrético, ajuste o depósito, o prazo, o aluguel e a taxa de câmbio para comparar os resultados em bolivianos."
  ]] },
  wallet: { pt: ["Conectar carteira", ["Escolha Freighter, Google ou e-mail.", "Confira a rede e a conta exibida.", "Confirme cada ação na sua carteira."]], qu: "Qullqi wayaqata tinkiy", ay: "Qullqi wayaqa chikt'aña", gn: "Embojoaju viru ryru" },
  contribute: { pt: ["Contribuir", ["Confira a contribuição e a rodada atual.", "Escolha Contribuir e confirme a assinatura.", "Aguarde o resultado da rede."]], qu: "Qullqita churay", ay: "Qullqi churaña", gn: "Emoĩ nde viru" },
  payout: { pt: ["Pagar o fundo", ["Veja de quem é a vez.", "O fundo pode ser pago quando todos contribuíram ou o prazo venceu.", "A rede registra o pagamento e o avanço da rodada."]], qu: "Huñusqa qullqita payllay", ay: "Tantachat qullqi payllaña", gn: "Ehepyme'ẽ pe viru aty" },
  guarantee: { pt: ["Garantia", ["É opcional e equivale a uma contribuição.", "Pode cobrir uma contribuição pendente conforme as regras do círculo.", "Ao terminar, o que sobrar pode ser retirado."]], qu: "Garantía", ay: "Garantía", gn: "Garantía" },
  create: { pt: ["Criar um círculo", ["Defina a contribuição e a duração da rodada.", "Adicione os endereços dos participantes.", "Revise os dados antes de assinar; ficam públicos na Stellar."]], qu: "Muyuta ruray", ay: "Muyu luraña", gn: "Ejapo peteĩ círculo" },
  customize: { pt: ["Personalizar", ["Escolha personagens, cenário e aguayo.", "As mudanças são visuais e servem para a demonstração.", "Volte ao círculo para ver o tecido atualizado."]], qu: "Sumaqchay", ay: "Sumachaña", gn: "Embojegua" },
  simulator: { pt: ["Simulador", ["Teste valores e quantidades de membros diferentes.", "Os resultados são cálculos de exemplo.", "Não representam ganhos nem uma recomendação."]], qu: "Yachachiq", ay: "Yant'aña", gn: "Simulador" },
  map: { pt: ["Mapa", ["Procure círculos registrados por departamento.", "Abra uma ficha para ver seus dados públicos.", "O mapa depende dos círculos registrados."]], qu: "Mapa", ay: "Mapa", gn: "Mapa" },
  passport: { pt: ["Passaporte", ["Conecte a conta que declarou sua participação.", "Revise as marcas reunidas dos seus círculos.", "A pontuação é um resumo e não garante crédito."]], qu: "Pasaporte", ay: "Pasaporte", gn: "Pasaporte" },
  amawta: { pt: ["Amawta", ["Escreva uma pergunta sobre como o Awayu funciona.", "Leia a resposta e confira os detalhes importantes na interface.", "Não compartilhe informações privadas nem chaves."]], qu: "Amawta", ay: "Amawta", gn: "Amawta" },
  "ayni-contribute": { pt: ["Contribuir para o fundo Ayni", ["Entre no Ayni pelo menu.", "Toque em Contribuir: sua cota mensal entra no fundo comum.", "O fundo cresce e fica no histórico."]], qu: "Ayni qullqiman churay", ay: "Ayni qullqir churaña", gn: "Emoĩ viru Ayni-pe" },
  "ayni-request": { pt: ["Pedir ajuda no Ayni", ["Toque em Pedir ajuda.", "Escreva o valor e para que precisa.", "Envie o pedido: a comunidade vota."]], qu: "Ayni-pi yanapata mañakuy", ay: "Ayni-n yanapa mayiña", gn: "Ejerure pytyvõ Ayni-pe" },
  "ayni-vote": { pt: ["Votar em um pedido", ["Encontre o pedido em votação.", "Toque em A favor ou Contra.", "Com o quórum, fecha e o fundo empresta o dinheiro."]], qu: "Mañakuypaq akllay", ay: "Mayiwitak ajlliña", gn: "Eiporavo peteĩ jerure" },
  "minka-fund": { pt: ["Apoiar uma Minka", ["Veja a meta e as etapas do projeto.", "Escreva quanto quer contribuir e toque em Contribuir.", "A barra avança; o dinheiro fica guardado até cada etapa."]], qu: "Minkata yanapay", ay: "Minka yanapaña", gn: "Epytyvõ peteĩ Minka" },
  "minka-milestone": { pt: ["Liberar uma etapa", ["Com a meta completa, envia-se a evidência do avanço.", "Os validadores revisam e aprovam.", "Com maioria, a etapa é liberada ao organizador."]], qu: "Huk patata kachariy", ay: "Mä thaki antutaña", gn: "Emosãso peteĩ jehupyty" },
  "alasitas-create": { pt: ["Criar uma meta Alasitas", ["Toque em Nova meta.", "Escolha a miniatura, o valor e a data de retirada.", "Adicione pessoas se a meta for compartilhada."]], qu: "Alasitas munayta ruray", ay: "Alasitas amtaña luraña", gn: "Ejapo peteĩ Alasitas jehupyty" },
  "alasitas-save": { pt: ["Poupar para uma meta", ["Escolha a miniatura da sua meta.", "Toque em Poupar e escreva o valor.", "A barra e sua sequência semanal crescem."]], qu: "Munaypaq waqaychay", ay: "Amtatak imaña", gn: "Eñongatu nde jehupytyrã" },
  "live-mode": { pt: ["Ver dados reais na testnet", ["Acima de cada tradição há o seletor Demo / Testnet ao vivo.", "Escolha Testnet ao vivo para ler o contrato real.", "Conecte sua carteira para assinar ações."]], qu: "Testnet-pi cheqaq willakuykunata qhaway", ay: "Testnet-na chiqpach yatiyawinak uñjaña", gn: "Ehecha mba'e añetegua testnet-pe" },
  risk: { pt: ["Ler as probabilidades", ["Abra um círculo e entre em Probabilidades.", "Veja a chance de o círculo terminar bem.", "Confira a confiabilidade de cada membro pelo histórico."]], qu: "Atikuykunata ñawinchay", ay: "Inas utjirinak liyt'aña", gn: "Emoñe'ẽ umi ikatúva" },
  "ayni-join": { pt: ["Entrar no fundo Ayni", ["No Ayni, escolha Testnet ao vivo.", "Conecte sua carteira.", "Toque em Entrar no fundo e assine: você paga sua primeira cota e já pode pedir ajuda e votar nos novos pedidos."]], qu: "Ayni qullqi huñuman yaykuy", ay: "Ayni qullqi tantachawir mantaña", gn: "Eike Ayni viru atýpe" },
  "verify-draw": { pt: ["Sorteio verificável", ["Em Verificar, escreva o título e a lista de participantes.", "Toque em Fixar lista: a impressão digital fica fixada e escolhe-se um ledger futuro da Stellar.", "Quando esse ledger fecha sai o resultado; compartilhe o link ou o QR para que qualquer um confira."]], qu: "Chiqaq suerte", ay: "Chiqa suerte", gn: "Ñemoñe'ẽ añetegua" },
  "verify-check": { pt: ["Conferir um pagamento ou um círculo", ["Em Verificar, abra Comprovante ou Círculo ou organizador.", "Cole o código da transação ou o endereço do círculo.", "Veja o que aconteceu, quando, e o semáforo de confiança com seus motivos."]], qu: "Qullqichayta utaq muyuta qhaway", ay: "Payllawi jan ukax muyu uñjaña", gn: "Ehecha peteĩ pago térã círculo" },
  "verify-report": { pt: ["Denunciar uma irregularidade", ["Em Verificar, abra Denunciar e descreva o que aconteceu.", "Adicione suas evidências: nada é enviado, só se calcula a impressão digital.", "Guarde seu código de acompanhamento e a certidão; se quiser, sele-a na Stellar."]], qu: "Mana allinta willay", ay: "Jan walt'awi yatiyaña", gn: "Emomarandu mba'e vai" },
  settings: { pt: ["Suas configurações", ["Toque em ⚙ no canto superior direito.", "Coloque seu nome, idioma, tamanho do texto ou crie outro usuário no mesmo celular.", "Dali você também exporta ou apaga seus dados e repete o tour."]], qu: "Allichanaykikuna", ay: "Askichawinakama", gn: "Nde ñemboheko" },
  "qr-invite": { pt: ["Convidar com QR", ["No círculo, toque em Convidar com QR.", "Mostre o código ou compartilhe por mensagem.", "Quem escanear abre o círculo e confere as regras antes de entrar."]], qu: "QR nisqawan invitay", ay: "QR ukamp jawsaña", gn: "Eguerohenói QR rupive" },
  "qr-receive": { pt: ["Receber pagamentos com QR", ["Em Carteira, toque em Receber com QR.", "Se quiser, escreva o valor e escolha a moeda.", "A outra pessoa escaneia com uma carteira Stellar e paga."]], qu: "QR nisqawan qullqita chaskiy", ay: "QR ukamp qullqi katuqaña", gn: "Ehupyty viru QR rupive" },
  "qr-scan": { pt: ["Escanear um QR", ["Em Carteira, toque em Escanear QR e permita a câmera.", "Aponte para um convite, um pedido de pagamento ou um endereço.", "O Awayu diz o que é e oferece abrir."]], qu: "QR-ta qhaway", ay: "QR uñjaña", gn: "Ehecha peteĩ QR" },
  "test-account": { pt: ["Conta de teste instantânea", ["Toque em Conectar carteira.", "Escolha Conta de teste instantânea: não é preciso instalar nada.", "A rede de teste a financia; ela é apagada ao fechar a aba."]] },
  "test-usdc": { pt: ["Obter USDC de teste", ["Ao criar um círculo em USDC, ou na Carteira, toque em Obter USDC de teste.", "Assine a linha de confiança e a troca de XLM por USDC.", "É dinheiro de teste, sem valor real."]] },
  "qr-bank": { pt: ["Recarregar com o QR do banco", ["Toque em Recarregar com o QR do seu banco.", "Pague em bolivianos com o app do seu banco.", "Um provedor autorizado envia dólares digitais (USDC)."]], qu: "Bancoq QR-ninwan yapay", ay: "Bancon QR-pampi yapxataña", gn: "Emyenyhẽ banco QR rupive" },
  studio: { pt: ["Estúdio de personalização", ["No círculo, toque em Estúdio.", "Escolha a hora do dia, o clima e as cores do seu aguayo.", "Ajuste a cor, o tamanho do texto ou o contraste da interface."]], qu: "Sumaqchana wasi", ay: "Suma lurañ uta", gn: "Mbojeguaha róga" },
};
for (const [id, loc] of Object.entries(LOCAL)) {
  const tp = HELP_TOPICS[id];
  if (!tp) continue;
  tp.title.pt = loc.pt[0];
  tp.steps.pt = loc.pt[1];
  for (const code of ["qu", "ay", "gn"]) if (loc[code]) tp.title[code] = loc[code];
}

// Qué tutoriales se ofrecen en cada sección del panel (el primero es el más útil)
export const ROUTE_TOPICS = Object.freeze({
  inicio: ["test-account", "wallet", "settings", "create", "live-mode"],
  circulo: ["contribute", "payout", "guarantee", "create", "test-usdc", "studio", "qr-invite", "customize", "simulator"],
  ayni: ["ayni-join", "ayni-contribute", "ayni-request", "ayni-vote", "live-mode"],
  minka: ["minka-fund", "minka-milestone", "live-mode"],
  alasitas: ["alasitas-create", "alasitas-save", "live-mode"],
  mapa: ["map"],
  billetera: ["wallet", "test-usdc", "qr-receive", "qr-scan", "qr-bank", "passport"],
  riesgo: ["risk", "simulator"],
  latam: ["latam"],
  bolivia: ["bolivia"],
  amawta: ["amawta"],
  verificar: ["verify-draw", "verify-onchain", "verify-check", "verify-report"],
});

function ensureStyles() {
  if (document.getElementById("aw-guide-help-style")) return;
  const style = document.createElement("style");
  style.id = "aw-guide-help-style";
  style.textContent = `
    .aw-guide-help-trigger{display:inline-grid;place-items:center;width:28px;height:28px;margin-inline-start:7px;border:1px solid #f0d283;border-radius:50%;background:#241c35;color:#fff;font:700 16px system-ui;line-height:1;cursor:pointer;vertical-align:middle}
    .aw-guide-help-trigger:focus-visible,.aw-guide-help-close:focus-visible{outline:3px solid #ffe18a;outline-offset:2px}
    .aw-guide-help-pop{position:fixed;z-index:11000;box-sizing:border-box;width:min(350px,calc(100vw - 24px));padding:16px;border:1px solid #e9cf82;border-radius:15px;background:#171126;color:#fff;box-shadow:0 14px 42px #000b;font:14px/1.5 system-ui,sans-serif}
    .aw-guide-help-pop h2{margin:0 34px 10px 0;color:#ffe29b;font-size:18px}.aw-guide-help-pop ol{margin:0;padding-inline-start:22px}.aw-guide-help-pop li{margin:6px 0;color:#f4efff}
    .aw-guide-help-pop{max-height:calc(100vh - 24px);overflow-y:auto}.aw-guide-help-pop video{display:block;width:100%;aspect-ratio:5/3;object-fit:cover;margin-top:12px;border-radius:9px;background:#090714}.aw-guide-help-close{position:absolute;right:10px;top:9px;width:32px;height:32px;border:1px solid #9c8cad;border-radius:8px;background:#2b2140;color:#fff;font-size:19px;cursor:pointer}
    @media(prefers-reduced-motion:reduce){.aw-guide-help-pop{scroll-behavior:auto}}
  `;
  document.head.append(style);
}

let activePopover;
let activeLang = "es";
function closeHelp() {
  if (!activePopover) return;
  document.removeEventListener("keydown", activePopover.onKey);
  document.removeEventListener("pointerdown", activePopover.onOutside, true);
  activePopover.node.remove();
  activePopover.returnFocus?.focus?.();
  activePopover = null;
}

export function openHelp(topicId, { lang = activeLang, anchor } = {}) {
  if (typeof document === "undefined" || !HELP_TOPICS[topicId]) return null;
  activeLang = lang;
  ensureStyles(); closeHelp();
  const data = HELP_TOPICS[topicId];
  const pop = document.createElement("aside"); pop.className = "aw-guide-help-pop"; pop.setAttribute("role", "dialog"); pop.setAttribute("aria-modal", "false"); pop.setAttribute("aria-labelledby", "aw-guide-help-title");
  const heading = document.createElement("h2"); heading.id = "aw-guide-help-title"; heading.textContent = data.title[lang] ?? data.title.es;
  const close = document.createElement("button"); close.type = "button"; close.className = "aw-guide-help-close"; close.textContent = "×"; close.setAttribute("aria-label", pickLang({ es: "Cerrar ayuda", en: "Close help", pt: "Fechar ajuda" }, lang)); close.addEventListener("click", closeHelp);
  const list = document.createElement("ol");
  (data.steps[lang] ?? data.steps.es).forEach((line) => { const item = document.createElement("li"); item.textContent = line; list.append(item); });
  pop.append(close, heading, list);
  const video = document.createElement("video"); video.src = `/tutoriales/${encodeURIComponent(topicId)}.webm`; video.poster = `/tutoriales/${encodeURIComponent(topicId)}.jpg`; video.muted = true; video.loop = true; video.playsInline = true; video.autoplay = true; video.setAttribute("playsinline", ""); video.setAttribute("aria-label", pickLang({ es: `Tutorial: ${heading.textContent}`, en: `${data.title.en} tutorial`, pt: `Tutorial: ${heading.textContent}` }, lang));
  video.addEventListener("error", () => video.remove(), { once: true }); pop.append(video);
  document.body.append(pop);
  // Debajo del botón si cabe; si no, encima; y siempre dentro de la pantalla.
  // Se recalcula cuando el video sabe su tamaño, para que nunca quede cortado.
  const place = () => {
    const rect = anchor?.getBoundingClientRect?.();
    const { width } = pop.getBoundingClientRect(); const h = pop.offsetHeight;
    const left = Math.max(12, Math.min(innerWidth - width - 12, rect ? rect.left : innerWidth - width - 18));
    let top = rect ? rect.bottom + 8 : innerHeight / 2 - h / 2;
    if (rect && top + h > innerHeight - 12) top = rect.top - h - 8;
    top = Math.max(12, Math.min(top, innerHeight - h - 12));
    Object.assign(pop.style, { left: `${left}px`, top: `${top}px` });
  };
  place(); video.addEventListener("loadedmetadata", place, { once: true });
  const onKey = (event) => { if (event.key === "Escape") { event.preventDefault(); closeHelp(); } };
  const onOutside = (event) => { if (!pop.contains(event.target) && event.target !== anchor) closeHelp(); };
  activePopover = { node: pop, onKey, onOutside, returnFocus: anchor, topicId };
  document.addEventListener("keydown", onKey); document.addEventListener("pointerdown", onOutside, true); close.focus();
  return { close: closeHelp, element: pop };
}

if (typeof window !== "undefined") window.addEventListener("awayu:lang", (event) => {
  if (!activePopover) return;
  const { topicId, returnFocus } = activePopover;
  closeHelp();
  openHelp(topicId, { lang: event.detail?.lang || "es", anchor: returnFocus });
});

export function attachHelp(element, topicId) {
  if (!element || !HELP_TOPICS[topicId] || typeof document === "undefined") return () => {};
  ensureStyles();
  const button = document.createElement("button"); button.type = "button"; button.className = "aw-guide-help-trigger"; button.textContent = "?";
  button.setAttribute("aria-label", HELP_TOPICS[topicId].title[document.documentElement.lang] || HELP_TOPICS[topicId].title.es);
  button.addEventListener("click", () => openHelp(topicId, { lang: document.documentElement.lang || "es", anchor: button }));
  element.append(button);
  return () => { if (activePopover?.returnFocus === button) closeHelp(); button.remove(); };
}
