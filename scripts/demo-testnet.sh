#!/usr/bin/env bash
# Crea un pasanaku de 4 miembros en testnet y juega tres rondas:
#   ronda 1: todos a tiempo; ronda 2: David paga tarde; ronda 3: Carla falta.
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
cobra()  { stellar contract invoke --id "$ID" --source organizador $NET -- payout; }
espera_hasta() { local t=$(( START + $1 )); local now=$(date +%s); if (( now < t )); then sleep $(( t - now )); fi; }

# Ronda 1: todos a tiempo
for n in "${NAMES[@]}"; do aporta "$n"; done; cobra
# Ronda 2: David paga después del plazo
for n in ana bruno carla; do aporta "$n"; done
espera_hasta $(( PERIOD * 2 + 15 )); aporta david; cobra
# Ronda 3: Carla no paga
for n in ana bruno david; do aporta "$n"; done
espera_hasta $(( PERIOD * 3 + 15 )); cobra
# Ronda 4 en curso
aporta ana; aporta bruno

{
  echo "{"
  echo "  \"network\": \"testnet\","
  echo "  \"rpc\": \"https://soroban-testnet.stellar.org\","
  echo "  \"contractId\": \"$ID\","
  echo "  \"token\": \"$XLM\","
  echo "  \"tokenSymbol\": \"XLM\","
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
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
