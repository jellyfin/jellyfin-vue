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
## Adding a nginx user that will manage the daemon
cat /etc/passwd
adduser --system --shell /bin/false --no-create-home --disabled-password --gecos "nginx user" vue vue
## Set correct permissions
chown nginx:nginx -R /var/cache/nginx
mkdir -p /run/nginx
chown nginx:nginx -R /run/nginx
sed -i 's|/var/run|/var/run/nginx|g' $NGINX_CONFIG_FILE
## Make frontend config.json file editable for the runtime user
chown nginx:nginx -R /usr/share/nginx/html/config.json
## The 'user' config option is useless when running rootless and gives a warning
sed -i '/^user /d' $NGINX_CONFIG_FILE
