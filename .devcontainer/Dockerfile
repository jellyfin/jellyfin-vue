FROM mcr.microsoft.com/devcontainers/base:debian

RUN rm -rf /bin/sh && ln -s /bin/bash /bin/sh

# Create a helper for installing packages leaving no traces behind
COPY install_packages /usr/sbin/install_packages
RUN sudo chmod 0755 /usr/sbin/install_packages

# Purge outdated packages and install node
RUN sudo apt update -qq && \
  sudo apt upgrade -y && \
  sudo apt autoremove --purge -y && \
  curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo bash && \
  sudo install_packages nodejs
