#!/usr/bin/env bash
set -euo pipefail

APP_URL="${APP_URL:-}"
if [ -z "$APP_URL" ]; then
  echo "APP_URL not set. Exiting."
  exit 0
fi

echo "Pinging $APP_URL"
curl -fsS "$APP_URL" || true
