#!/usr/bin/env bash
set -euo pipefail

APP_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
FRONTEND_DIR="$APP_DIR/frontend"
BACKEND_DIR="$APP_DIR/backend"
MONGO_DIR="$BACKEND_DIR/mongo-data"
MONGO_LOG="/tmp/kai-mongodb.log"
MONGO_PID=""
API_PID=""
MONGOD_BIN=""

for candidate in /nix/store/*-mongodb-ce-*/bin/mongod; do
  if [[ -x "$candidate" ]]; then
    MONGOD_BIN="$candidate"
    break
  fi
done

if [[ -z "$MONGOD_BIN" ]]; then
  echo "MongoDB server binary was not found in the installed package." >&2
  exit 1
fi

mongo_ping() {
  python3.11 -c 'from pymongo import MongoClient; MongoClient("mongodb://localhost:27017", serverSelectionTimeoutMS=1000).admin.command("ping")' >/dev/null 2>&1
}

cleanup() {
  if [[ -n "$API_PID" ]]; then
    kill "$API_PID" 2>/dev/null || true
    wait "$API_PID" 2>/dev/null || true
  fi
  if [[ -n "$MONGO_PID" ]]; then
    kill "$MONGO_PID" 2>/dev/null || true
    wait "$MONGO_PID" 2>/dev/null || true
  fi
}
trap cleanup EXIT INT TERM

cd "$FRONTEND_DIR"
yarn build

mkdir -p "$MONGO_DIR"
if ! mongo_ping; then
  "$MONGOD_BIN" --dbpath "$MONGO_DIR" --bind_ip localhost --port 27017 --quiet >"$MONGO_LOG" 2>&1 &
  MONGO_PID=$!

  ready=false
  for _ in $(seq 1 30); do
    if mongo_ping; then
      ready=true
      break
    fi
    if ! kill -0 "$MONGO_PID" 2>/dev/null; then
      cat "$MONGO_LOG" >&2
      exit 1
    fi
    sleep 1
  done

  if [[ "$ready" != true ]]; then
    echo "MongoDB did not become ready within 30 seconds." >&2
    cat "$MONGO_LOG" >&2
    exit 1
  fi
fi

cd "$BACKEND_DIR"
uvicorn server:app --host 0.0.0.0 --port 8001 &
API_PID=$!
wait "$API_PID"
