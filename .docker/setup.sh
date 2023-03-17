#!/bin/sh

CONFIG_FILE_PATH="/usr/share/nginx/html/config.json"
echo "Writing data to $CONFIG_FILE_PATH..."

if [[ "$HISTORY_ROUTER_MODE" == "0" ]]; then
    ROUTER_MODE="hash"
else
    ROUTER_MODE="history"
fi

echo "DEFAULT_SERVERS value: $DEFAULT_SERVERS"
echo "ROUTER_MODE value: $ROUTER_MODE"

output=$(jq -r --arg R_MODE "$ROUTER_MODE" --arg SERVS "$DEFAULT_SERVERS" '
    .defaultServerURLs = ($SERVS | split(",")) |
    .routerMode = $R_MODE
    ' $CONFIG_FILE_PATH
)

echo "$output" > $CONFIG_FILE_PATH
