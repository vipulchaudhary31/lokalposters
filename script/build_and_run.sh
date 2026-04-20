#!/usr/bin/env bash
set -euo pipefail

MODE="${1:-run}"
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
METRO_PORT="${EXPO_METRO_PORT:-8081}"

cd "$ROOT_DIR"

show_usage() {
  cat <<'USAGE'
usage: ./script/build_and_run.sh [mode]

Modes:
  start, run         Start Expo Go preview in LAN mode
  --default, default Start Expo Go preview in LAN mode
  --restart, restart Restart Expo Go preview and clear Metro cache
  --help, help       Show this help
USAGE
}

resolve_expo_cmd() {
  if [[ -f pnpm-lock.yaml ]] && command -v pnpm >/dev/null 2>&1; then
    EXPO_CMD=(pnpm exec expo)
  elif [[ -f yarn.lock ]] && command -v yarn >/dev/null 2>&1; then
    EXPO_CMD=(yarn expo)
  elif { [[ -f bun.lock ]] || [[ -f bun.lockb ]]; } && command -v bun >/dev/null 2>&1; then
    EXPO_CMD=(bunx expo)
  else
    EXPO_CMD=(npx expo)
  fi
}

stop_existing_expo_processes() {
  local pids
  pids="$(pgrep -f "${ROOT_DIR}/node_modules/.bin/expo start" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "Stopping existing Expo process for this project..."
    # shellcheck disable=SC2086
    kill -15 $pids 2>/dev/null || true
    sleep 1
  fi
}

stop_existing_metro() {
  local pids
  pids="$(lsof -ti "tcp:${METRO_PORT}" 2>/dev/null || true)"
  if [[ -n "$pids" ]]; then
    echo "Stopping existing Metro process on port ${METRO_PORT}..."
    # shellcheck disable=SC2086
    kill -15 $pids 2>/dev/null || true
    sleep 1
  fi
}

detect_default_interface() {
  route get default 2>/dev/null | awk '/interface:/{print $2; exit}'
}

detect_lan_ip() {
  local iface ip candidate
  iface="$(detect_default_interface)"
  if [[ -n "$iface" ]]; then
    ip="$(ipconfig getifaddr "$iface" 2>/dev/null || true)"
    if [[ -n "$ip" ]]; then
      printf '%s\n' "$ip"
      return
    fi
  fi

  for candidate in en0 en1 en2 en3; do
    ip="$(ipconfig getifaddr "$candidate" 2>/dev/null || true)"
    if [[ -n "$ip" ]]; then
      printf '%s\n' "$ip"
      return
    fi
  done
}

print_hints() {
  local lan_ip exp_url
  lan_ip="$(detect_lan_ip || true)"
  exp_url=""
  if [[ -n "$lan_ip" ]]; then
    exp_url="exp://${lan_ip}:${METRO_PORT}"
  fi

  echo
  echo "Expo Go preview"
  echo "---------------"
  echo "1. Open Expo Go on your iPhone."
  echo "2. Scan the QR code shown below."
  if [[ -n "$exp_url" ]]; then
    echo "3. If scanning is flaky, paste this in Safari on the phone:"
    echo "   ${exp_url}"
  fi
  echo
  echo "Fast Refresh"
  echo "------------"
  echo "- Keep this terminal open while previewing."
  echo "- JS and TS changes should auto-refresh in Expo Go."
  echo
}

start_expo_go() {
  local clear_flag="${1:-}"
  if [[ "$clear_flag" == "clear" ]]; then
    exec "${EXPO_CMD[@]}" start --lan --clear --port "$METRO_PORT"
  fi
  exec "${EXPO_CMD[@]}" start --lan --port "$METRO_PORT"
}

resolve_expo_cmd

case "$MODE" in
  start|run|--default|default)
    stop_existing_expo_processes
    stop_existing_metro
    print_hints
    start_expo_go
    ;;
  --restart|restart)
    stop_existing_expo_processes
    stop_existing_metro
    print_hints
    start_expo_go clear
    ;;
  --help|help)
    show_usage
    ;;
  *)
    show_usage >&2
    exit 2
    ;;
esac
