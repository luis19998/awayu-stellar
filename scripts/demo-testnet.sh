#!/usr/bin/env bash
# Crea un pasanaku de 4 miembros en testnet y juega tres rondas:
#   ronda 1: todos a tiempo; ronda 2: David paga tarde;
#   ronda 3: Carla falta sin garantía y Bruno falta pero su garantía lo cubre.
# La ronda 4 queda abierta con dos aportes, para mostrarla "en vivo".
set -euo pipefail
PERIOD="${1:-120}"
NET="--network testnet"
WASM=target/wasm32v1-none/release/pasanaku.wasm
NAMES=(ana bruno carla david)

stellar keys generate organizador $NET --fund
for n in "${NAMES[@]}"; do stellar keys generate "$n" $NET --fund; done

XLM=$(stellar contract id asset --asset native $NET)
MEMBERS=$(printf '"%s",' $(for n in "${NAMES[@]}"; do stellar keys address "$n"; done))
MEMBERS="[${MEMBERS%,}]"

START=$(date +%s)
ID=$(stellar contract deploy --wasm "$WASM" --source organizador $NET -- \
  --admin "$(stellar keys address organizador)" --token "$XLM" \
  --amount 100000000 --period "$PERIOD" --members "$MEMBERS")
echo "Contrato: $ID"

aporta() { stellar contract invoke --id "$ID" --source "$1" $NET -- contribute --member "$(stellar keys address "$1")"; }
alias()  { stellar contract invoke --id "$ID" --source "$1" $NET -- set_alias --member "$(stellar keys address "$1")" --alias "$2"; }
garantia() { stellar contract invoke --id "$ID" --source "$1" $NET -- deposit_guarantee --member "$(stellar keys address "$1")"; }
cobra()  { stellar contract invoke --id "$ID" --source organizador $NET -- payout; }
espera_hasta() { local t=$(( START + $1 )); local now=$(date +%s); if (( now < t )); then sleep $(( t - now )); fi; }

# Nombres visibles y garantías (Bruno y David dejan una cuota)
alias ana "Ana · El Alto"; alias bruno "Bruno · Sacaba"; alias carla "Carla · Quillacollo"; alias david "David · Tiquipaya"
garantia bruno; garantia david

# Ronda 1: todos a tiempo
for n in "${NAMES[@]}"; do aporta "$n"; done; cobra
# Ronda 2: David paga después del plazo
for n in ana bruno carla; do aporta "$n"; done
espera_hasta $(( PERIOD * 2 + 15 )); aporta david; cobra
# Ronda 3: Carla no paga (faltó) y Bruno tampoco, pero lo cubre su garantía
for n in ana david; do aporta "$n"; done
espera_hasta $(( PERIOD * 3 + 15 )); cobra
# Ronda 4 en curso
aporta ana; aporta bruno

# ---------- Registro: memoria colectiva on-chain ----------
# Si se pasa REGISTRO (id existente) se reutiliza; si no, se despliega uno nuevo.
REG="${REGISTRO:-}"
if [ -z "$REG" ]; then
  REG=$(stellar contract deploy --wasm target/wasm32v1-none/release/registro.wasm --source organizador $NET)
fi
echo "Registro: $REG"
reg() { stellar contract invoke --id "$REG" --source "$1" $NET -- "${@:2}"; }
reg organizador register --creator "$(stellar keys address organizador)" --circle "$ID" --name "Pasanaku del valle" --region cbba
for n in "${NAMES[@]}"; do reg "$n" join --member "$(stellar keys address "$n")" --circle "$ID"; done
reg ana endorse --from "$(stellar keys address ana)" --circle "$ID"
reg bruno endorse --from "$(stellar keys address bruno)" --circle "$ID"

# Más círculos en otros departamentos para que el mapa muestre la red
EXTRA=()
nuevo() { # nombre región miembros...
  local nombre="$1" region="$2"; shift 2
  local ms=""; for m in "$@"; do stellar keys address "$m" >/dev/null 2>&1 || stellar keys generate "$m" $NET --fund; ms="$ms\"$(stellar keys address "$m")\","; done
  local cid; cid=$(stellar contract deploy --wasm "$WASM" --source organizador $NET --     --admin "$(stellar keys address organizador)" --token "$XLM" --amount 500000000 --period 604800 --members "[${ms%,}]")
  reg organizador register --creator "$(stellar keys address organizador)" --circle "$cid" --name "$nombre" --region "$region"
  for m in "$@"; do reg "$m" join --member "$(stellar keys address "$m")" --circle "$cid"; done
  stellar contract invoke --id "$cid" --source "$1" $NET -- contribute --member "$(stellar keys address "$1")"
  EXTRA+=("$cid")
}
nuevo "Feriantes de la 16 de Julio" lpz ana eva fabio
nuevo "Comerciantes del Plan 3000" scz gaby hugo ines
nuevo "Cooperativa del Cerro" pts juan karen bruno
nuevo "Músicos del Carnaval" oru luis mara david
nuevo "Productores de uva" trj nina omar

{
  echo "{"
  echo "  \"network\": \"testnet\","
  echo "  \"rpc\": \"https://soroban-testnet.stellar.org\","
  echo "  \"contractId\": \"$ID\","
  echo "  \"token\": \"$XLM\","
  echo "  \"tokenSymbol\": \"XLM\","
  echo "  \"version\": 3,"
  echo "  \"registro\": \"$REG\","
  printf '  "circulos": [%s],
' "$(printf '"%s",' "$ID" "${EXTRA[@]}" | sed 's/,$//')"
  echo "  \"members\": {"
  for i in "${!NAMES[@]}"; do
    sep=","; (( i == ${#NAMES[@]} - 1 )) && sep=""
    echo "    \"${NAMES[$i]}\": \"$(stellar keys address "${NAMES[$i]}")\"$sep"
  done
  echo "  },"
  echo "  \"createdAt\": \"$(date -u +%FT%TZ)\""
  echo "}"
} > testnet.json
cat testnet.json
{
  echo "### Pasanaku desplegado en testnet"
  echo "- Contrato: [\`$ID\`](https://stellar.expert/explorer/testnet/contract/$ID)"
  echo "- Tres rondas jugadas; la cuarta queda abierta."
  echo "- Registro: [\`$REG\`](https://stellar.expert/explorer/testnet/contract/$REG) con ${#EXTRA[@]} círculos más en otros departamentos."
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
