declare module 'vue' {
  export interface HTMLAttributes {
    // Allow any data-* attr on HTML elements
    [key: `data${string}`]: string;
  }

  export interface ComponentCustomProps {
    // Allow any data-* attr on Vue components
    [key: `data${string}`]: string;
  }
}

export {};
