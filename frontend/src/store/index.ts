import { setMapStoreSuffix } from 'pinia';

declare module 'pinia' {
  export interface MapStoresCustomization {
    suffix: '';
  }
}

setMapStoreSuffix('');

export * from './clientSettings';
export * from './page';
export * from './userViews';
export * from './homeSection';
export * from './items';
export * from './playbackManager';
export * from './taskManager';
