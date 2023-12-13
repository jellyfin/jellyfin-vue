#!/bin/bash

## Install Tauri dependencies
apt update
apt install -y --no-install-recommends $(cat packaging/tauri/apt_packages)
rm -rf /var/lib/apt/lists /var/cache/apt/archives
