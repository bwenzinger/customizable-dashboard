#!/usr/bin/env bash
set -Eeuo pipefail
cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.."

# Build outside the live directory; a failed build leaves the live link intact.
mkdir -p .deploy/releases
release_dir="$(mktemp -d "$PWD/.deploy/releases/build-XXXXXXXX")"
npm run build -- --outDir "$release_dir"
test -s "$release_dir/index.html"
git rev-parse HEAD > "$release_dir/__deployment.txt"

if [[ -L .deploy/current ]]; then
  ln -sfn -- "$(readlink .deploy/current)" .deploy/previous
fi
ln -sfn -- "releases/$(basename "$release_dir")" .deploy/next
mv -Tf -- .deploy/next .deploy/current
echo "Published $(cat "$release_dir/__deployment.txt") to $release_dir"
