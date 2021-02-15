import { Plugin } from '@nuxt/types';
import Vue from 'vue';
// @ts-expect-error - Need to build a Type package for the module
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
  Vue.use(VueNativeSock, 'ws://127.0.0.1', {
    connectManually: true,
    reconnection: true,
    reconnectionAttempts: 5,
    store,
    format: 'json'
  });
};

export default nativeSocketPlugin;
