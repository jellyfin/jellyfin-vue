import { Plugin } from '@nuxt/types';
import Vue from 'vue';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment -- Need to build a Type package for the module
// @ts-ignore
import VueNativeSock from 'vue-native-websocket';

declare module '@nuxt/types' {
  interface Context {
    $connect: (url: string) => void;
    $disconnect: () => void;
  }

  interface NuxtAppOptions {
    $connect: (url: string) => void;
    $disconnect: () => void;
  }
}

declare module 'vue/types/vue' {
  interface Vue {
    $connect: (url: string) => void;
    $disconnect: () => void;
  }
}

const nativeSocketPlugin: Plugin = ({ store }) => {
  Vue.use(VueNativeSock, 'ws://localhost', {
    connectManually: true,
    reconnection: true,
    reconnectionAttempts: 5,
    store,
    format: 'json'
  });
};

export default nativeSocketPlugin;
