#!/usr/bin/env bash
# Despliega las otras tres tradiciones en testnet con cuentas efímeras
# (Friendbot, sin secretos) y les da actividad real para que se vean vivas:
#   Ayni: cuatro vecinos aportan, Carla pide para medicinas, la comunidad
#         aprueba y ella devuelve una parte; David deja un pedido abierto.
#   Minka: un sistema de riego con dos hitos; se financia completo, se sube
#          evidencia del primero y los validadores lo aprueban.
#   Alasitas: Ana ahorra para su casita y Bruno con Carla para un viaje.
# Escribe modos.json con los ids y la configuración que lee la web.
set -euo pipefail
NET="--network testnet"
W=target/wasm32v1-none/release
NAMES=(ana bruno carla david eva)

stellar keys generate organizador $NET --fund
for n in "${NAMES[@]}"; do stellar keys generate "$n" $NET --fund; done
addr() { stellar keys address "$1"; }
XLM=$(stellar contract id asset --asset native $NET)
lista() { local s=""; for n in "$@"; do s="$s\"$(addr "$n")\","; done; echo "[${s%,}]"; }
# Pasos de "actividad": si alguno falla, el contrato igual queda desplegado.
paso() { "$@" || echo "::warning::falló: ${*:1:12}"; }

# ---------- Ayni ----------
AYNI_M=(ana bruno carla david)
MONTHLY=100000000; QUORUM=5000; MAXREQ=300000000
AYNI=$(stellar contract deploy --wasm $W/ayni.wasm --source organizador $NET -- \
  --admin "$(addr organizador)" --token_id "$XLM" --members "$(lista "${AYNI_M[@]}")" \
  --monthly $MONTHLY --quorum_bps $QUORUM --max_request $MAXREQ)
echo "Ayni: $AYNI"
ay() { stellar contract invoke --id "$AYNI" --source "$1" $NET -- "${@:2}"; }
for n in "${AYNI_M[@]}"; do paso ay "$n" contribute --member "$(addr "$n")"; done
R1=$(ay carla request --member "$(addr carla)" --amount 150000000 --reason "Medicinas para mi mamá" || echo "")
if [ -n "$R1" ]; then
  paso ay ana vote --voter "$(addr ana)" --request_id "$R1" --approve true
  paso ay bruno vote --voter "$(addr bruno)" --request_id "$R1" --approve true
  paso ay organizador resolve --request_id "$R1"
  paso ay carla repay --member "$(addr carla)" --amount 50000000
fi
R2=$(ay david request --member "$(addr david)" --amount 100000000 --reason "Reparar el techo después de la granizada" || echo "")
[ -n "$R2" ] && paso ay ana vote --voter "$(addr ana)" --request_id "$R2" --approve true

# ---------- Minka ----------
DEADLINE=$(( $(date +%s) + 30 * 86400 ))
MILES='[{"title":"Compra de tubos y aspersores","amount":"300000000"},{"title":"Instalación en las parcelas","amount":"300000000"}]'
MINKA=$(stellar contract deploy --wasm $W/minka.wasm --source organizador $NET -- \
  --organizer "$(addr organizador)" --token "$XLM" --title "Sistema de riego comunitario" \
  --goal 600000000 --milestones "$MILES" --deadline $DEADLINE --validators "$(lista ana bruno carla)")
echo "Minka: $MINKA"
mk() { stellar contract invoke --id "$MINKA" --source "$1" $NET -- "${@:2}"; }
paso mk david fund --backer "$(addr david)" --amount 350000000
paso mk eva fund --backer "$(addr eva)" --amount 250000000
paso mk organizador submit_evidence --organizer "$(addr organizador)" --milestone 0 --uri "https://awayu-two.vercel.app/#/minka"
paso mk ana approve --validator "$(addr ana)" --milestone 0
paso mk bruno approve --validator "$(addr bruno)" --milestone 0

# ---------- Alasitas ----------
ALAS=$(stellar contract deploy --wasm $W/alasitas.wasm --source organizador $NET)
echo "Alasitas: $ALAS"
al() { stellar contract invoke --id "$ALAS" --source "$1" $NET -- "${@:2}"; }
UNLOCK=$(( $(date +%s) + 90 * 86400 ))
G1=$(al ana create_goal --owner "$(addr ana)" --token "$XLM" --title "Mi casita en El Alto" --kind casa \
  --target 1000000000 --unlock_at $UNLOCK --members "$(lista ana)" || echo "")
[ -n "$G1" ] && paso al ana deposit --from "$(addr ana)" --goal_id "$G1" --amount 250000000
G2=$(al bruno create_goal --owner "$(addr bruno)" --token "$XLM" --title "Viaje al salar de Uyuni" --kind viaje \
  --target 500000000 --unlock_at $UNLOCK --members "$(lista bruno carla)" || echo "")
if [ -n "$G2" ]; then
  paso al bruno deposit --from "$(addr bruno)" --goal_id "$G2" --amount 120000000
  paso al carla deposit --from "$(addr carla)" --goal_id "$G2" --amount 80000000
fi

nombres() { local s=""; for n in "$@"; do s="$s\"$(addr "$n")\":\"${n^}\","; done; echo "{${s%,}}"; }
cat > modos.json <<EOF
{
  "ayni": { "contractId": "$AYNI", "members": $(lista "${AYNI_M[@]}"), "memberNames": $(nombres "${AYNI_M[@]}"),
            "monthly": "$MONTHLY", "quorumBps": $QUORUM, "maxRequest": "$MAXREQ" },
  "minka": { "contractId": "$MINKA", "validators": $(lista ana bruno carla), "deadline": $DEADLINE },
  "alasitas": { "contractId": "$ALAS", "goals": [${G1:-null}, ${G2:-null}], "owners": $(lista ana bruno) },
  "modosCreatedAt": "$(date -u +%FT%TZ)"
}
EOF
cat modos.json
{
  echo "### Tradiciones desplegadas en testnet"
  for p in "Ayni:$AYNI" "Minka:$MINKA" "Alasitas:$ALAS"; do
    echo "- ${p%%:*}: [\`${p#*:}\`](https://stellar.expert/explorer/testnet/contract/${p#*:})"
  done
} >> "${GITHUB_STEP_SUMMARY:-/dev/null}"
