#!/usr/bin/env bash
set -Eeuo pipefail

app_dir="${APP_DIR:-$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)}"
service_name=customizable-dashboard.service
cd -- "$app_dir"

exec 9>.deploy.lock
if ! flock -n 9; then
  echo 'Another dashboard deployment is already running.' >&2
  exit 1
fi

if [[ -n "$(git status --porcelain)" ]]; then
  echo 'Refusing to overwrite uncommitted changes in the deployment clone:' >&2
  git status --short >&2
  exit 1
fi
if [[ "$(git branch --show-current)" != main ]]; then
  echo 'The deployment clone must be on main.' >&2
  exit 1
fi
node -e 'const [major, minor] = process.versions.node.split(".").map(Number); if (major < 22 || (major === 22 && minor < 12)) { console.error("Node >=22.12 is required"); process.exit(1); }'
command -v curl >/dev/null
systemctl cat "$service_name" >/dev/null

# Like the other apps on this host, deploy the newest origin/main, including
# when an older queued workflow eventually starts. Never reset local changes.
git fetch origin main
git merge --ff-only origin/main
if [[ "$(git rev-parse HEAD)" != "$(git rev-parse origin/main)" ]]; then
  echo 'Local main has unpushed commits. Push them before deploying.' >&2
  exit 1
fi
revision="$(git rev-parse HEAD)"
npm ci --include=dev --no-audit --no-fund
bash scripts/build-release.sh

restart_service() {
  sudo -n /usr/bin/systemctl restart "$service_name"
}

rollback() {
  trap - ERR
  echo 'Deployment failed after publication.' >&2
  if [[ -L .deploy/previous ]]; then
    ln -sfn -- "$(readlink .deploy/previous)" .deploy/next
    mv -Tf -- .deploy/next .deploy/current
    restart_service || true
    echo 'Restored the previous static build; inspect the service logs.' >&2
  fi
  exit 1
}
trap rollback ERR
restart_service

for attempt in {1..30}; do
  if systemctl is-active --quiet "$service_name" && \
    [[ "$(curl --noproxy '*' --fail --silent --max-time 2 http://127.0.0.1:3002/__deployment.txt || true)" == "$revision" ]]; then
    trap - ERR
    echo "Deployed $revision; dashboard is responding on port 3002."
    exit 0
  fi
  sleep 1
done
echo 'The service did not return the deployed revision within 30 checks.' >&2
false
