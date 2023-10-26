#!/bin/bash
unset YARN_VERSION && rm -rf /opt/yarn*
rm -rf /bin/sh && ln -s /bin/bash /bin/sh
git config --global core.editor 'code --wait'

## Install Tauri dependencies
apt install -y --no-install-recommends $(cat packaging/tauri/apt_packages)
rm -rf /var/lib/apt/lists /var/cache/apt/archives

