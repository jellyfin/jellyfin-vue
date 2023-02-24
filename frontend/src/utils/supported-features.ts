import {
  isApple,
  isChrome,
  isEdge,
  isChromiumBased
} from '@/utils/browser-detection';

export interface SupportedFeatures {
  airPlay: boolean;
  googleCast: boolean;
  playbackRate: boolean;
}

const supportedFeatures: SupportedFeatures = {
  airPlay: false,
  googleCast: false,
  playbackRate: false
};

const video = document.createElement('video');

if (typeof video.playbackRate === 'number') {
  supportedFeatures.playbackRate = true;
}

if (isApple()) {
  supportedFeatures.airPlay = true;
}

if (isChrome() || (isEdge() && isChromiumBased())) {
  supportedFeatures.googleCast = true;
}

export default supportedFeatures;
