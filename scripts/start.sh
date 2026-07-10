#!/bin/sh
set -e

if command -v openssl >/dev/null 2>&1; then
  echo "OpenSSL runtime: $(openssl version)"
else
  echo "OpenSSL runtime: NOT FOUND"
fi

exec node backend/server/index.js
