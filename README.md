<h1 align="center">Jellyvision</h1>
<h3 align="center">A modern Vue-based client for the <a href="https://jellyfin.org">Jellyfin Project</a></h3>

---

<p align="center">
<img alt="Logo Banner" src="https://raw.githubusercontent.com/jellyfin/jellyfin-ux/master/branding/SVG/banner-logo-solid.svg?sanitize=true"/>
<br/>
<br/>
<a href="https://github.com/jellyfin/jellyfin-vue">
<img alt="GPL 3.0 License" src="https://img.shields.io/github/license/MrTimscampi/jellyvision.svg"/>
</a>
<a href="https://github.com/jellyfin/jellyfin-vue/releases">
<img alt="Current Release" src="https://img.shields.io/github/release/MrTimscampi/jellyvision.svg"/>
</a>
<a href="http://commitizen.github.io/cz-cli/">
<img alt="Commitizen friendly" src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" />
</a>
</p>

This is an experimental web client for Jellyfin based on Vue.js. We welcome all contributions and pull requests!

If you have a larger feature in mind please open an issue so we can discuss the implementation and design before you start.

## Requirements

This project uses [Yarn](https://yarnpkg.com/getting-started/install) as a package manager.

## Contributing

We provide a [devcontainer](https://code.visualstudio.com/docs/remote/containers) to help you setup your environment.

The project also contains recommended extensions for [Visual Studio Code](https://code.visualstudio.com/), which will help you with syntax style and development.

Finally, we provide useful pre-commit hooks via [Husky](https://typicode.github.io/husky/#/), as well as [Comitizen](https://github.com/commitizen/cz-cli) integration, in order to help you respect the style and naming conventions used throughout this project.

For more information about how to contribute to this project, see [CONTRIBUTING.md](https://github.com/jellyfin/jellyfin-vue/blob/master/CONTRIBUTING.md)

## Pre-requirements

```
Jellyfin >=10.7.0
```

## Build Process

```bash
# install dependencies
$ yarn install

# server with hot reload at localhost:3000
$ yarn dev

# build for production and launch server
$ yarn build
$ yarn start

```

## Running standalone

In order to save space when deploying the client, you can run it in _standalone mode_:

```bash
# install dependencies
$ yarn install

# build for production in standalone mode, with server-side rendering
$ yarn build --standalone

# move the server and required files to a dedicated directory
$ mkdir -p /opt/jellyfin-vue
$ cp .nuxt .docker/nuxt.config.js .docker/package.json /opt/jellyfin-vue

# install the required dependency and start the client
$ cd /opt/jellyfin-vue
$ yarn install
$ yarn start
```
