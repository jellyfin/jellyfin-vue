#!/bin/sh

CONFIG_FILE_PATH="/usr/share/nginx/html/config.json"
echo "Writing data to $CONFIG_FILE_PATH..."

if [[ "$HISTORY_ROUTER_MODE" == "0" ]]; then
    ROUTER_MODE="hash"
else
    ROUTER_MODE="history"
fi

if [[ "$ALLOW_SERVER_SELECTION" == "1" ]]; then
    ALLOW_SERVER_SELECTION="true"
else
    ALLOW_SERVER_SELECTION="false"
fi

echo "DEFAULT_SERVERS value: $DEFAULT_SERVERS"
echo "ALLOW_SERVER_SELECTION value: $ALLOW_SERVER_SELECTION"
echo "ROUTER_MODE value: $ROUTER_MODE"

output=$(jq -r --arg R_MODE "$ROUTER_MODE" --arg SERVS "$DEFAULT_SERVERS" --arg SELECTION_ALLOW "$ALLOW_SERVER_SELECTION" '
    .defaultServerURLs = ($SERVS | split(",")) |
    .routerMode = $R_MODE |
    .allowServerSelection = $SELECTION_ALLOW
    ' $CONFIG_FILE_PATH
)

echo "$output" > $CONFIG_FILE_PATH
