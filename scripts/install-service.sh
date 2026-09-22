#!/usr/bin/env bash
set -Eeuo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

if [[ "$PWD" != /home/bwenzinger/dev/customizable-dashboard || "$(id -un)" != bwenzinger ]]; then
  echo 'Run this installer as bwenzinger from /home/bwenzinger/dev/customizable-dashboard.' >&2
  exit 1
fi
node_directory="$(dirname -- "$(command -v node)")"
if [[ "$node_directory" == *[[:space:]\&\|]* ]]; then
  echo 'The Node directory must not contain whitespace, & or |.' >&2
  exit 1
fi

exec 9>.deploy.lock
flock -n 9
npm ci --include=dev --no-audit --no-fund
bash scripts/build-release.sh

mkdir -p .deploy
sed "s|@NODE_DIRECTORY@|$node_directory|g" deploy/customizable-dashboard.service > .deploy/customizable-dashboard.service
printf '%s\n' 'bwenzinger ALL=(root) NOPASSWD: /usr/bin/systemctl restart customizable-dashboard.service' > .deploy/customizable-dashboard.sudoers
sudo /usr/sbin/visudo -cf .deploy/customizable-dashboard.sudoers
sudo install -o root -g root -m 0644 .deploy/customizable-dashboard.service /etc/systemd/system/customizable-dashboard.service
sudo install -o root -g root -m 0440 .deploy/customizable-dashboard.sudoers /etc/sudoers.d/customizable-dashboard
sudo systemctl daemon-reload
sudo systemctl enable customizable-dashboard.service
sudo systemctl restart customizable-dashboard.service
curl --noproxy '*' --fail --silent --show-error --retry 15 --retry-connrefused --retry-delay 1 --max-time 2 http://127.0.0.1:3002/__deployment.txt
echo 'Dashboard installed at http://localhost:3002'
