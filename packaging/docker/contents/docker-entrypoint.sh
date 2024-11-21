#!/bin/sh

echo "==== Starting Jellyfin Vue setup ===="
echo
/setup.sh
echo
echo "====      Setup finished!        ===="
echo

exec "$@"
