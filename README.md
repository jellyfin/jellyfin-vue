<h1 align="center">Jellyfin Vue</h1>
<h3 align="center">Part of the <a href="https://jellyfin.org">Jellyfin Project</a></h3>

---

<p align="center">
<img alt="Logo Banner" src="https://raw.githubusercontent.com/jellyfin/jellyfin-ux/master/branding/SVG/banner-logo-solid.svg?sanitize=true"/>
<br/>
<br/>
<a href="https://hub.docker.com/r/jellyfin/jellyfin-vue">
<img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/jellyfin/jellyfin-vue">
</a>
<a href="https://github.com/jellyfin/jellyfin-vue/pkgs/container/jellyfin-vue">
<img alt="GHCR images" src="https://img.shields.io/badge/Github-packages-blue">
</a>
<br/>
<a href="https://github.com/jellyfin/jellyfin-vue">
<img alt="GPL 3.0 License" src="https://img.shields.io/github/license/jellyfin/jellyfin-vue.svg"/>
</a>
<a href="https://github.com/jellyfin/jellyfin-vue/releases">
<img alt="Current Release" src="https://img.shields.io/github/release/jellyfin/jellyfin-vue.svg"/>
</a>
<a href="https://commitizen.github.io/cz-cli/">
<img alt="Commitizen friendly" src="https://img.shields.io/badge/commitizen-friendly-brightgreen.svg" />
</a>
<a href="https://codecov.io/gh/jellyfin/jellyfin-vue">
<img src="https://codecov.io/gh/jellyfin/jellyfin-vue/branch/master/graph/badge.svg?token=6SPE6CJJD8"/>
</a>
<br/>
<a href="https://opencollective.com/jellyfin">
<img alt="Donate" src="https://img.shields.io/opencollective/all/jellyfin.svg?label=backers"/>
</a>
<a href="https://features.jellyfin.org">
<img alt="Feature Requests" src="https://img.shields.io/badge/fider-vote%20on%20features-success.svg"/>
</a>
<a href="https://matrix.to/#/+jellyfin:matrix.org">
<img alt="Chat on Matrix" src="https://img.shields.io/matrix/jellyfin:matrix.org.svg?logo=matrix"/>
</a>
<a href="https://www.reddit.com/r/jellyfin">
<img alt="Join our Subreddit" src="https://img.shields.io/badge/reddit-r%2Fjellyfin-%23FF5700.svg"/>
</a>
</p>

This is an experimental web client for Jellyfin based on Vue.js. We welcome all contributions and pull requests! If you have a larger feature in mind please open an issue so we can discuss the implementation before you start.

# Build Process

## Dependencies

- [Node.js LTS](https://nodejs.org/en/download) `>=16.13.0 <17.0.0`
- npm `>=8.1.0` (included in Node.js)
- Jellyfin Server `>=10.7.0`

## Getting Started

1. Clone or download this repository.

   ```bash
   git clone https://github.com/jellyfin/jellyfin-vue.git
   cd jellyfin-vue
   ```

2. Install the build dependencies in the project directory.

   ```bash
   npm install
   ```

3. Run the web client with Nuxt as a server for local development.

   ```bash
   npm start
   ```

   The client will be available at http://127.0.0.1:3000 by default.

   ### Build for production

   When you're ready to deploy the client, you must build the client specifically production:

   ```bash
   npm run build
   ```

   Build output will be available under the `src/dist` folder.

## Other build features

### Running a production build

Instead of a development version, you can run a server with a production-ready build of the client directly with Nuxt, so you can verify in advance how the client will work in a production environment:

```bash
npm run prod
```

_Although the build of the client is production-ready, Nuxt's own HTTP server should never be exposed directly to the internet and a proper hosting tool like Nginx should always be used instead._

# Contributing

We provide a [devcontainer](https://code.visualstudio.com/docs/remote/containers) to help you setup your environment.

The project also contains recommended extensions for [Visual Studio Code](https://code.visualstudio.com/), which will help you with syntax style and development.

Finally, we provide useful pre-commit hooks via [Husky](https://typicode.github.io/husky/#/), as well as [Comitizen](https://github.com/commitizen/cz-cli) integration, in order to help you respect the style and naming conventions used throughout this project.

For more information about how to contribute to this project, see [CONTRIBUTING.md](https://github.com/jellyfin/jellyfin-vue/blob/master/CONTRIBUTING.md)
