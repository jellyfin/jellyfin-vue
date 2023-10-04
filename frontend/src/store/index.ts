import clientSettings from './clientSettings';
import items from './items';
import taskManager from './taskManager';
import userLibraries from './userLibraries';
import playbackManager from './playbackManager';
import playerElement from './playerElement';
import userItems from './userItems';

/**
 * Get global instance of clientSettings store
 */
export function clientSettingsStore(): typeof clientSettings {
  return clientSettings;
}

/**
 * Get global instance of items store
 */
export function itemsStore(): typeof items {
  return items;
}

/**
 * Get global instance of taskManager store
 */
export function taskManagerStore(): typeof taskManager {
  return taskManager;
}

/**
 * Get global instance of userLibraries store
 */
export function userLibrariesStore(): typeof userLibraries {
  return userLibraries;
}

/**
 * Get global instance of userItems store
 */
export function userItemsStore(): typeof userItems {
  return userItems;
}

/**
 * Get global instance of playbackManager store
 */
export function playbackManagerStore(): typeof playbackManager {
  return playbackManager;
}

/**
 * Get global instance of playerElement store
 */
export function playerElementStore(): typeof playerElement {
  return playerElement;
}

/**
 * Please, leave this export as the only wildcard export
 *
 * Properties and types relevant to each store should be imported from the store
 * directly to avoid polluting the global store namespace.
 */
export * from './globals';
