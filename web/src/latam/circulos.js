// Nombres y descripciones de referencia. Las frecuencias y reglas pueden variar
// por comunidad; el texto evita presentar una sola práctica como universal.
export const L = (es, en, pt, qu = es, ay = es, gn = es) => ({ es, en, pt, qu, ay, gn });

export const FAMILIES = [
  { id: "rotativo", name: L("Rotativo con turno", "Rotating turns", "Rotativo por turnos") },
  { id: "acumulativo", name: L("Acumulativo con préstamos y reparto", "Shared fund, loans and distribution", "Acumulativo com empréstimos e divisão") },
  { id: "puja", name: L("Rotativo con puja o remate", "Rotating turns with bids", "Rotativo com lance ou leilão") },
];

const commonRisk = L(
  "Si alguien deja de aportar, el pozo puede quedar incompleto; si quien organiza desaparece o arregla el orden, puede ser difícil reclamar.",
  "If someone stops contributing, the pot can fall short; if the organizer disappears or changes the order, it can be hard to resolve.",
  "Se alguém deixa de contribuir, o fundo pode ficar incompleto; se a pessoa organizadora desaparecer ou mudar a ordem, pode ser difícil resolver."
);
const commonAwayu = L(
  "En Awayu, el turno se sortea de forma verificable en Stellar. La garantía puede cubrir una cuota faltante y las marcas registran cada ronda. Una cuota en USDC puede ayudar a acordar un valor frente a la inflación local.",
  "In Awayu, Stellar picks the turn in a verifiable draw. The guarantee can cover a missed contribution, and marks record each round. A USDC contribution can help the group agree on a value against local inflation.",
  "No Awayu, o turno é definido por sorteio verificável na Stellar. A garantia pode cobrir uma contribuição em falta, e as marcas registram cada rodada. Uma contribuição em USDC pode ajudar o grupo a combinar um valor diante da inflação local."
);

export const CIRCLES = [
  {
    id: "bo-pasanaku", family: "rotativo", flag: "🇧🇴", countryCode: "BO",
    country: L("Bolivia", "Bolivia", "Bolívia"), localName: "pasanaku",
    frequency: L("Es común acordar una frecuencia semanal, quincenal o mensual, según el grupo.", "Groups commonly agree on a weekly, biweekly or monthly schedule.", "É comum o grupo combinar uma frequência semanal, quinzenal ou mensal."),
    order: L("El grupo puede acordar los turnos, usar un orden rotativo o sortearlos; depende del acuerdo local.", "The group may agree on turns, rotate an order or draw lots; local agreements vary.", "O grupo pode combinar os turnos, usar uma ordem rotativa ou sortear; isso varia conforme o acordo local."),
    risk: commonRisk, awayu: commonAwayu, textile: "aguayo",
  },
  {
    id: "mx-tanda", family: "rotativo", flag: "🇲🇽", countryCode: "MX",
    country: L("México", "Mexico", "México"), localName: "tanda",
    frequency: L("A menudo se acuerda por semana, quincena o mes.", "Often agreed weekly, biweekly or monthly.", "Muitas vezes combinada por semana, quinzena ou mês."),
    order: L("Las personas suelen acordar quién cobra primero y el orden de los turnos.", "Participants commonly agree who collects first and the order of turns.", "As pessoas costumam combinar quem recebe primeiro e a ordem dos turnos."),
    risk: commonRisk, awayu: commonAwayu, textile: "sarape",
  },
  {
    id: "mx-cundina", family: "rotativo", flag: "🇲🇽", countryCode: "MX",
    country: L("Norte de México y parte de Centroamérica", "Northern Mexico and parts of Central America", "Norte do México e parte da América Central"), localName: "cundina",
    frequency: L("Puede ser semanal, quincenal o mensual, según el grupo.", "It may be weekly, biweekly or monthly, depending on the group.", "Pode ser semanal, quinzenal ou mensal, conforme o grupo."),
    order: L("El grupo acuerda los turnos; también puede usar un sorteo o una lista rotativa.", "The group agrees on turns; it may also use a draw or a rotating list.", "O grupo combina os turnos; também pode usar um sorteio ou uma lista rotativa."),
    risk: commonRisk, awayu: commonAwayu, textile: "sarape",
  },
  {
    id: "gt-cuchubal", family: "rotativo", flag: "🇬🇹", countryCode: "GT",
    country: L("Guatemala", "Guatemala", "Guatemala"), localName: "cuchubal",
    frequency: L("La frecuencia se acuerda entre participantes; puede ser semanal, quincenal o mensual.", "Participants agree on a schedule; it may be weekly, biweekly or monthly.", "As pessoas combinam a frequência; pode ser semanal, quinzenal ou mensal."),
    order: L("El grupo suele fijar el orden por acuerdo, lista o sorteo.", "The group commonly sets the order by agreement, list or draw.", "O grupo costuma definir a ordem por acordo, lista ou sorteio."),
    risk: commonRisk, awayu: commonAwayu, textile: "huipil",
  },
  {
    id: "sv-cuchubal", family: "rotativo", flag: "🇸🇻", countryCode: "SV",
    country: L("El Salvador", "El Salvador", "El Salvador"), localName: "cuchubal",
    frequency: L("Se puede acordar por semana, quincena o mes.", "The group may agree on weekly, biweekly or monthly contributions.", "Pode ser combinado por semana, quinzena ou mês."),
    order: L("Las personas organizadoras o el grupo acuerdan la lista y los turnos.", "Organizers or the group agree on the list and turns.", "As pessoas organizadoras ou o grupo combinam a lista e os turnos."),
    risk: commonRisk, awayu: commonAwayu, textile: "huipil",
  },
  {
    id: "pe-junta", family: "rotativo", flag: "🇵🇪", countryCode: "PE",
    country: L("Perú", "Peru", "Peru"), localName: "junta o pandero",
    frequency: L("Puede organizarse por semana, quincena o mes.", "It may run weekly, biweekly or monthly.", "Pode acontecer por semana, quinzena ou mês."),
    order: L("El grupo acuerda la lista, el orden o un sorteo para asignar los turnos.", "The group agrees on a list, an order or a draw to assign turns.", "O grupo combina uma lista, uma ordem ou um sorteio para definir os turnos."),
    risk: commonRisk, awayu: commonAwayu, textile: "manta",
  },
  {
    id: "ve-san", family: "rotativo", flag: "🇻🇪", countryCode: "VE",
    country: L("Venezuela", "Venezuela", "Venezuela"), localName: "san",
    frequency: L("La frecuencia suele acordarse dentro del grupo: semanal, quincenal o mensual.", "The group usually agrees on a weekly, biweekly or monthly schedule.", "O grupo costuma combinar uma frequência semanal, quinzenal ou mensal."),
    order: L("Los turnos se pueden acordar entre participantes o definir con una lista o sorteo.", "Turns may be agreed among participants or set with a list or draw.", "Os turnos podem ser combinados entre as pessoas ou definidos por lista ou sorteio."),
    risk: commonRisk, awayu: commonAwayu, textile: "madrás",
  },
  {
    id: "do-san", family: "rotativo", flag: "🇩🇴", countryCode: "DO",
    country: L("República Dominicana", "Dominican Republic", "República Dominicana"), localName: "san",
    frequency: L("Puede ser semanal, quincenal o mensual; el grupo define la fecha.", "It may be weekly, biweekly or monthly; the group sets the date.", "Pode ser semanal, quinzenal ou mensal; o grupo define a data."),
    order: L("El grupo puede acordar el orden de cobro o sortear los turnos.", "The group may agree on the collection order or draw the turns.", "O grupo pode combinar a ordem de recebimento ou sortear os turnos."),
    risk: commonRisk, awayu: commonAwayu, textile: "madrás",
  },
  {
    id: "co-cadena", family: "rotativo", flag: "🇨🇴", countryCode: "CO",
    country: L("Colombia", "Colombia", "Colômbia"), localName: "cadena",
    frequency: L("La periodicidad se acuerda entre participantes, a menudo semanal, quincenal o mensual.", "Participants agree on the schedule, often weekly, biweekly or monthly.", "As pessoas combinam a frequência, muitas vezes semanal, quinzenal ou mensal."),
    order: L("La cadena puede seguir una lista acordada, turnos rotativos o un sorteo.", "The chain may follow an agreed list, rotating turns or a draw.", "A cadeia pode seguir uma lista combinada, turnos rotativos ou um sorteio."),
    risk: commonRisk, awayu: commonAwayu, textile: "mochila",
  },
  {
    id: "ht-sol", family: "rotativo", flag: "🇭🇹", countryCode: "HT",
    country: L("Haití", "Haiti", "Haiti"), localName: "sol",
    frequency: L("El grupo acuerda la frecuencia; puede ser semanal, quincenal o mensual.", "The group agrees on a schedule; it may be weekly, biweekly or monthly.", "O grupo combina a frequência; pode ser semanal, quinzenal ou mensal."),
    order: L("El orden puede fijarse por acuerdo entre participantes o por sorteo.", "The order may be agreed among participants or set by a draw.", "A ordem pode ser combinada entre as pessoas ou definida por sorteio."),
    risk: commonRisk, awayu: commonAwayu, textile: "madrás",
  },
  {
    id: "caribe-susu", family: "rotativo", flag: "🇹🇹", countryCode: "TT",
    country: L("Caribe angloparlante", "English-speaking Caribbean", "Caribe de língua inglesa"), localName: "sou-sou / susu",
    frequency: L("La frecuencia se acuerda en el grupo; se encuentran ciclos semanales, quincenales o mensuales.", "The group agrees on a schedule; weekly, biweekly and monthly cycles are used.", "O grupo combina a frequência; há ciclos semanais, quinzenais ou mensais."),
    order: L("Las personas suelen acordar una secuencia de turnos o elegirla con un sorteo.", "Participants commonly agree on a turn sequence or choose it by a draw.", "As pessoas costumam combinar uma sequência de turnos ou defini-la por sorteio."),
    risk: commonRisk, awayu: commonAwayu, textile: "madrás",
  },
  {
    id: "co-natillera", family: "acumulativo", flag: "🇨🇴", countryCode: "CO",
    country: L("Colombia", "Colombia", "Colômbia"), localName: "natillera",
    frequency: L("Suele reunir aportes periódicos, con fechas acordadas por el grupo; a menudo mensuales.", "It usually gathers periodic contributions on dates agreed by the group, often monthly.", "Costuma reunir contribuições periódicas em datas combinadas pelo grupo, muitas vezes mensais."),
    order: L("No hay un turno fijo de pozo: el fondo presta a miembros con aprobación del grupo y luego se reparte según las reglas acordadas.", "There is no fixed pot turn: the fund lends to members with group approval, then is distributed under agreed rules.", "Não há um turno fixo de recebimento: o fundo empresta a pessoas aprovadas pelo grupo e depois é dividido conforme as regras combinadas."),
    risk: L("Puede haber préstamos impagos, cuentas poco claras o dependencia de una sola persona organizadora.", "Loans may go unpaid, records may be unclear or the group may depend on one organizer.", "Pode haver empréstimos não pagos, contas pouco claras ou dependência de uma só pessoa organizadora."),
    awayu: L("En Awayu se puede combinar el fondo Ayni (pedidos votados y devolución sin intereses) con una meta Alasitas con fecha. Los votos y movimientos dejan un registro transparente; USDC ayuda a acordar un valor frente a la inflación local.", "In Awayu, the Ayni fund (voted requests, repaid without interest) can be paired with a dated Alasitas goal. Votes and movements leave a transparent record; USDC helps the group agree on a value against local inflation.", "No Awayu, o fundo Ayni (pedidos votados e devolução sem juros) pode ser combinado com uma meta Alasitas com data. Votos e movimentos deixam um registro transparente; o USDC ajuda a combinar um valor diante da inflação local."),
    textile: "mochila",
  },
  {
    id: "br-caixinha", family: "acumulativo", flag: "🇧🇷", countryCode: "BR",
    country: L("Brasil", "Brazil", "Brasil"), localName: "caixinha",
    frequency: L("Se suelen acordar aportes periódicos; puede ser mensual u otra frecuencia del grupo.", "Periodic contributions are agreed by the group; they may be monthly or follow another schedule.", "O grupo combina contribuições periódicas; podem ser mensais ou seguir outra frequência."),
    order: L("No hay turno fijo: el grupo acuerda los pedidos de préstamo y las reglas para repartir el fondo.", "There is no fixed turn: the group agrees on loan requests and rules for distributing the fund.", "Não há turno fixo: o grupo combina os pedidos de empréstimo e as regras para dividir o fundo."),
    risk: L("Puede haber préstamos impagos, registros incompletos o desacuerdos sobre quién recibe y cuánto.", "Loans may go unpaid, records may be incomplete or members may disagree about who receives what.", "Pode haver empréstimos não pagos, registros incompletos ou desacordos sobre quem recebe e quanto."),
    awayu: L("En Awayu se puede combinar el fondo Ayni (pedidos votados y devolución sin intereses) con una meta Alasitas con fecha. Los votos y movimientos quedan transparentes; USDC ayuda a acordar un valor frente a la inflación local.", "In Awayu, the Ayni fund (voted requests, repaid without interest) can be paired with a dated Alasitas goal. Votes and movements stay transparent; USDC helps the group agree on a value against local inflation.", "No Awayu, o fundo Ayni (pedidos votados e devolução sem juros) pode ser combinado com uma meta Alasitas com data. Votos e movimentos ficam transparentes; o USDC ajuda a combinar um valor diante da inflação local."),
    textile: "chita",
  },
  {
    id: "pe-remate", family: "puja", flag: "🇵🇪", countryCode: "PE",
    country: L("Perú", "Peru", "Peru"), localName: "junta con remate",
    frequency: L("La frecuencia depende del acuerdo; puede ser semanal, quincenal o mensual.", "The schedule depends on the agreement; it may be weekly, biweekly or monthly.", "A frequência depende do acordo; pode ser semanal, quinzenal ou mensal."),
    order: L("En cada ronda, quien ofrece el mayor descuento al pozo puede cobrar antes; el grupo debe acordar cómo se comparan las ofertas.", "In each round, whoever offers the largest discount on the pot may collect early; the group must agree how bids are compared.", "Em cada rodada, quem oferece o maior desconto sobre o fundo pode receber antes; o grupo precisa combinar como comparar as ofertas."),
    risk: L("Ofertas poco claras o una persona que deja de aportar pueden reducir lo que reciben los demás.", "Unclear bids or someone stopping contributions can reduce what others receive.", "Ofertas pouco claras ou alguém que deixa de contribuir podem reduzir o que as outras pessoas recebem."),
    awayu: L("Awayu permite explorar esta mecánica en una simulación local: el descuento se reparte entre las demás personas y se muestra el costo implícito de cobrar antes. El contrato de puja todavía no existe; se indica como próximamente en contrato.", "Awayu lets you explore this mechanic in a local simulation: the discount is shared with the other members and the implied cost of collecting early is shown. The bidding contract does not exist yet; it is marked as coming to the contract later.", "O Awayu permite explorar essa mecânica em uma simulação local: o desconto é dividido entre as demais pessoas e o custo implícito de receber antes é mostrado. O contrato de lances ainda não existe; está marcado como previsto para o contrato."),
    textile: "manta",
  },
  {
    id: "br-consorcio", family: "puja", flag: "🇧🇷", countryCode: "BR",
    country: L("Brasil", "Brazil", "Brasil"), localName: "consórcio",
    frequency: L("Los pagos suelen ser periódicos, a menudo mensuales, según el plan y el grupo.", "Payments are usually periodic, often monthly, depending on the plan and group.", "Os pagamentos costumam ser periódicos, muitas vezes mensais, conforme o plano e o grupo."),
    order: L("Es una modalidad formal regulada por el Banco Central de Brasil. La contemplación puede combinar sorteo y lance, según el grupo.", "It is a formal arrangement regulated by Brazil's Central Bank. Being selected may combine a draw and a bid, depending on the group.", "É uma modalidade formal regulada pelo Banco Central do Brasil. A contemplação pode combinar sorteio e lance, conforme o grupo."),
    risk: L("Conviene revisar contrato, costos y reglas; pagos atrasados o entender mal el lance puede afectar el acceso al crédito.", "Review the contract, costs and rules; late payments or misunderstanding the bid may affect access to credit.", "É importante revisar contrato, custos e regras; atrasos ou entender mal o lance podem afetar o acesso ao crédito."),
    awayu: L("Awayu ofrece una simulación local de la puja para visualizar el descuento y su reparto. El contrato de puja todavía no existe; esta función está marcada como próximamente en contrato.", "Awayu offers a local bidding simulation to show the discount and how it is shared. The bidding contract does not exist yet; this feature is marked as coming to the contract later.", "O Awayu oferece uma simulação local do lance para mostrar o desconto e sua divisão. O contrato de lances ainda não existe; esse recurso está marcado como previsto para o contrato."),
    textile: "chita",
  },
];
