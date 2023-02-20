import { cloneDeep } from 'lodash-es';
import { nextTick, reactive } from 'vue';
// @ts-expect-error - No types on libass-wasm
import SubtitlesOctopus from '@jellyfin/libass-wasm';
import subtitlesOctopusWorkerUrl from '@jellyfin/libass-wasm/dist/js/subtitles-octopus-worker.js?url';
import { mediaElementRef, playbackManagerStore } from '@/store';
import { useRouter } from '@/composables';

const playbackManager = playbackManagerStore();
let subtitlesOctopus: SubtitlesOctopus | undefined;

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

  public set isStretched(newisStretched: boolean) {
    state.isStretched = newisStretched;
  }

  public get isMinimized(): boolean {
    return useRouter().currentRoute.value.fullPath !== '/playback/video';
  }

  /**
   * == ACTIONS ==
   */
  public toggleMinimize = (): void => {
    /**
     * Destroys SSO before chaning view cause the canvas needs to be destroyed to be recreated in the other view
     */
    playerElement.freeSsaTrack();

    const router = useRouter();

    if (this.isMinimized) {
      router.push('/playback/video');
    } else {
      router.replace(
        typeof router.options.history.state.back === 'string'
          ? router.options.history.state.back
          : '/'
      );
    }
  };

  private _setSsaTrack = async (trackSrc: string): Promise<void> => {
    if (!subtitlesOctopus) {
      subtitlesOctopus = new SubtitlesOctopus({
        video: mediaElementRef.value,
        subUrl: trackSrc,
        workerUrl: subtitlesOctopusWorkerUrl,
        prescaleFactor: 0.5,
        renderAhead: 90
      });
    } else {
      subtitlesOctopus.setTrackByUrl(trackSrc);
    }
  };

  public freeSsaTrack = (): void => {
    if (subtitlesOctopus) {
      try {
        subtitlesOctopus.dispose();
      } catch {}

      subtitlesOctopus = undefined;
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
}

const playerElement = new PlayerElementStore();

export default playerElement;
