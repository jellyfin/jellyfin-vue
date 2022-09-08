import { setMapStoreSuffix, createPinia } from 'pinia';
declare module 'pinia' {
  export interface MapStoresCustomization {
    suffix: '';
  }
}

const store = createPinia();
setMapStoreSuffix('');

export * from './clientSettings';
export * from './deviceProfile';
export * from './snackbar';
export * from './socket';
export * from './page';
export * from './userViews';
export * from './homeSection';
export * from './auth';
export * from './items';
export * from './playbackManager';
export * from './taskManager';

export default store;
