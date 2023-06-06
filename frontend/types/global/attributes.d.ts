declare module 'vue' {
  export interface HTMLAttributes {
    // allow any data-* attr on HTML elements
    [key: `data${string}`]: string;
  }

  export interface ComponentCustomProps {
    // allow any data-* attr on Vue components
    [key: `data${string}`]: string;
  }
}

export {};
