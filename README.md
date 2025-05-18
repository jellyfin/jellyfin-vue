<h1 align="center">Jellyfin Vue</h1>
<h3 align="center">Part of the <a href="https://jellyfin.org">Jellyfin Project</a></h3>

---

<p align="center">
<img alt="Logo Banner" src="https://raw.githubusercontent.com/jellyfin/jellyfin-ux/master/branding/SVG/banner-logo-solid.svg?sanitize=true"/>
<a href="https://hub.docker.com/r/jellyfin/jellyfin-vue">
<img alt="Docker Pulls" src="https://img.shields.io/docker/pulls/jellyfin/jellyfin-vue">
</a>
<a href="https://github.com/jellyfin/jellyfin-vue/pkgs/container/jellyfin-vue">
<img alt="GHCR images" src="https://img.shields.io/badge/Github-packages-blue">
</a>
<a href="https://github.com/jellyfin/jellyfin-vue">
<img alt="GPL 3.0 License" src="https://img.shields.io/github/license/jellyfin/jellyfin-vue.svg"/>
</a>
<a href="https://translate.jellyfin.org/projects/jellyfin-vue/jellyfin-vue/">
<img src="https://translate.jellyfin.org/widgets/jellyfin-vue/-/jellyfin-vue/svg-badge.svg">
</a>
<a href="https://github.com/jellyfin/jellyfin-vue/releases">
<img alt="Current Release" src="https://img.shields.io/github/release/jellyfin/jellyfin-vue.svg"/>
</a>
<a href="https://conventionalcommits.org">
<img alt="Conventional Commits" src="https://img.shields.io/badge/Conventional%20Commits-%23FE5196?logo=conventionalcommits&logoColor=white" />
</a>
<a href="https://opencollective.com/jellyfin">
<img alt="Donate" src="https://img.shields.io/opencollective/all/jellyfin.svg?label=backers"/>
</a>
<a href="https://features.jellyfin.org/?tags=vue">
<img alt="Feature Requests" src="https://img.shields.io/badge/fider-vote%20on%20features-success.svg"/>
</a>
<a href="https://matrix.to/#/#jellyfin-vue:matrix.org">
<img alt="Chat on Matrix" src="https://img.shields.io/matrix/jellyfin:matrix.org.svg?logo=matrix"/>
</a>
<a href="https://www.reddit.com/r/jellyfin">
<img alt="Join our Subreddit" src="https://img.shields.io/badge/reddit-r%2Fjellyfin-%23FF5700.svg"/>
</a>
<a href="https://sonarcloud.io/summary/new_code?id=jellyfin_jellyfin-vue">
<img alt="Code coverage"src="https://sonarcloud.io/api/project_badges/measure?project=jellyfin_jellyfin-vue&metric=coverage"/>
</a>
<a href="https://sonarcloud.io/summary/new_code?id=jellyfin_jellyfin-vue">
<img alt="Maintainability Rating"src="https://sonarcloud.io/api/project_badges/measure?project=jellyfin_jellyfin-vue&metric=sqale_rating"/>
</a>
<a href="https://sonarcloud.io/summary/new_code?id=jellyfin_jellyfin-vue">
<img alt="Reliability Rating"src="https://sonarcloud.io/api/project_badges/measure?project=jellyfin_jellyfin-vue&metric=reliability_rating"/>
</a>
<a href="https://sonarcloud.io/summary/new_code?id=jellyfin_jellyfin-vue">
<img alt="Vulnerabilities"src="https://sonarcloud.io/api/project_badges/measure?project=jellyfin_jellyfin-vue&metric=vulnerabilities"/>
</a>
<a href="https://sonarcloud.io/summary/new_code?id=jellyfin_jellyfin-vue">
<img alt="Code Smells"src="https://sonarcloud.io/api/project_badges/measure?project=jellyfin_jellyfin-vue&metric=code_smells"/>
</a>
<a href="https://sonarcloud.io/summary/new_code?id=jellyfin_jellyfin-vue">
<img alt="Technical debt"src="https://sonarcloud.io/api/project_badges/measure?project=jellyfin_jellyfin-vue&metric=sqale_index"/>
</a>
<a href="https://sonarcloud.io/summary/new_code?id=jellyfin_jellyfin-vue">
<img alt="Quality gate"src="https://sonarcloud.io/api/project_badges/measure?project=jellyfin_jellyfin-vue&metric=alert_status"/>
</a>
<a href="https://sonarcloud.io/summary/new_code?id=jellyfin_jellyfin-vue">
<img alt="Duplicated lines"src="https://sonarcloud.io/api/project_badges/measure?project=jellyfin_jellyfin-vue&metric=duplicated_lines_density"/>
</a>
<a href="https://sonarcloud.io/summary/new_code?id=jellyfin_jellyfin-vue">
<img alt="Bugs"src="https://sonarcloud.io/api/project_badges/measure?project=jellyfin_jellyfin-vue&metric=bugs"/>
</a>
<a href="https://sonarcloud.io/summary/new_code?id=jellyfin_jellyfin-vue">
<img alt="Security"src="https://sonarcloud.io/api/project_badges/measure?project=jellyfin_jellyfin-vue&metric=security_rating"/>
</a>
<a href="https://sonarcloud.io/summary/new_code?id=jellyfin_jellyfin-vue">
<img alt="Total lines"src="https://sonarcloud.io/api/project_badges/measure?project=jellyfin_jellyfin-vue&metric=ncloc"/>
</a>
</p>

---

Jellyfin Vue is an experimental, alternative browser-based web client for Jellyfin written using Vue.js.

![](https://raw.githubusercontent.com/jellyfin/jellyfin.org/refs/heads/master/blog/2023/04-03-vue_vue3/vue-homepage.png)

> [!NOTE]
> Jellyfin Vue is not planned or targeted to replace [the main Jellyfin Web client](https://github.com/jellyfin/jellyfin-web), and is not feature-complete.

# Usage instructions for end users 👨‍👩‍👧‍👦

*The following instructions will get you up and running quickly with
bleeding-edge builds from the current `master` branch.
There are no stable releases yet.*

## [Hosted instance 🌍](https://jf-vue.pages.dev/)

Built from the latest commit in the default branch. Just input your server address when prompted. If you don't have a Jellyfin server, try with our demo instance: `https://demo.jellyfin.org/stable`

⚠️ **This only works for Jellyfin servers that [are behind a reverse proxy and have HTTPS set up correctly](https://jellyfin.org/docs/general/networking/#running-jellyfin-behind-a-reverse-proxy)**. If your server runs over HTTP, you must host it yourself.

Hosted by Cloudflare Pages.

## Host it yourself 💽

Check [our wiki page](https://github.com/jellyfin/jellyfin-vue/wiki/Deployment) for the most up to date information.

You can check [GitHub Packages (GHCR)](https://github.com/jellyfin/jellyfin-vue/pkgs/container/jellyfin-vue) (recommended) or [DockerHub](https://hub.docker.com/r/jellyfin/jellyfin-vue) for all the tagged images.

## Privacy disclaimer 🕵🏻

Jellyfin Vue is just a GUI *(Graphical User Interface)* for a Jellyfin server. It only establishes connection to the Jellyfin server that you point it to, **nothing else**.

<details>
<summary><strong>Read more</strong></summary>

- **Local instances** _Examples: Our Windows/Mac/Linux application, a local web server, etc_: All the necessary assets for the frontend to work
  are available locally (in your device) or bundled into the underlying environment (Tauri, Electron, etc) where it is running.
  No assets need to be fetched remotely.
- **Remote instances** _Examples: Our hosted instance, an admin hosting Jellyfin Vue and sharing the URL
  (which is in a different domain from the Jellyfin Server), etc_: This probably comprises most cases.
  Here, all the frontend assets are not locally available, but somewhere else. When you access the remotely hosted frontend
  (normally using a web browser like Firefox or Microsoft Edge),
  all the frontend assets are loaded/cached into your device. Once the load has finished,
  **the connection will exclusively be between your device and the Jellyfin server(s)** ¹². Whoever is serving the frontend
  is never in the middle. ³

¹ _Assuming that the hosted version has not been altered (by adding trackers, beacons...) in any way from the sources provided in this repository
and you trust the person/people behind it to not have done so_.

² _Some features that need access to remote resources that are not controlled by you and/or the person hosting Jellyfin Vue might be added in the future
(such as Google Cast support for Chromecasts). These will be always **opt in** and toggleable through [our configuration](https://github.com/jellyfin/jellyfin-vue/wiki/Configuration)_

³ _We assume standard networks here, no special configurations or policies that your ISP/Workplace/University/etc might apply._

[Jellyfin Web](https://github.com/jellyfin/jellyfin-web) (our main frontend) works in a similar way:
It connects by default to the Jellyfin server that is running alongside,
but it's also capable to connect to other Jellyfin servers [like can be tested in our demo](https://demo.jellyfin.org/) and [the hosted instance](https://jellyfin-web.pages.dev/).
By inspecting the network requests, you will find that only connections to fetch its own assets are made to the server distributing the client, but connections to your own Jellyfin server will not go through it.

The same principle applies to Jellyfin Vue. Note that Jellyfin Web can also be hosted standalone, just like Jellyfin Vue.

- _Relevant links_: [Community standards](https://jellyfin.org/docs/general/community-standards) and [Social Contract](https://github.com/jellyfin/jellyfin-meta/blob/master/policies-and-procedures/jellyfin-social-contract.md)
</details>

# Usage instructions for developers 🛠

See [development setup](https://github.com/jellyfin/jellyfin-vue/wiki/Contributing#development-setup) from our *Contributing* guides.

# Contributing 🤝

See [Contributing](https://github.com/jellyfin/jellyfin-vue/wiki/Contributing) guide.
