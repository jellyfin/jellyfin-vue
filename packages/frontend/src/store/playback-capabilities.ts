/**
 * Runtime state of the playback capability engine shared by the whole app: the capability oracle and what was
 * learned during this session. Nothing here is persisted except the probe results, which live in the api
 * database next to their items. What the session learned belongs to the user and the server it was learned with: it
 * is forgotten when either changes.
 */
import { shallowReactive, watch } from 'vue';
import { createBrowserOracle } from '#/utils/playback-capabilities/oracle.ts';
import {
  getNextFloor,
  type LearnedFloor,
  type PlaybackMethod,
  type PlaybackOutcome,
  type Verdict
} from '#/utils/playback-capabilities/verdict.ts';
import { remote } from '#/plugins/remote/index.ts';
import { apiStore } from '#/store/dbs/api/index.ts';

/**
 * The app's only capability oracle, so every verdict shares its memoised answers
 */
export const capabilityOracle = createBrowserOracle();

/**
 * The learned floor of each stream signature (see {@link LearnedFloor}). Memory only: it is lost on reload.
 * Reactive, so what depends on a floor is updated when a playback teaches a new one.
 */
const learnedFloors = shallowReactive(new Map<string, PlaybackMethod>());

/**
 * The learned floors of this session, as the verdict's environment expects them
 */
export const minimumRung: LearnedFloor = signature => learnedFloors.get(signature);

/**
 * Records what a playback taught about a verdict's streams, so later verdicts for the same signature never start
 * below it. Floors only rise.
 *
 * @param verdict - The verdict the playback was negotiated with
 * @param outcome - What happened: the playback failed at a rung, or the server chose another method
 */
export function recordPlaybackOutcome(verdict: Pick<Verdict, 'method' | 'signature'>, outcome: PlaybackOutcome): void {
  const floor = getNextFloor(verdict, outcome, learnedFloors.get(verdict.signature));

  if (floor !== undefined) {
    learnedFloors.set(verdict.signature, floor);
  }
}

/**
 * Forgets what this session learned about what this client plays: the oracle's answers and the learned floors. The
 * stored probe results stay: they are about files.
 */
function forgetSessionMemory(): void {
  capabilityOracle.clear();
  learnedFloors.clear();
}

/**
 * Forgets everything learned about what this client plays: the session's memory (see {@link forgetSessionMemory}) and
 * the stored probe results. The memory is cleared even if clearing the stored probes fails, in which case it rejects.
 */
export async function forgetLearnedCompatibility(): Promise<void> {
  forgetSessionMemory();
  await apiStore.mediaProbesClear();
}

/**
 * What a session learned was learned with one user on one server: the media sources it names are that server's, and
 * the methods it learned were limited by that user's policy. A change of either (logout, another user, another server)
 * forgets it; the stored probes stay, since they are about files.
 */
watch([() => remote.auth.currentServer.value?.Id, () => remote.auth.currentUserId.value], forgetSessionMemory);
