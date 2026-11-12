/**
 * Reads the exact codec strings of a media file from its headers, without decoding anything, using mediabunny.
 *
 * The result is a small serialisable {@link ProbeResult}, so it can be cached and passed around freely.
 * Frame rate and bitrate are not read here (they come from the server's `MediaStream`), and nothing is asked to
 * WebCodecs: the judge of what plays is the media element, through `navigator.mediaCapabilities`.
 */
import {
  ADTS,
  FLAC,
  Input,
  MATROSKA,
  MP3,
  MP4,
  MPEG_TS,
  OGG,
  PCM_AUDIO_CODECS,
  QTFF,
  UnsupportedInputFormatError,
  UrlSource,
  WAVE,
  WEBM,
  type InputTrack
} from 'mediabunny';
import {
  PROBE_BYTE_BUDGET,
  PROBE_MAX_RETRIES,
  PROBE_RETRY_DELAY_SECONDS,
  PROBE_TIMEOUT_MS
} from './constants.ts';

/**
 * Container formats the probe understands. Named formats only (never `ALL_FORMATS`) so the rest of mediabunny
 * can be left out of the bundle. Same detection order as mediabunny's own `ALL_FORMATS`, without HLS.
 */
const FORMATS = [MP4, QTFF, MATROSKA, WEBM, WAVE, OGG, FLAC, MP3, ADTS, MPEG_TS];

/**
 * Colour description of a video track, with WebCodecs' vocabulary. Any field may be missing.
 */
export interface ProbedColorSpace {
  readonly primaries?: string;
  readonly transfer?: string;
  readonly matrix?: string;
  readonly fullRange?: boolean;
}

interface ProbedTrackBase {
  /**
   * mediabunny's codec name, absent when mediabunny does not know the codec
   */
  readonly codec?: string;
  /**
   * Full codec parameter string (RFC 6381 style), absent when unknown
   */
  readonly codecString?: string;
  /**
   * The container's own codec identifier: the sample entry fourcc in MP4, the `CodecID` in Matroska,
   * the format tag in WAVE, the stream type in MPEG-TS. Available even when the codec is unknown.
   */
  readonly internalCodecId?: string | number;
  /**
   * ISO 639-2/T language code, `und` when unknown
   */
  readonly language: string;
  readonly isDefault: boolean;
  readonly isForced: boolean;
}

/**
 * A video track as read from the file
 */
export interface ProbedVideoTrack extends ProbedTrackBase {
  readonly type: 'video';
  readonly width: number;
  readonly height: number;
  readonly colorSpace: ProbedColorSpace;
  readonly hdr: boolean;
}

/**
 * An audio track as read from the file
 */
export interface ProbedAudioTrack extends ProbedTrackBase {
  readonly type: 'audio';
  readonly channels: number;
  readonly sampleRate: number;
  /**
   * Whether the codec is uncompressed PCM, whose codec string is a WebCodecs name and not a MIME codec
   */
  readonly pcm: boolean;
}

/**
 * Any probed track
 */
export type ProbedTrack = ProbedVideoTrack | ProbedAudioTrack;

/**
 * Why a probe failed:
 * - `timeout`: the overall time limit was reached
 * - `budget-exceeded`: reading the metadata needed more bytes than allowed
 * - `range-unsupported`: the server answered a range request with the whole file (200 instead of 206)
 * - `http-error`: the server answered with an error status
 * - `network`: the request could not be made (offline, DNS, CORS...)
 * - `parse-error`: the file is malformed or uses something mediabunny cannot read
 * - `aborted`: the caller cancelled the probe
 */
export type ProbeFailureReason
  = | 'timeout'
    | 'budget-exceeded'
    | 'range-unsupported'
    | 'http-error'
    | 'network'
    | 'parse-error'
    | 'aborted';

/**
 * Request statistics of one probe, for diagnostics
 */
export interface ProbeStats {
  readonly requests: number;
  readonly bytes: number;
  readonly durationMs: number;
}

/**
 * The outcome of a probe. `cacheable` says whether the outcome depends only on the file (and can be stored
 * until the file changes) or on the network or the server's state at that moment.
 *
 * A track missing from `video` or `audio` never means the stream does not exist: mediabunny skips some
 * stream types (for example unknown MPEG-TS stream types), so missing tracks are evaluated from the server's data.
 */
export type ProbeResult
  = | {
    readonly status: 'ok';
    readonly cacheable: true;
    /**
     * The container's MIME type, without parameters (for example `video/mp4`)
     */
    readonly containerMime: string;
    readonly video: readonly ProbedVideoTrack[];
    readonly audio: readonly ProbedAudioTrack[];
    readonly stats: ProbeStats;
  }
  | {
    readonly status: 'unsupported-container';
    readonly cacheable: true;
    readonly stats: ProbeStats;
  }
  | {
    readonly status: 'failed';
    readonly reason: ProbeFailureReason;
    readonly detail: string;
    readonly cacheable: boolean;
    readonly stats: ProbeStats;
  };

/**
 * Options of {@link probeMediaSource}
 */
export interface ProbeOptions {
  /**
   * Cancels the probe
   */
  readonly signal?: AbortSignal;
  readonly timeoutMs?: number;
  readonly byteBudget?: number;
}

/**
 * Failures that are a property of the file itself, so they can be cached until the file changes.
 * `budget-exceeded` is not one: how much is read depends on the link speed and on the engine's read-ahead.
 */
const DETERMINISTIC_FAILURES = new Set<ProbeFailureReason>(['parse-error']);

/**
 * Thrown inside the request pipeline to stop mediabunny when the probe must end
 */
class ProbeStop extends Error {
  public constructor(public readonly reason: ProbeFailureReason, public readonly detail: string) {
    super(detail);
    this.name = 'ProbeStop';
  }
}

/**
 * Copies the properties of the original response that a constructed `Response` cannot carry
 */
function withOriginalMetadata(response: Response, original: Response): Response {
  Object.defineProperties(response, {
    url: { value: original.url },
    redirected: { value: original.redirected },
    type: { value: original.type }
  });

  return response;
}

/**
 * Returns the internal codec id in a serialisable form
 */
function serialiseCodecId(id: unknown): string | number | undefined {
  return typeof id === 'string' || typeof id === 'number' ? id : undefined;
}

/**
 * Reads the fields every track kind shares
 */
async function readTrackBase(track: InputTrack) {
  const [codec, codecString, internalCodecId, language, disposition] = await Promise.all([
    track.getCodec(),
    track.getCodecParameterString(),
    track.getInternalCodecId(),
    track.getLanguageCode(),
    track.getDisposition()
  ]);

  return {
    codec: codec ?? undefined,
    codecString: codecString ?? undefined,
    internalCodecId: serialiseCodecId(internalCodecId),
    language,
    isDefault: disposition.default,
    isForced: disposition.forced
  };
}

/**
 * Reads the container MIME type and every track of the input
 */
async function readInput(input: Input) {
  const [mimeType, tracks] = await Promise.all([input.getMimeType(), input.getTracks()]);
  const video: ProbedVideoTrack[] = [];
  const audio: ProbedAudioTrack[] = [];

  for (const track of tracks) {
    const base = await readTrackBase(track);

    if (track.isVideoTrack()) {
      const [width, height, colorSpace, hdr] = await Promise.all([
        track.getCodedWidth(),
        track.getCodedHeight(),
        track.getColorSpace(),
        track.hasHighDynamicRange()
      ]);

      video.push({
        ...base,
        type: 'video',
        width,
        height,
        colorSpace: {
          primaries: colorSpace.primaries ?? undefined,
          transfer: colorSpace.transfer ?? undefined,
          matrix: colorSpace.matrix ?? undefined,
          fullRange: colorSpace.fullRange ?? undefined
        },
        hdr
      });
    } else if (track.isAudioTrack()) {
      const [channels, sampleRate] = await Promise.all([track.getNumberOfChannels(), track.getSampleRate()]);

      audio.push({
        ...base,
        type: 'audio',
        channels,
        sampleRate,
        pcm: (PCM_AUDIO_CODECS as readonly string[]).includes(base.codec ?? '')
      });
    }
  }

  return {
    containerMime: mimeType.split(';', 1)[0]!.trim().toLowerCase(),
    video,
    audio
  };
}

/**
 * Cancels a response body that will not be read, ignoring errors
 */
async function discardBody(response: Response): Promise<void> {
  try {
    await response.body?.cancel();
  } catch {}
}

/**
 * State and request pipeline of one probe: counts requests and bytes, enforces the limits, and remembers why
 * the probe had to stop.
 */
class ProbeSession {
  private readonly _startedAt = performance.now();
  private readonly _byteBudget: number;
  /**
   * Records a network error and returns what has to be thrown: the reason to stop, if the probe was told to
   * end (the error is then a consequence of the abort), or the error itself
   */
  private readonly _networkFailure = (error: unknown): unknown => {
    this.lastNetworkError = error;

    return this.stopReason ?? error;
  };

  /**
   * Wraps the response body so every byte is counted against the budget
   */
  private readonly _countBody = (response: Response, body: ReadableStream<Uint8Array>): Response => {
    const reader = body.getReader();
    const counted = new ReadableStream<Uint8Array>({
      pull: async (streamController) => {
        let chunk: ReadableStreamReadResult<Uint8Array>;

        try {
          chunk = await reader.read();
        } catch (error) {
          throw this._networkFailure(error);
        }

        if (chunk.done) {
          streamController.close();

          return;
        }

        this.bytes += chunk.value.byteLength;

        if (this.bytes > this._byteBudget) {
          throw this.end('budget-exceeded', `More than ${this._byteBudget} bytes needed`);
        }

        streamController.enqueue(chunk.value);
      },
      cancel: async reason => reader.cancel(reason)
    });

    return withOriginalMetadata(new Response(counted, {
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    }), response);
  };

  public requests = 0;
  public bytes = 0;
  /**
   * Set once the probe must end; every later request fails with it
   */
  public stopReason: ProbeStop | undefined;
  /**
   * The last error raised by the network itself (not by parsing), to tell both apart at the end
   */
  public lastNetworkError: unknown;
  public readonly controller = new AbortController();

  /**
   * Ends the probe: aborts every request in flight
   */
  public readonly end = (reason: ProbeFailureReason, detail: string): ProbeStop => {
    this.stopReason ??= new ProbeStop(reason, detail);
    this.controller.abort(this.stopReason);

    return this.stopReason;
  };

  /**
   * Retry policy for mediabunny: capped, and never after the probe was told to end.
   *
   * Instead of returning mediabunny's "do not retry" value, the error is thrown again: mediabunny calls this
   * from the `catch` block of the failed request, where "do not retry" means exactly that, throwing the same error
   * (`retriedFetch` and the response reading loop of `UrlSource`, mediabunny 1.65).
   */
  public readonly getRetryDelay = (previousAttempts: number, error: unknown): number => {
    if (error instanceof ProbeStop || this.stopReason || previousAttempts > PROBE_MAX_RETRIES) {
      throw this.stopReason ?? error;
    }

    return PROBE_RETRY_DELAY_SECONDS;
  };

  /**
   * The `fetch` given to mediabunny
   */
  public readonly fetch: typeof fetch = async (input, init) => {
    if (this.stopReason) {
      throw this.stopReason;
    }

    this.requests++;

    let response: Response;

    try {
      response = await fetch(input, {
        ...init,
        signal: init?.signal ? AbortSignal.any([init.signal, this.controller.signal]) : this.controller.signal
      });
    } catch (error) {
      throw this._networkFailure(error);
    }

    if (response.status === 200) {
      void discardBody(response);
      throw this.end('range-unsupported', 'The server answered a range request with the whole file');
    }

    if (!response.ok) {
      void discardBody(response);
      throw this.end('http-error', `HTTP ${response.status}`);
    }

    return response.body ? this._countBody(response, response.body) : response;
  };

  /**
   * Turns whatever made the probe fail into a result
   */
  public readonly toResult = (error: unknown, url: string): ProbeResult => {
    const stats = this.stats;

    if (this.stopReason) {
      const { reason, detail } = this.stopReason;

      return { status: 'failed', reason, detail, cacheable: DETERMINISTIC_FAILURES.has(reason), stats };
    }

    if (error instanceof UnsupportedInputFormatError) {
      return { status: 'unsupported-container', cacheable: true, stats };
    }

    if (this.lastNetworkError !== undefined && error === this.lastNetworkError) {
      const detail = error instanceof Error ? error.name : 'Network error';

      return { status: 'failed', reason: 'network', detail, cacheable: false, stats };
    }

    // The message may contain the URL, which carries the access token
    const detail = error instanceof Error ? error.message.replaceAll(url, '<url>') : String(error);

    return { status: 'failed', reason: 'parse-error', detail, cacheable: true, stats };
  };

  public constructor(byteBudget: number) {
    this._byteBudget = byteBudget;
  }

  public get stats(): ProbeStats {
    return {
      requests: this.requests,
      bytes: this.bytes,
      durationMs: Math.round(performance.now() - this._startedAt)
    };
  }
}

/**
 * Reads the container and the codec strings of every track of a media file over HTTP.
 *
 * Guarded against everything that could make it expensive: capped retries, an overall timeout, a byte budget,
 * and an immediate stop when the server ignores range requests. Never throws: failures are part of the result.
 *
 * Measured cost: one or two requests for every tested container, and no task of 50 ms or more on the main thread
 * even for a 2 hour MP4 with a 3.45 MiB index, so it runs on the main thread.
 *
 * @param url - Static stream URL of the media source. Credentials, if any, go in the query (the server's own
 * URLs use `ApiKey`): an `Authorization` header would force a CORS preflight on every range request.
 */
export async function probeMediaSource(url: string, options: ProbeOptions = {}): Promise<ProbeResult> {
  const { signal, timeoutMs = PROBE_TIMEOUT_MS, byteBudget = PROBE_BYTE_BUDGET } = options;
  const session = new ProbeSession(byteBudget);
  const onCallerAbort = () => session.end('aborted', 'The probe was cancelled');
  const timer = setTimeout(() => session.end('timeout', `No result after ${timeoutMs} ms`), timeoutMs);
  const input = new Input({
    formats: FORMATS,
    source: new UrlSource(url, {
      fetchFn: session.fetch,
      getRetryDelay: session.getRetryDelay,
      handleUnhandledError: () => {
        // Errors are reported through the read that is waiting for them
      }
    })
  });
  const stopped = new Promise<never>((_resolve, reject) => {
    session.controller.signal.addEventListener('abort', () => {
      reject(session.stopReason ?? new ProbeStop('aborted', 'The probe was cancelled'));
    }, { once: true });
  });

  signal?.addEventListener('abort', onCallerAbort, { once: true });

  try {
    if (signal?.aborted) {
      onCallerAbort();
    }

    const result = await Promise.race([readInput(input), stopped]);

    return { status: 'ok', cacheable: true, ...result, stats: session.stats };
  } catch (error) {
    return session.toResult(error, url);
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener('abort', onCallerAbort);
    input.dispose();

    if (!session.controller.signal.aborted) {
      session.controller.abort();
    }
  }
}
