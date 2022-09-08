import 'vue-router';

declare module 'vue-router' {
  interface RouteMeta {
    layout?: string;
    transition?: string;
    public?: boolean;
  }
}
