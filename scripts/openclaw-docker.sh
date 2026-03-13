#!/usr/bin/env bash
# Wrapper that forwards openclaw CLI calls to the Docker container.
# Used by Mission Control when running outside Docker (pnpm dev).
CONTAINER="${OPENCLAW_CONTAINER:-openclaw-coolify-openclaw-1}"
exec docker exec -i "$CONTAINER" openclaw "$@"
