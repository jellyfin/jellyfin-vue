/**
 * The judge of what plays: `navigator.mediaCapabilities.decodingInfo`, asked on the main thread (it describes
 * the media element of the page), with a timeout, memoised per configuration and never rejecting.
 *
 * When `decodingInfo` refuses a question (it rejects, typically with a `TypeError` for a MIME type it does not
 * handle) or does not answer it in time, the engine's other native API is asked with the same string: `canPlayType`
 * for direct play, `MediaSource.isTypeSupported` for media source playback. Engines without `mediaCapabilities` at all
 * only have those. An answer of "unsupported" is final, and a question neither API answers is unsupported.
 */
import { ORACLE_QUERY_TIMEOUT_MS } from './constants.ts';

/**
 * What the browser answers about one configuration
 */
export interface CapabilityAnswer {
  readonly supported: boolean;
  readonly smooth: boolean;
  readonly powerEfficient: boolean;
}

/**
 * What a question is about besides its configuration
 */
export interface QueryContext {
  /**
   * The MIME type of the whole file the stream belongs to, without parameters (for example `video/x-matroska` for
   * the audio of a Matroska video). `decodingInfo` asks about one stream, with the top-level type of the stream,
   * but `canPlayType` asks about a file: the fallback also asks it with the file's own MIME type.
   */
  readonly fileType?: string;
  /**
   * Whether the display is HDR when the question is asked (undefined when the engine cannot tell). An engine may answer
   * HDR questions according to the display, so the same question on another display is another question.
   */
  readonly hdrDisplay?: boolean;
}

/**
 * Answers questions about decoding configurations. Never rejects.
 */
export interface CapabilityOracle {
  query: (config: MediaDecodingConfiguration, context?: QueryContext) => Promise<CapabilityAnswer>;
  /**
   * Forgets every answer
   */
  clear: () => void;
}

/**
 * A function that asks the browser one question. May reject or never settle.
 */
export type CapabilityQuery = (config: MediaDecodingConfiguration, context?: QueryContext) => Promise<CapabilityAnswer>;

/**
 * Options of {@link createOracle}
 */
export interface OracleOptions {
  readonly timeoutMs?: number;
  /**
   * Asked when the query rejects (the engine refused the question rather than answering it)
   */
  readonly fallback?: CapabilityQuery;
}

/**
 * The answer for anything the browser rejects or does not answer
 */
export const UNSUPPORTED: CapabilityAnswer = Object.freeze({ supported: false, smooth: false, powerEfficient: false });

/**
 * Serialises a value with its object keys sorted, skipping undefined members
 */
function stableStringify(value: unknown): string {
  if (Array.isArray(value)) {
    return `[${value.map(item => stableStringify(item)).join(',')}]`;
  }

  if (value && typeof value === 'object') {
    const entries = Object.entries(value)
      .filter(([, member]) => member !== undefined)
      .toSorted(([a], [b]) => a.localeCompare(b))
      .map(([key, member]) => `${JSON.stringify(key)}:${stableStringify(member)}`);

    return `{${entries.join(',')}}`;
  }

  return JSON.stringify(value);
}

/**
 * A stable key for a configuration: the same question always gets the same key, whatever the order of its
 * members and whether absent members are left out or set to undefined
 */
export function getConfigurationKey(config: MediaDecodingConfiguration): string {
  return stableStringify(config);
}

/**
 * The memo key of a question: its configuration, the file it is about (the fallback's answer may depend on it) and the
 * display it is asked on
 */
function getQuestionKey(config: MediaDecodingConfiguration, context: QueryContext | undefined): string {
  const parts = [getConfigurationKey(config)];

  if (context?.fileType) {
    parts.push(`of ${context.fileType}`);
  }

  if (context?.hdrDisplay !== undefined) {
    parts.push(context.hdrDisplay ? 'on HDR' : 'on SDR');
  }

  return parts.join(' ');
}

/**
 * Keeps only the three booleans of an answer
 */
function normaliseAnswer({ supported, smooth, powerEfficient }: CapabilityAnswer): CapabilityAnswer {
  return { supported, smooth, powerEfficient };
}

/**
 * Asks the fallback, turning a rejection into unsupported
 */
async function askFallback(
  fallback: CapabilityQuery,
  config: MediaDecodingConfiguration,
  context: QueryContext | undefined
): Promise<CapabilityAnswer> {
  try {
    return normaliseAnswer(await fallback(config, context));
  } catch {
    return UNSUPPORTED;
  }
}

/**
 * Asks a query, turning a rejection into the fallback's answer, or into unsupported
 */
async function askOnce(
  query: CapabilityQuery,
  config: MediaDecodingConfiguration,
  context: QueryContext | undefined,
  fallback?: CapabilityQuery
): Promise<CapabilityAnswer> {
  try {
    return normaliseAnswer(await query(config, context));
  } catch {
    return fallback ? askFallback(fallback, config, context) : UNSUPPORTED;
  }
}

/**
 * Wraps a query function into an oracle:
 * - answers are memoised by {@link getConfigurationKey}, the file the question is about and the display it is asked on,
 * and concurrent identical questions share one query
 * - a rejection means the engine refused the question: the fallback is asked, if any, otherwise it counts as
 * unsupported. A resolved "unsupported" is final.
 * - a question without answer within the timeout counts as unsupported; it is not asked again while pending,
 * and its late answer, if it ever comes, replaces the timeout for later questions
 */
export function createOracle(query: CapabilityQuery, options: OracleOptions = {}): CapabilityOracle {
  const timeoutMs = options.timeoutMs ?? ORACLE_QUERY_TIMEOUT_MS;
  let answers = new Map<string, Promise<CapabilityAnswer>>();

  const ask = async (key: string, config: MediaDecodingConfiguration, context?: QueryContext): Promise<CapabilityAnswer> => {
    const store = answers;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const answered = askOnce(query, config, context, options.fallback);
    const timedOut = Symbol('timed out');
    const timeout = new Promise<typeof timedOut>((resolve) => {
      timer = setTimeout(() => {
        resolve(timedOut);
      }, timeoutMs);
    });

    void (async () => {
      const answer = await answered;

      clearTimeout(timer);

      // A late answer replaces the timeout, unless the oracle was cleared meanwhile
      if (store.has(key)) {
        store.set(key, Promise.resolve(answer));
      }
    })();

    const answer = await Promise.race([answered, timeout]);

    if (answer !== timedOut) {
      return answer;
    }

    if (!options.fallback) {
      return UNSUPPORTED;
    }

    let fallbackTimer: ReturnType<typeof setTimeout> | undefined;
    const fallbackAnswer = await Promise.race([
      askFallback(options.fallback, config, context),
      new Promise<CapabilityAnswer>((resolve) => {
        fallbackTimer = setTimeout(() => {
          resolve(UNSUPPORTED);
        }, timeoutMs);
      })
    ]);

    clearTimeout(fallbackTimer);

    return fallbackAnswer;
  };

  return {
    query: async (config, context) => {
      const key = getQuestionKey(config, context);
      let answer = answers.get(key);

      if (!answer) {
        answer = ask(key, config, context);
        answers.set(key, answer);
      }

      return answer;
    },
    clear: () => {
      answers = new Map();
    }
  };
}

/**
 * The functions the fallback needs, feature-detected by the caller
 */
export interface FallbackApis {
  /**
   * `HTMLMediaElement.prototype.canPlayType`, bound to an element
   */
  readonly canPlayType: (type: string) => string;
  /**
   * `MediaSource.isTypeSupported` or `ManagedMediaSource.isTypeSupported`, if the engine has any
   */
  readonly isTypeSupported?: (type: string) => boolean;
}

/**
 * The same question asked with the MIME type of the file the stream belongs to, keeping the `codecs` parameter
 * (`audio/x-matroska; codecs="opus"` of a `video/x-matroska` file asks `video/x-matroska; codecs="opus"`).
 * Undefined when there is no other MIME type to ask with.
 */
function getFileContentType(contentType: string, fileType: string | undefined): string | undefined {
  const [mime = '', ...parameters] = contentType.split(';');

  if (!fileType || fileType.toLowerCase() === mime.trim().toLowerCase()) {
    return;
  }

  return [fileType, ...parameters].join(';');
}

/**
 * The query for questions `decodingInfo` refuses, and for engines without `navigator.mediaCapabilities`: the
 * same strings are asked to `canPlayType` for direct play ("probably" and "maybe" count as supported) and to
 * `isTypeSupported` for media source playback. There is nothing to tell smoothness or power efficiency, so a
 * supported answer is assumed to be both.
 *
 * `canPlayType` asks about a whole file, not about one of its streams: when the stream's own MIME type is not
 * playable and the question says which file the stream belongs to, the same codec is also asked with the file's
 * MIME type (an engine may know Matroska only as `video/x-matroska`, never as `audio/x-matroska`).
 */
export function createFallbackQuery(apis: FallbackApis): CapabilityQuery {
  const answer = (config: MediaDecodingConfiguration, context?: QueryContext): CapabilityAnswer => {
    const contentType = config.video?.contentType ?? config.audio?.contentType ?? '';
    let supported: boolean;

    if (config.type === 'file') {
      const fileContentType = getFileContentType(contentType, context?.fileType);

      supported = apis.canPlayType(contentType) !== ''
        || (fileContentType !== undefined && apis.canPlayType(fileContentType) !== '');
    } else {
      supported = apis.isTypeSupported?.(contentType) ?? false;
    }

    return supported ? { supported, smooth: true, powerEfficient: true } : UNSUPPORTED;
  };

  return (config, context) => Promise.resolve(answer(config, context));
}

/**
 * The engine's `canPlayType` and `isTypeSupported`, feature-detected
 */
function getNativeFallback(): CapabilityQuery {
  const element = document.createElement('video');
  // `ManagedMediaSource` is not in TypeScript's DOM library yet
  const { ManagedMediaSource } = globalThis as { ManagedMediaSource?: Pick<typeof MediaSource, 'isTypeSupported'> };
  const mediaSource = ManagedMediaSource ?? ('MediaSource' in globalThis ? MediaSource : undefined);

  return createFallbackQuery({
    canPlayType: type => element.canPlayType(type),
    isTypeSupported: mediaSource ? type => mediaSource.isTypeSupported(type) : undefined
  });
}

/**
 * Creates the oracle backed by the browser: `decodingInfo`, with `canPlayType` / `isTypeSupported` for the
 * questions it refuses, or those alone in engines without `mediaCapabilities`
 */
export function createBrowserOracle(options: Pick<OracleOptions, 'timeoutMs'> = {}): CapabilityOracle {
  const fallback = getNativeFallback();

  // decodingInfo asks about the stream alone: the file a question is about only matters to the fallback
  return 'mediaCapabilities' in navigator
    ? createOracle(async config => navigator.mediaCapabilities.decodingInfo(config), { ...options, fallback })
    : createOracle(fallback, options);
}
