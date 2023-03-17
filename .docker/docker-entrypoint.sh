#!/bin/sh

## If the command has not been replaced by the user (i.e docker run image /bin/sh),
## follow through the setup process
if [[ "$*" = "nginx -g daemon off;" ]]; then
    echo "==== Starting Jellyfin Vue setup ===="
    echo
    /setup.sh
    echo
    echo "====      Setup finished!        ===="
    echo -e "\n"
fi

exec "$@"
