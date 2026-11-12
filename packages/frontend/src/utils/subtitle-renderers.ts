/**
 * The subtitle renderers the app ships, each with the formats it draws. This is the only declaration of the
 * subtitle formats the client renders itself: the playback capability engine declares exactly these formats to
 * the server (so it delivers them as files instead of burning them into the video), and the player draws a
 * delivered subtitle with the renderer that declares its format.
 */
import ASSSUB from 'assjs';
import { PgsRenderer } from 'libpgs';
import pgssubWorker from 'libpgs/dist/libpgs.worker.js?url';
import type { SubtitleRenderer } from '#/utils/playback-capabilities/subtitles.ts';
import { remote } from '#/plugins/remote/index.ts';

/**
 * A renderer that draws subtitle files over a video element
 */
export interface ClientSubtitleRenderer extends SubtitleRenderer {
  /**
   * Starts drawing the subtitle file at `src` over `video`
   *
   * @returns The function that stops drawing and frees the renderer
   */
  readonly render: (video: HTMLVideoElement, src: string) => Promise<() => void>;
}

/**
 * Draws SubStation Alpha subtitles with assjs, which parses the whole file
 */
async function renderAss(video: HTMLVideoElement, src: string): Promise<() => void> {
  const { data } = await remote.sdk.api!.axiosInstance.get<string>(src, { responseType: 'text' });
  /**
   * video_width works better with ultrawide monitors
   */
  const renderer = new ASSSUB(data, video, { resampling: 'video_width' });

  /**
   * assjs only starts rendering on the element's `play`/`playing` events, and has no method to start it
   * otherwise. The renderer is usually created while the media is already playing (the subtitle file is fetched
   * asynchronously, or the track is chosen during playback), so it would stay empty until the next pause and
   * resume: replay the event for it.
   */
  if (!video.paused) {
    video.dispatchEvent(new Event('playing'));
  }

  return () => {
    renderer.destroy();
  };
}

/**
 * Draws PGS (Blu-ray bitmap) subtitles with libpgs, which fetches the file itself in a worker
 */
async function renderPgs(video: HTMLVideoElement, src: string): Promise<() => void> {
  const renderer = new PgsRenderer({ video, subUrl: src, workerUrl: pgssubWorker });

  return await Promise.resolve(() => {
    renderer.dispose();
  });
}

/**
 * The subtitle renderer registry
 */
export const SUBTITLE_RENDERERS: readonly ClientSubtitleRenderer[] = [
  { name: 'assjs', formats: ['ass', 'ssa'], render: renderAss },
  { name: 'libpgs', formats: ['pgssub'], render: renderPgs }
];

/**
 * The renderer that draws a delivered subtitle format, if the app ships one
 *
 * @param format - The format the server delivers the subtitle in (like `ass`)
 */
export function getSubtitleRenderer(format: string | undefined): ClientSubtitleRenderer | undefined {
  const wanted = format?.toLowerCase();

  return wanted
    ? SUBTITLE_RENDERERS.find(renderer => renderer.formats.some(rendered => rendered.toLowerCase() === wanted))
    : undefined;
}
