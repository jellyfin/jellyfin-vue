#!/bin/sh
echo "Configuring environment for nginx..."

NGINX_CONFIG_FILE=/etc/nginx/nginx.conf

# setup.sh dependencies
apk add --no-cache jq

# Replaces the 'root' directive with the value of $ASSETS
sed -i "s|\${ASSETS}|${ASSETS}|g" "$NGINX_DEFAULT_SITE_CONFIG"

# CONTAINER ROOTLESS SETUP
### Set correct permissions and make frontend config.json file editable for the runtime user
chown nginx:nginx "$ASSETS"/config.json

# Trim image
apk --purge del apk-tools
rm -rf /docker-entrypoint.d /.dockerenv /usr/sbin/nginx-debug
rm -rf /usr/share/zoneinfo /usr/share/man
rm -rf /var/cache/apk
rm -rf /etc/nginx/fast* /etc/nginx/*_params /etc/nginx/modules
rm -rf /sbin/apk /etc/apk /lib/apk /usr/share/apk /var/lib/apk /lib/libapk*
rm -rf /usr/lib/libintl* /lib/libintl*
rm -rf /usr/lib/engines-3 /usr/lib/modules-load.d /usr/lib/nginx /usr/lib/ossl-modules
rm -rf /etc/ssl
