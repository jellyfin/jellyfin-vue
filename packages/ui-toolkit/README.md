This package contains the component library built in-house for Jellyfin Vue.
Here are the low level components used as a base for building the feature components
(like login form, item views, etc) only. If you're looking for those,
you will find them in the `src/components` of the `@jellyfin-vue/frontend` package.

All of these components:

* Use exclusively Composition API, so the Options API can gets treeshaken from the final build.
* Use modern CSS features (like [`position-try`](https://developer.mozilla.org/en-US/docs/Web/CSS/position-try))
and doesn't care about backwards-compatibility like other component libraries have to (this follows our goal
for targeting just evergreen browsers).
* Reusability it's still important, but the main focus is to provide the features we need for our use case first.
This allows us to have quicker development and deal with less edge cases (like those component libraries have to do).

Great inspiration for (re)building these components have been taken from Vuetify, Radix, PrimeVue and shadcn.
Thank you very much to all the contributors on those projects!
