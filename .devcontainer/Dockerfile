FROM mcr.microsoft.com/devcontainers/base:debian

USER root
RUN rm -rf /bin/sh && ln -s /bin/bash /bin/sh

# Create a helper for installing packages leaving no traces behind
COPY <<EOF /usr/sbin/install_packages
#!/bin/bash
set -e
set -u
export DEBIAN_FRONTEND=noninteractive
n=0
max=2
until [ \$n -gt \$max ]; do
    set +e
    (
      apt update -qq &&
      apt install -y --no-install-recommends "\$@"
    )
    CODE=\$?
    set -e
    if [ \$CODE -eq 0 ]; then
        break
    fi
    if [ \$n -eq \$max ]; then
        exit \$CODE
    fi
    echo "apt failed, retrying"
    n=\$((\$n + 1))
done
rm -rf /var/lib/apt/lists/{*,.*} /var/cache/apt/archives/{*,.*}
EOF

# Set permissions, purge outdated packages and install node
RUN chmod 0755 /usr/sbin/install_packages && \
  apt update -qq && \
  apt upgrade -y && \
  apt autoremove --purge -y && \
  curl -fsSL https://deb.nodesource.com/setup_lts.x | bash && \
  install_packages nodejs
