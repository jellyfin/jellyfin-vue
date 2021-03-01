# Contributing to Jellyfin Vue

Thank you for your interest in helping us develop the next generation of the Jellyfin web client.

This document will walk you through the various ways you can contribute to this project, as well as introduce the conventions used and guide you through setting up a development environment.

<p align="center">
<img alt="Logo Banner" src="https://raw.githubusercontent.com/jellyfin/jellyfin-ux/master/branding/SVG/banner-logo-solid.svg?sanitize=true"/>
</p>

## Ways to contribute

There are several ways to contribute to Jellyfin Vue, in addition to writing code.

- We are always looking for talented UI/UX designers to help us make Jellyfin look good, and to help improve user experience.  
  If you are interested in discussing this with us, the ["UI & UX" category in the Discussions tab](https://github.com/jellyfin/jellyfin-vue/discussions?discussions_q=category%3A%22UI+%26+UX%22) is a great place to start.
- We have a [translation platform](https://translate.jellyfin.org/projects/jellyfin/jellyfin-vue/#translations), if you want to help us provide a localized version of Jellyfin in as many languages as possible.
- You can [report bugs](https://github.com/jellyfin/jellyfin-vue/issues/) to help us fix issues with the client.

## Pull request process

Before making a pull request for a new feature, please open a discussion in the ["Features" category of the discussions tab](https://github.com/jellyfin/jellyfin-vue/discussions?discussions_q=category%3AFeatures).

Pull requests require reviews from members of the Jellyfin Web team before being merged. Please ensure that you respect code and commit message styles. Pre-commit hooks and Commitizen support are provided to help you.

Unattended pull requests will be marked as stale after a period of 90 days without activity, then closed after 14 days. This is meant to prevent abandoned pull requests from cluttering the review process.

## Conventions

This repository uses the [conventional commits](https://www.conventionalcommits.org/en/v1.0.0/) convention for commit messages. In order to help you with writing commit messages, we provide [Commitizen](https://github.com/commitizen/cz-cli) support in the repository.

The following should guide you through making a proper commit message:

```bash
npx cz
```

### Code style

This repository uses [Prettier](https://prettier.io/) for automatically formating code. In addition, [ESLint](https://eslint.org/) rules are provided to help you enforce good practices.

The project is written in [TypeScript](typescriptlang.org/), and using strongly typed code is recommended and expected, where possible.

### Tests

We use [Jest](https://jestjs.io/) for unit testing. For testing Vue components, usage of [vue-testing-library](https://testing-library.com/docs/vue-testing-library/intro/) is preferred.

When writing tests, we follow some conventions in regards to messages:

- The messages for `it()` always start with a lowercase letter
- They describe the test case in detail
- Only one thing is tested per test case (If you are testing multiple branches, you would have one test case per branch)
- The `describe()` block should contain the name of the component, store or mixin being tested

#### Vue components

```typescript
describe('component: ComponentName', () => {
  it('shows the text "Lorem Ipsum"', (): void => {
    // Your test logic goes here
  });
});
```

#### Mixins

```typescript
describe('mixin: myMixin', () => {
  it('does this when passed that value', () => {
    // Your test logic goes here
  });
});
```

#### Vuex stores

```typescript
describe('vuex: storeName', () => {
  it('sets this value when myAction is dispatched', () => {
    // Your test logic goes here
  });
});
```
