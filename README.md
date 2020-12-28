<h1 align="center">Jellyfin Vue</h1>
<h3 align="center">Part of the <a href="https://jellyfin.org">Jellyfin Project</a></h3>

---

<p align="center">
<img alt="Logo Banner" src="https://raw.githubusercontent.com/jellyfin/jellyfin-ux/master/branding/SVG/banner-logo-solid.svg?sanitize=true"/>
<br/>
<br/>
<a href="https://github.com/jellyfin/jellyfin-vue">
<img alt="GPL 3.0 License" src="https://img.shields.io/github/license/jellyfin/jellyfin-vue.svg"/>
</a>
<a href="https://github.com/jellyfin/jellyfin-vue/releases">
<img alt="Current Release" src="https://img.shields.io/github/release/jellyfin/jellyfin-vue.svg"/>
</a>
<a href="http://commitizen.github.io/cz-cli/">
<img alt="Commitizen friendly" src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" />
</a>
<br/>
<a href="https://opencollective.com/jellyfin">
<img alt="Donate" src="https://img.shields.io/opencollective/all/jellyfin.svg?label=backers"/>
</a>
<a href="https://features.jellyfin.org">
<img alt="Feature Requests" src="https://img.shields.io/badge/fider-vote%20on%20features-success.svg"/>
</a>
<a href="https://forum.jellyfin.org">
<img alt="Discuss on our Forum" src="https://img.shields.io/discourse/https/forum.jellyfin.org/users.svg"/>
</a>
<a href="https://matrix.to/#/+jellyfin:matrix.org">
<img alt="Chat on Matrix" src="https://img.shields.io/matrix/jellyfin:matrix.org.svg?logo=matrix"/>
</a>
<a href="https://www.reddit.com/r/jellyfin">
<img alt="Join our Subreddit" src="https://img.shields.io/badge/reddit-r%2Fjellyfin-%23FF5700.svg"/>
</a>
</p>

This is an experimental web client for Jellyfin based on Vue.js. We welcome all contributions and pull requests! If you have a larger feature in mind please open an issue so we can discuss the implementation before you start.

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

# serve with hot reload at localhost:3000
$ yarn dev

# build for production and launch server
$ yarn build
$ yarn start

# generate static project
$ yarn generate
```
