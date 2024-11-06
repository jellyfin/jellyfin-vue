#!/bin/sh

CONFIG_FILE_PATH="$ASSETS/config.json"
echo "Writing data to $CONFIG_FILE_PATH..."

if [[ "$HISTORY_ROUTER_MODE" == "0" ]]; then
    ROUTER_MODE="hash"
else
    ROUTER_MODE="history"
fi

if [[ "$DISABLE_SERVER_SELECTION" == "1" ]]; then
    ALLOW_SERVER_SELECTION=false
else
    ALLOW_SERVER_SELECTION=true
fi

if [ -n "$DEFAULT_SERVERS" ]; then
    echo "DEFAULT_SERVERS value: $DEFAULT_SERVERS"
else
    echo "No DEFAULT_SERVERS value specified"
fi

echo "ALLOW_SERVER_SELECTION value: $ALLOW_SERVER_SELECTION"
echo "ROUTER_MODE value: $ROUTER_MODE"

output=$(jq -r --arg R_MODE "$ROUTER_MODE" --arg SERVS "$DEFAULT_SERVERS" '
    .defaultServerURLs = ($SERVS | split(",")) |
    .routerMode = $R_MODE |
    .allowServerSelection = ('"$ALLOW_SERVER_SELECTION"')
    ' $CONFIG_FILE_PATH
)

echo "$output" > $CONFIG_FILE_PATH
