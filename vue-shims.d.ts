declare module '*.vue' {
  import Vue from 'vue';

  export default Vue;
}

declare module "worker-loader!*" {
  class WebpackWorker extends Worker {
    constructor();
  }

  export default WebpackWorker;
}
