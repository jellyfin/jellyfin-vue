import SpatialNavigation from './spatialNavigation';

declare module '@vue/runtime-core' {
  export interface ComponentCustomProperties {
    $SpatialNavigation: typeof SpatialNavigation;
  }
}
