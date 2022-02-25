declare module 'pinia' {
  export interface MapStoresCustomization {
    suffix: '';
  }
}

import { setMapStoreSuffix } from 'pinia';

setMapStoreSuffix('');

export * from './clientSettings';
export * from './deviceProfile';
