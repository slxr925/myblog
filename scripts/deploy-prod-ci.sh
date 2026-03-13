#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "${PROJECT_ROOT}"

log() {
    printf '[deploy-ci] %s\n' "$*"
}

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
TRIGGER_REMOTE_DEPLOY="${TRIGGER_REMOTE_DEPLOY:-true}"

case "${DEPLOY_MODE}" in
    incremental|full) ;;
    *)
        echo "Unsupported DEPLOY_MODE: ${DEPLOY_MODE}" >&2
        exit 1
        ;;
esac

case "${TRIGGER_REMOTE_DEPLOY}" in
    true|false) ;;
    *)
        echo "Unsupported TRIGGER_REMOTE_DEPLOY: ${TRIGGER_REMOTE_DEPLOY}" >&2
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
SSH_OPTS=(
    -p "${PROD_PORT}"
    -o BatchMode=yes
    -o ConnectTimeout=15
    -o ServerAliveInterval=15
    -o ServerAliveCountMax=4
    -o TCPKeepAlive=yes
)
SSH_CMD=(ssh "${SSH_OPTS[@]}")
RSYNC_SSH="ssh ${SSH_OPTS[*]}"

if ! command -v rsync >/dev/null 2>&1; then
    echo "rsync is required for CI deployment uploads." >&2
    exit 1
fi

log "Preparing remote directories on ${SSH_TARGET}:${PROD_PATH}"
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
    log "Uploading production env file"
    rsync -e "${RSYNC_SSH}" --archive --human-readable --progress \
        "${PROD_ENV_FILE_LOCAL}" "${SSH_TARGET}:${PROD_PATH}/.env.prod"
fi

log "Uploading backend artifact $(basename "${JAR_FILE}")"
rsync -e "${RSYNC_SSH}" --archive --human-readable --progress --partial --inplace \
    "${JAR_FILE}" "${SSH_TARGET}:${PROD_PATH}/myblog-backend/target/"
log "Backend artifact uploaded"

log "Uploading frontend dist"
"${SSH_CMD[@]}" "${SSH_TARGET}" "rm -rf '${PROD_PATH}/myblog-frontend/dist'/*"
rsync -e "${RSYNC_SSH}" --archive --human-readable --progress --delete \
    myblog-frontend/dist/ "${SSH_TARGET}:${PROD_PATH}/myblog-frontend/dist/"
log "Frontend dist uploaded"

log "Uploading deployment assets"
rsync -e "${RSYNC_SSH}" --archive --human-readable --progress \
    docker-compose.prod.yml "${SSH_TARGET}:${PROD_PATH}/"
rsync -e "${RSYNC_SSH}" --archive --human-readable --progress \
    myblog-backend/Dockerfile.prod "${SSH_TARGET}:${PROD_PATH}/myblog-backend/"
rsync -e "${RSYNC_SSH}" --archive --human-readable --progress \
    myblog-frontend/Dockerfile.prod myblog-frontend/nginx.conf \
    "${SSH_TARGET}:${PROD_PATH}/myblog-frontend/"
rsync -e "${RSYNC_SSH}" --archive --human-readable --progress \
    nginx/ "${SSH_TARGET}:${PROD_PATH}/nginx/"
rsync -e "${RSYNC_SSH}" --archive --human-readable --progress \
    deploy/prod/ "${SSH_TARGET}:${PROD_PATH}/deploy/prod/"
rsync -e "${RSYNC_SSH}" --archive --human-readable --progress \
    deploy/prod/ "${SSH_TARGET}:${PROD_PATH}/deploy/"
log "Deployment assets uploaded"

log "Making remote scripts executable"
"${SSH_CMD[@]}" "${SSH_TARGET}" "chmod +x '${PROD_PATH}/deploy/'*.sh '${PROD_PATH}/deploy/prod/'*.sh"

if [ "${TRIGGER_REMOTE_DEPLOY}" = "false" ]; then
    log "Upload completed. Skipping remote deployment because TRIGGER_REMOTE_DEPLOY=false"
    exit 0
fi

log "Triggering remote deployment in ${DEPLOY_MODE} mode"
"${SSH_CMD[@]}" "${SSH_TARGET}" "cd '${PROD_PATH}/deploy' && ./quick-deploy.sh --${DEPLOY_MODE}"

log "Production deployment completed successfully"
