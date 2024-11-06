#!/bin/sh
echo "Configuring environment for nginx..."

NGINX_CONFIG_FILE=/etc/nginx/nginx.conf

## setup.sh dependencies
apk add --no-cache jq

# CONTAINER ROOTLESS SETUP
### Set correct permissions and make frontend config.json file editable for the runtime user
mkdir -p /run/nginx
chown nginx:nginx -R /run/nginx /var/cache/nginx "$ASSETS"/config.json
sed -i 's|/var/run|/var/run/nginx|g' $NGINX_CONFIG_FILE
## Replaces the 'root' directive with the value of $ASSETS
sed -i "s|\${ASSETS}|${ASSETS}|g" "$NGINX_DEFAULT_SITE_CONFIG"
## The 'user' config option is useless when running rootless and gives a warning
sed -i '/^user /d' $NGINX_CONFIG_FILE
## Allow to open privileged ports
apk add --no-cache libcap
setcap CAP_NET_BIND_SERVICE=+eip /usr/sbin/nginx
apk --purge del libcap

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
