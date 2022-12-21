import '@vue/runtime-dom';

declare module '@vue/runtime-dom' {
  export interface HTMLAttributes {
    // allow any data-* attr
    [key: `data${string}`]: string;
  }
}
