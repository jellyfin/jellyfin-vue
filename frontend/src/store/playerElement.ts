/**
 * This store handles the state of the local player.
 *
 * In the other part, playbackManager is suited to handle the playback state in
 * an agnostic way, regardless of where the media is being played (remotely or locally)
 */
import { cloneDeep } from 'lodash-es';
import { nextTick, reactive, watch } from 'vue';
import JASSUB from 'jassub';
import jassubWorker from 'jassub/dist/jassub-worker.js?url';
import jassubLegacyWorker from 'jassub/dist/jassub-worker-legacy.js?url';
import 'jassub/dist/jassub-worker.wasm?url';
import jassubDefaultFont from 'jassub/dist/default.woff2?url';
import { mediaElementRef, playbackManagerStore } from '@/store';
import { useRouter } from '@/composables';

const playbackManager = playbackManagerStore();
let jassub: JASSUB | undefined;
const fullscreenRoute = '/playback/video';

/**
 * == INTERFACES ==
 */
interface PlayerElementState {
  isFullscreenMounted: boolean;
  isPiPMounted: boolean;
  isStretched: boolean;
}

/**
 * == STATE VARIABLES ==
 */
const defaultState: PlayerElementState = {
  isFullscreenMounted: false,
  isPiPMounted: false,
  isStretched: true
};

const state = reactive<PlayerElementState>(cloneDeep(defaultState));

/**
 * == CLASS CONSTRUCTOR ==
 */
class PlayerElementStore {
  /**
   * == GETTERS ==
   */
  public get isFullscreenMounted(): boolean {
    return state.isFullscreenMounted;
  }

  public set isFullscreenMounted(newIsMounted: boolean) {
    state.isFullscreenMounted = newIsMounted;
  }

  public get isPiPMounted(): boolean {
    return state.isPiPMounted;
  }

  public set isPiPMounted(newIsPipMounted: boolean) {
    state.isPiPMounted = newIsPipMounted;
  }

  public get isStretched(): boolean {
    return state.isStretched;
  }

  public set isStretched(newIsStretched: boolean) {
    state.isStretched = newIsStretched;
  }

  public get isFullscreenVideoPlayer(): boolean {
    return useRouter().currentRoute.value.fullPath === fullscreenRoute;
  }

  /**
   * == ACTIONS ==
   */
  public toggleFullscreenVideoPlayer = (): void => {
    /**
     * Destroys SSO before chaning view cause the canvas needs to be destroyed to be recreated in the other view
     */
    playerElement.freeSsaTrack();

    const router = useRouter();

    if (!this.isFullscreenVideoPlayer) {
      router.push(fullscreenRoute);
    } else {
      router.replace(
        typeof router.options.history.state.back === 'string'
          ? router.options.history.state.back
          : '/'
      );
    }
  };

  private _setSsaTrack = async (trackSrc: string): Promise<void> => {
    if (
      !jassub &&
      mediaElementRef.value &&
      mediaElementRef.value instanceof HTMLVideoElement
    ) {
      jassub = new JASSUB({
        video: mediaElementRef.value,
        subUrl: trackSrc,
        workerUrl: jassubWorker,
        legacyWorkerUrl: jassubLegacyWorker,
        availableFonts: { 'liberation sans': jassubDefaultFont },
        // Both parameters needed for subs to work on iOS
        prescaleFactor: 0.8,
        onDemandRender: false
      });
    } else if (jassub) {
      jassub.setTrackByUrl(trackSrc);
    }
  };

  public freeSsaTrack = (): void => {
    if (jassub) {
      try {
        jassub.destroy();
      } catch {}

      jassub = undefined;
    }
  };

  /**
   * Applies the current subtitle from the playbackManager store
   *
   * It first disables all the VTT and SSA subtitles
   * It then find the potential index of the applied VTT sub
   * Or the PlaybackExternalTrack object of the potential SSA sub
   *
   * If external and VTT, it shows the correct one
   * If external and SSA, it loads it in SO
   *
   * If embedded, a new transcode is automatically fetched from the playbackManager watchers.
   */
  public applyCurrentSubtitle = async (): Promise<void> => {
    await nextTick();

    if (mediaElementRef.value) {
      /**
       * Disabling VTT and SSA subs at first
       */
      for (const textTrack of mediaElementRef.value.textTracks) {
        if (textTrack.mode !== 'disabled') {
          textTrack.mode = 'disabled';
        }
      }

      playerElement.freeSsaTrack();

      /**
       * Finding (if it exists) the VTT or SSA track associated to the newly picked subtitle
       */
      const vttIdx =
        playbackManager.currentItemVttParsedSubtitleTracks.findIndex(
          (sub) => sub.srcIndex === playbackManager.currentSubtitleStreamIndex
        );

      const ass = playbackManager.currentItemAssParsedSubtitleTracks.find(
        (sub) => sub.srcIndex === playbackManager.currentSubtitleStreamIndex
      );

      if (vttIdx !== -1 && mediaElementRef.value.textTracks[vttIdx]) {
        /**
         * If VTT found, applying it
         */
        mediaElementRef.value.textTracks[vttIdx].mode = 'showing';
      } else if (ass !== undefined && ass.src) {
        /**
         * If SSA, using Subtitle Opctopus
         */
        playerElement._setSsaTrack(ass.src);
      }
    }
  };

  public constructor() {
    watch(
      () => playbackManager.currentItem,
      (newValue, oldValue) => {
        const router = useRouter();

        if (
          (!newValue &&
            router.currentRoute.value.fullPath === fullscreenRoute) ||
          (newValue &&
            !oldValue &&
            playbackManager.currentlyPlayingMediaType === 'Video')
        ) {
          /**
           * If no item is present, we either manually loaded this or playback is stopped
           * OR
           * If there was no item and there's now a video, default to going FS
           */
          playerElement.toggleFullscreenVideoPlayer();
        }
      },
      { immediate: true }
    );
  }
}

const playerElement = new PlayerElementStore();

export default playerElement;
