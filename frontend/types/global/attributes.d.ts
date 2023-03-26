// eslint-disable-next-line import/no-extraneous-dependencies
import '@vue/runtime-dom';

declare module '@vue/runtime-dom' {
  export interface HTMLAttributes {
    // allow any data-* attr on HTML elements
    [key: `data${string}`]: string;
  }

  export interface ComponentCustomProps {
    // allow any data-* attr on Vue components
    [key: `data${string}`]: string;
  }
}
