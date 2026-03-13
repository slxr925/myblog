#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}"

require_env() {
    local name="$1"
    if [ -z "${!name:-}" ]; then
        echo "Missing required environment variable: ${name}" >&2
        exit 1
    fi
}

require_env "PROD_HOST"
require_env "PROD_USER"
require_env "PROD_PATH"

PROD_PORT="${PROD_PORT:-22}"
DEPLOY_MODE="${DEPLOY_MODE:-incremental}"

case "${DEPLOY_MODE}" in
    incremental|full) ;;
    *)
        echo "Unsupported DEPLOY_MODE: ${DEPLOY_MODE}" >&2
        exit 1
        ;;
esac

JAR_FILE="$(find myblog-backend/target -name '*.jar' -not -name '*-sources.jar' -not -name '*.original' | head -n 1)"
if [ -z "${JAR_FILE}" ] || [ ! -f "${JAR_FILE}" ]; then
    echo "Backend artifact not found. Run the backend build before deploy." >&2
    exit 1
fi

if [ ! -d "myblog-frontend/dist" ] || [ -z "$(find myblog-frontend/dist -mindepth 1 -maxdepth 1 -print -quit)" ]; then
    echo "Frontend dist directory is missing or empty. Run the frontend build before deploy." >&2
    exit 1
fi

for path in \
    "docker-compose.prod.yml" \
    "myblog-backend/Dockerfile.prod" \
    "myblog-frontend/Dockerfile.prod" \
    "myblog-frontend/nginx.conf" \
    "nginx/nginx.conf" \
    "deploy/prod/quick-deploy.sh"; do
    if [ ! -e "${path}" ]; then
        echo "Required deploy asset is missing: ${path}" >&2
        exit 1
    fi
done

SSH_TARGET="${PROD_USER}@${PROD_HOST}"
SSH_CMD=(ssh -p "${PROD_PORT}" -o BatchMode=yes)
SCP_CMD=(scp -P "${PROD_PORT}")

echo "Preparing remote directories on ${SSH_TARGET}:${PROD_PATH}"
"${SSH_CMD[@]}" "${SSH_TARGET}" "mkdir -p \
  '${PROD_PATH}/deploy' \
  '${PROD_PATH}/deploy/prod' \
  '${PROD_PATH}/myblog-backend/target' \
  '${PROD_PATH}/myblog-frontend/dist' \
  '${PROD_PATH}/myblog-backend' \
  '${PROD_PATH}/myblog-frontend' \
  '${PROD_PATH}/nginx' \
  '${PROD_PATH}/data/backend/logs' \
  '${PROD_PATH}/data/backend/uploads' \
  '${PROD_PATH}/backups'"

if [ -n "${PROD_ENV_FILE_LOCAL:-}" ]; then
    if [ ! -f "${PROD_ENV_FILE_LOCAL}" ]; then
        echo "Configured PROD_ENV_FILE_LOCAL does not exist: ${PROD_ENV_FILE_LOCAL}" >&2
        exit 1
    fi
    echo "Uploading production env file"
    "${SCP_CMD[@]}" "${PROD_ENV_FILE_LOCAL}" "${SSH_TARGET}:${PROD_PATH}/.env.prod"
fi

echo "Uploading backend artifact"
"${SCP_CMD[@]}" "${JAR_FILE}" "${SSH_TARGET}:${PROD_PATH}/myblog-backend/target/"

echo "Uploading frontend dist"
"${SSH_CMD[@]}" "${SSH_TARGET}" "rm -rf '${PROD_PATH}/myblog-frontend/dist'/*"
"${SCP_CMD[@]}" -r myblog-frontend/dist/* "${SSH_TARGET}:${PROD_PATH}/myblog-frontend/dist/"

echo "Uploading deployment assets"
"${SCP_CMD[@]}" docker-compose.prod.yml "${SSH_TARGET}:${PROD_PATH}/"
"${SCP_CMD[@]}" myblog-backend/Dockerfile.prod "${SSH_TARGET}:${PROD_PATH}/myblog-backend/"
"${SCP_CMD[@]}" myblog-frontend/Dockerfile.prod myblog-frontend/nginx.conf "${SSH_TARGET}:${PROD_PATH}/myblog-frontend/"
"${SCP_CMD[@]}" nginx/* "${SSH_TARGET}:${PROD_PATH}/nginx/"
"${SCP_CMD[@]}" deploy/prod/*.sh "${SSH_TARGET}:${PROD_PATH}/deploy/"
"${SCP_CMD[@]}" deploy/prod/*.sh "${SSH_TARGET}:${PROD_PATH}/deploy/prod/"

echo "Making remote scripts executable"
"${SSH_CMD[@]}" "${SSH_TARGET}" "chmod +x '${PROD_PATH}/deploy/'*.sh '${PROD_PATH}/deploy/prod/'*.sh"

echo "Triggering remote deployment in ${DEPLOY_MODE} mode"
"${SSH_CMD[@]}" "${SSH_TARGET}" "cd '${PROD_PATH}/deploy' && ./quick-deploy.sh --${DEPLOY_MODE}"

echo "Production deployment completed successfully"
