/* eslint-disable @typescript-eslint/consistent-indexed-object-style */

declare module 'vue' {
  export interface AllowedComponentProps {
    [key: `data${string}`]: string;
  }

  export interface ComponentCustomProps {
    // Allow any data-* attr on Vue components
    [key: `data${string}`]: string;
  }

  export interface HTMLAttributes {
    // Allow any data-* attr on HTML elements
    [key: `data${string}`]: string;
  }

  import type { hideDirective } from '#/plugins/directives';

  export interface GlobalDirectives {
    vHide: hideDirective;
  }
}

export {};
