#!/usr/bin/env bash
set -euo pipefail

# Only install the extensions once per container, like postCreateCommand would, so the ones
# uninstalled on purpose aren't installed again on every attach
marker="${XDG_STATE_HOME:-$HOME/.local/state}/jellyfin-vue/extensions-installed"

if [[ -f "$marker" ]]; then
  exit 0
fi

# The `code` remote CLI needs VS Code's IPC socket, which Codespaces and integrated terminals
# provide, but local Dev Containers don't when running lifecycle commands. In that case, look for
# the sockets of the running VS Code server ourselves.
reload_needed=false

if [[ -n "${VSCODE_IPC_HOOK_CLI:-}" ]]; then
  code=code
else
  server_main=''

  for cmdline in /proc/[0-9]*/cmdline; do
    server_main="$(tr '\0' '\n' < "$cmdline" 2> /dev/null | grep -m 1 '/out/server-main\.js$')" && break
  done

  if [[ -z "$server_main" ]]; then
    echo 'Unable to find a running VS Code server to install extensions with' >&2
    exit 1
  fi

  server_root="$(dirname "$(dirname "$server_main")")"
  code="$server_root/bin/remote-cli/code"

  # VS Code creates its sockets in the TMPDIR or XDG_RUNTIME_DIR of its own processes
  socket_dirs=(/tmp)

  for proc in /proc/[0-9]*; do
    if tr '\0' '\n' < "$proc/cmdline" 2> /dev/null | grep -q -F "$server_root/"; then
      mapfile -t -O "${#socket_dirs[@]}" socket_dirs < <(tr '\0' '\n' < "$proc/environ" 2> /dev/null | sed -n 's/^\(TMPDIR\|XDG_RUNTIME_DIR\)=//p')
    fi
  done

  mapfile -t sockets < <(printf '%s\n' "${socket_dirs[@]}" | sort -u | while read -r dir; do
    ls -t "$dir"/vscode-ipc-*.sock 2> /dev/null || true
  done)

  # Some sockets might be stale or never answer, so use the first one that works
  for socket in "${sockets[@]}"; do
    if VSCODE_IPC_HOOK_CLI="$socket" timeout 10 "$code" --list-extensions < /dev/null > /dev/null 2>&1; then
      export VSCODE_IPC_HOOK_CLI="$socket"
      break
    fi
  done

  # Without IPC, the server-side CLI installs the extensions directly, but the running server only
  # notices them after reloading the window
  if [[ -z "${VSCODE_IPC_HOOK_CLI:-}" ]]; then
    code="$server_root/bin/code-server"
    reload_needed=true
  fi
fi

jq -r '.recommendations[] | "--install-extension", .' .vscode/extensions.json | xargs "$code"

mkdir -p "$(dirname "$marker")"
touch "$marker"

if [[ "$reload_needed" == true ]]; then
  echo "Run 'Developer: Reload Window' for the installed extensions to show up" >&2
fi
