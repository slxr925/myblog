#!/bin/bash

set -e

CONTAINER_NAME="${1:-myblog-caddy-local}"
LOGIN_KEYCHAIN="$(security default-keychain -d user | tr -d '"')"
CERT_FILE="$(mktemp -t myblog-caddy-root).crt"

cleanup() {
    rm -f "$CERT_FILE"
}
trap cleanup EXIT

docker cp "${CONTAINER_NAME}:/data/caddy/pki/authorities/local/root.crt" "$CERT_FILE"
security add-trusted-cert -p ssl -r trustRoot -k "$LOGIN_KEYCHAIN" "$CERT_FILE"

echo "Caddy 本地证书已信任，请重启浏览器。"
