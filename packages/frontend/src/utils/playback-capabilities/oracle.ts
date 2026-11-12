/**
 * The judge of what plays: `navigator.mediaCapabilities.decodingInfo`, asked on the main thread (it describes
 * the media element of the page), with a timeout, memoised per configuration and never rejecting.
 *
 * Only engines without `mediaCapabilities` at all fall back to `canPlayType` (direct play) and
 * `MediaSource.isTypeSupported` (media source playback), asked with the same strings.
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
 * Answers questions about decoding configurations. Never rejects.
 */
export interface CapabilityOracle {
  query: (config: MediaDecodingConfiguration) => Promise<CapabilityAnswer>;
  /**
   * Forgets every answer
   */
  clear: () => void;
}

/**
 * A function that asks the browser one question. May reject or never settle.
 */
export type CapabilityQuery = (config: MediaDecodingConfiguration) => Promise<CapabilityAnswer>;

/**
 * Options of {@link createOracle}
 */
export interface OracleOptions {
  readonly timeoutMs?: number;
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
 * Keeps only the three booleans of an answer
 */
function normaliseAnswer({ supported, smooth, powerEfficient }: CapabilityAnswer): CapabilityAnswer {
  return { supported, smooth, powerEfficient };
}

/**
 * Wraps a query function into an oracle:
 * - answers are memoised by {@link getConfigurationKey}, and concurrent identical questions share one query
 * - a rejection (for example the `TypeError` of an invalid configuration) counts as unsupported
 * - a question without answer within the timeout counts as unsupported; it is not asked again while pending,
 * and its late answer, if it ever comes, replaces the timeout for later questions
 */
export function createOracle(query: CapabilityQuery, options: OracleOptions = {}): CapabilityOracle {
  const timeoutMs = options.timeoutMs ?? ORACLE_QUERY_TIMEOUT_MS;
  let answers = new Map<string, Promise<CapabilityAnswer>>();

  const ask = (key: string, config: MediaDecodingConfiguration): Promise<CapabilityAnswer> => {
    const store = answers;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const answered = (async () => {
      try {
        return normaliseAnswer(await query(config));
      } catch {
        return UNSUPPORTED;
      }
    })();
    const timedOut = new Promise<CapabilityAnswer>((resolve) => {
      timer = setTimeout(() => {
        resolve(UNSUPPORTED);
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

    return Promise.race([answered, timedOut]);
  };

  return {
    query: async (config) => {
      const key = getConfigurationKey(config);
      let answer = answers.get(key);

      if (!answer) {
        answer = ask(key, config);
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
 * The query used only when `navigator.mediaCapabilities` does not exist: the same strings are asked to
 * `canPlayType` for direct play and to `isTypeSupported` for media source playback. There is nothing to tell
 * smoothness or power efficiency, so a supported answer is assumed to be both.
 */
export function createFallbackQuery(apis: FallbackApis): CapabilityQuery {
  const answer = (config: MediaDecodingConfiguration): CapabilityAnswer => {
    const contentType = config.video?.contentType ?? config.audio?.contentType ?? '';
    const supported = config.type === 'file'
      ? apis.canPlayType(contentType) !== ''
      : apis.isTypeSupported?.(contentType) ?? false;

    return supported ? { supported, smooth: true, powerEfficient: true } : UNSUPPORTED;
  };

  return config => Promise.resolve(answer(config));
}

/**
 * The browser's own query: `decodingInfo` when the engine has it, the fallback otherwise
 */
function getBrowserQuery(): CapabilityQuery {
  if ('mediaCapabilities' in navigator) {
    return async config => navigator.mediaCapabilities.decodingInfo(config);
  }

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
 * Creates the oracle backed by the browser
 */
export function createBrowserOracle(options?: OracleOptions): CapabilityOracle {
  return createOracle(getBrowserQuery(), options);
}
