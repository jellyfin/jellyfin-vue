import { Plugin } from '@nuxt/types/app';

const castSenderPlugin: Plugin = ({ $features }) => {
  if ($features.googleCast) {
    // We need to set the handler before loading the library
    window.__onGCastApiAvailable = (isAvailable): void => {
      console.debug(isAvailable);

      if (isAvailable) {
        console.debug('Google Cast enabled');

        window.cast.framework.CastContext.getInstance().setOptions({
          receiverApplicationId: 'F007D354',
          autoJoinPolicy: window.chrome.cast.AutoJoinPolicy.ORIGIN_SCOPED
        });
      }
    };

    const script = document.createElement('script');

    script.type = 'text/javascript';
    script.src =
      '//www.gstatic.com/cv/js/sender/v1/cast_sender.js?loadCastFramework=1';

    document.head.appendChild(script);
  }
};

export default castSenderPlugin;
