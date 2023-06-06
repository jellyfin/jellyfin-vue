<template>
  <template v-if="mediaElementType">
    <Teleport
      :to="teleportTarget"
      :disabled="!teleportTarget">
      <Component
        :is="mediaElementType"
        v-show="mediaElementType === 'video' && teleportTarget"
        ref="mediaElementRef"
        :poster="String(posterUrl)"
        autoplay
        crossorigin="anonymous"
        playsinline
        :loop="playbackManager.isRepeatingOnce"
        :class="{ stretched: playerElement.isStretched }"
        @loadeddata="onLoadedData">
        <track
          v-for="sub in playbackManager.currentItemVttParsedSubtitleTracks"
          :key="`${playbackManager.currentSourceUrl}-${sub.srcIndex}`"
          kind="subtitles"
          :label="sub.label"
          :srclang="sub.srcLang"
          :src="sub.src" />
      </Component>
    </Teleport>
  </template>
</template>

<script setup lang="ts">
import { computed, watch, nextTick } from 'vue';
import { isNil } from 'lodash-es';
import { useI18n } from 'vue-i18n';
import Hls, { ErrorData } from 'hls.js';
import {
  playbackManagerStore,
  playerElementStore,
  mediaElementRef,
  mediaWebAudio
} from '@/store';
import { getImageInfo } from '@/utils/images';
import { useSnackbar } from '@/composables';

let subtitleDisplay: HTMLDivElement | null = null;

const playbackManager = playbackManagerStore();
const playerElement = playerElementStore();
const { t } = useI18n();

const hls = Hls.isSupported()
  ? new Hls({
    testBandwidth: false
  })
  : undefined;

/**
 * Detaches HLS instance after playback is done
 */
function detachHls(): void {
  if (hls) {
    hls.detachMedia();
    hls.off(Hls.Events.ERROR, onHlsEror);
  }
}

/**
 * Suspends WebAudio when no playback is in place
 */
async function detachWebAudio(): Promise<void> {
  if (mediaWebAudio.sourceNode) {
    mediaWebAudio.sourceNode.disconnect();
    mediaWebAudio.sourceNode = undefined;
  }

  await mediaWebAudio.context.suspend();
}

const mediaElementType = computed<'audio' | 'video' | undefined>(() => {
  if (playbackManager.currentlyPlayingMediaType === 'Audio') {
    return 'audio';
  } else if (playbackManager.currentlyPlayingMediaType === 'Video') {
    return 'video';
  }
});

/**
 * If the player is a video element and we're in the PiP player or fullscreen video playback,
 * we need to ensure the DOM elements are mounted before the teleport target is ready
 */
const teleportTarget = computed<
'.fullscreen-video-container' | '.minimized-video-container' | undefined
>(() => {
  if (playbackManager.currentlyPlayingMediaType === 'Video') {
    if (playerElement.isFullscreenMounted) {
      return '.fullscreen-video-container';
    } else if (playerElement.isPiPMounted) {
      return '.minimized-video-container';
    }
  }
});

const posterUrl = computed(() =>
  !isNil(playbackManager.currentItem) &&
  playbackManager.currentlyPlayingMediaType === 'Video'
    ? getImageInfo(playbackManager.currentItem, {
      preferBackdrop: true
    }).url
    : undefined
);

/**
 * Called by the media element when the playback is ready
 */
async function onLoadedData(): Promise<void> {
  if (playbackManager.currentlyPlayingMediaType === 'Video') {
    if (mediaElementRef.value) {
      /**
       * Makes the resume start from the correct time
       */
      mediaElementRef.value.currentTime = playbackManager.currentTime;
    }

    await playerElement.applyCurrentSubtitle();
  }
}

/**
 * Callback for when HLS.js gets an error
 */
function onHlsEror(_event: typeof Hls.Events.ERROR, data: ErrorData): void {
  if (data.fatal && hls) {
    switch (data.type) {
      case Hls.ErrorTypes.NETWORK_ERROR: {
        // Try to recover network error
        useSnackbar(t('errors.playback.networkError'), 'error');
        console.error('fatal network error encountered, try to recover');
        hls.startLoad();
        break;
      }
      case Hls.ErrorTypes.MEDIA_ERROR: {
        useSnackbar(t('errors.playback.mediaError'), 'error');
        console.error('fatal media error encountered, try to recover');
        hls.recoverMediaError();
        break;
      }
      default: {
        /**
         * Can't recover from unknown errors
         */
        useSnackbar(t('errors.cantPlayItem'), 'error');
        playbackManager.stop();
        break;
      }
    }
  }
}


watch(
  () => [
    playbackManager.currentSubtitleStreamIndex,
    playerElement.isFullscreenMounted,
    playerElement.isPiPMounted
  ],
  async (newVal, oldVal) => {
    if (newVal[1] || newVal[2]) {
      await playerElement.applyCurrentSubtitle();
    }

    if (newVal[0] !== oldVal[0] && mediaElementRef.value) {
      // Remove the existing subtitle display element if it exists
      if (subtitleDisplay) {
        subtitleDisplay.remove();
        subtitleDisplay = null;
      }

      // Get the video element
      var video = mediaElementRef.value;

      // Create a new element to display the subtitles
	  	subtitleDisplay = document.createElement('div');
		  subtitleDisplay.style.position = 'absolute';
		  subtitleDisplay.style.bottom = '15%';
      subtitleDisplay.style.maxWidth = '100%';
      subtitleDisplay.style.left = '50%';
      subtitleDisplay.style.transform = 'translateX(-50%)';
      subtitleDisplay.style.textAlign = 'center';
      subtitleDisplay.style.color = 'white';
      subtitleDisplay.style.textShadow = '2px 2px 3px black';
      subtitleDisplay.style.backgroundColor = 'transparent';
      video.parentNode.append(subtitleDisplay);

      // Function to adjust font size
      /**
       *
       */
      function adjustFontSize() {
 		 // Set the base font size (in pixels)
 		 let baseFontSize = 3 * window.innerWidth / 100;

		  // Set the minimum and maximum font size (in pixels)
 		 let minFontSize = 16;
 		 let maxFontSize = 48;

 		 // Adjust the base font size if it's below the minimum or above the maximum
  		if (baseFontSize < minFontSize) {
  		  baseFontSize = minFontSize;
 		 } else if (baseFontSize > maxFontSize) {
  		  baseFontSize = maxFontSize;
		  }

 		 // Apply the adjusted font size
 		 subtitleDisplay.style.fontSize = baseFontSize + 'px';
      }

      // Adjust font size initially
      adjustFontSize();

      // Adjust font size whenever the window is resized
      window.addEventListener('resize', adjustFontSize);

      // Get the track element
      if (video.textTracks && video.textTracks.length > newVal[0]) {
        var track = video.textTracks[newVal[0]];

        // Hide the default subtitles
        	track.mode = 'hidden';

        // Update the subtitle display when the cue changes
        track.oncuechange = function() {
          var cue = this.activeCues[0];

          if (cue) {
            subtitleDisplay.innerHTML = cue.text;
          } else {
            subtitleDisplay.textContent = '';
          }
        };
      }
    }
  }
);

watch(mediaElementRef, async () => {
  await nextTick();
  detachHls();
  await detachWebAudio();

  if (mediaElementRef.value) {
    if (mediaElementType.value === 'video' && hls) {
      hls.attachMedia(mediaElementRef.value);
      hls.on(Hls.Events.ERROR, onHlsEror);
    }

    await mediaWebAudio.context.resume();
    mediaWebAudio.sourceNode = mediaWebAudio.context.createMediaElementSource(
      mediaElementRef.value
    );
    mediaWebAudio.sourceNode.connect(mediaWebAudio.context.destination);
  }
});

watch(
  () => playbackManager.currentSourceUrl,
  (newUrl) => {
    if (hls) {
      hls.stopLoad();
    }

    if (
      mediaElementRef.value &&
      (!newUrl ||
        playbackManager.currentMediaSource?.SupportsDirectPlay ||
        !hls)
    ) {
      /**
       * For the video case, Safari iOS doesn't support hls.js but supports native HLS.
       *
       * We stringify undefined instead of skipping this block when there's no new source url,
       * so the player doesn't restart playback of the previous item
       */
      mediaElementRef.value.src = String(newUrl);
    } else if (
      hls &&
      playbackManager.currentlyPlayingMediaType === 'Video' &&
      newUrl
    ) {
      /**
       * We need to check if HLS.js can handle transcoded audio to remove the video check
       */
      hls.loadSource(newUrl);
    }
  }
);
</script>
