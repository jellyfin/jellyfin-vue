#!/bin/sh
echo "Configuring environment for nginx..."

NGINX_CONFIG_FILE=/etc/nginx/nginx.conf

## setup.sh dependencies
apk add --no-cache jq

# Trim image
apk --purge del apk-tools
rm -rf /docker-entrypoint.d /.dockerenv /usr/sbin/nginx-debug
rm -rf /usr/share/zoneinfo
rm -rf /sbin/apk /etc/apk /lib/apk /usr/share/apk /var/lib/apk
rm -rf /usr/lib/libcrypto* /usr/lib/libintl* /usr/lib/libssl* \
    /usr/lib/engines-3 /usr/lib/modules-load.d /usr/lib/nginx /usr/lib/ossl-modules

# CONTAINER ROOTLESS SETUP
### Set correct permissions and make frontend config.json file editable for the runtime user
mkdir -p /run/nginx
chown nginx:nginx -R /run/nginx /usr/share/nginx/html/config.json
sed -i 's|/var/run|/var/run/nginx|g' $NGINX_CONFIG_FILE
## The 'user' config option is useless when running rootless and gives a warning
sed -i '/^user /d' $NGINX_CONFIG_FILE
