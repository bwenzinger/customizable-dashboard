#!/usr/bin/env bash
set -Eeuo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")"

if [[ ! -f .deploy/current/index.html ]]; then
  echo 'No deployed build. Run bash scripts/build-release.sh first.' >&2
  exit 1
fi

export NO_UPDATE_CHECK=1
exec node node_modules/serve/build/main.js .deploy/current \
  --config ../../deploy/serve.json \
  --single --no-clipboard --no-port-switching --no-request-logging \
  --listen tcp://0.0.0.0:3002
