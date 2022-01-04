import { defineStore } from 'pinia';

/**
 * Public interfaces
 */
export interface BackdropParameters {
  blurhash: string | undefined | null;
  opacity: number;
}
export interface PageState {
  title: string;
  opaqueAppBar: boolean;
  navDrawer: boolean;
  openDrawer: boolean;
  isScrolled: boolean;
  backdrop: BackdropParameters;
}

export const defaultBackdropOpacity = 0.75;

export const pageStore = defineStore('page', {
  state: () => {
    return {
      title: 'Jellyfin',
      opaqueAppBar: true,
      navDrawer: true,
      openDrawer: true,
      isScrolled: false,
      backdrop: {
        blurhash: '',
        opacity: defaultBackdropOpacity
      }
    } as PageState;
  },
  actions: {
    resetBackdropOpacity(): void {
      this.backdrop.opacity = defaultBackdropOpacity;
    },
    clearBackdrop(): void {
      this.resetBackdropOpacity();
      this.backdrop.blurhash = '';
    }
  }
});
