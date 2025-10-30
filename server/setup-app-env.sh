#!/usr/bin/env bash

set -euo pipefail

# Copies the user-level env file to the app root so python-decouple can load it,
# then protects permissions. Use on a Linux server after cloning the repo.

APP_USER="${APP_USER:-todofast}"
USER_ENV="/home/${APP_USER}/.env"
APP_DIR="/home/${APP_USER}/app"
APP_ENV="${APP_DIR}/.env"

if [[ ! -f "${USER_ENV}" ]]; then
  echo "[ERROR] ${USER_ENV} not found. Create it first with your production values." >&2
  exit 1
fi

if [[ ! -d "${APP_DIR}" ]]; then
  echo "[ERROR] ${APP_DIR} not found. Ensure the repo is cloned to ${APP_DIR}." >&2
  exit 1
fi

cp "${USER_ENV}" "${APP_ENV}"
chmod 600 "${APP_ENV}"

echo "[OK] Copied ${USER_ENV} -> ${APP_ENV} and set permissions to 600."
echo "Restart your service (e.g., systemctl restart todofast) to apply changes."


