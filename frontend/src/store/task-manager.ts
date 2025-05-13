import { v4 } from 'uuid';
import { watch } from 'vue';
import { isArray, isNil, isObj, isStr, sealed } from '@jellyfin-vue/shared/validation';
import { CommonStore } from '#/store/super/common-store';
import { remote } from '#/plugins/remote';
import { apiStore } from '#/store/dbs/api';

/**
 * == INTERFACES AND TYPES ==
 */

export enum TaskType {
  ConfigSync = 1,
  LibraryRefresh = 2
}

/**
 * Explanation for the keys:
 * - type: Defines the task type. This is used in the UI to give better context to the user of what task is being used.
 * - id: It's an identifier for the task. Used when updating tasks
 * - data: Additional context to be given in the UI. For instance, in library scanning, this is expected to be the library name
 * - progress: Current progress, ranging from 0-100.
 *
 * The meaning of fields are different based on the task type:
 * - ConfigSync: Only the type key is strictly needed. Always start this task using the startConfigSync action.
 * - LibraryRefresh: Id must be the ItemId of the library. Data should be the library's name.
 */
export interface RunningTask {
  type: TaskType;
  id: string;
  data?: string;
  progress?: number;
}

export interface TaskManagerState {
  tasks: RunningTask[];
}

/**
 * == CLASS CONSTRUCTOR ==
 */
@sealed
class TaskManagerStore extends CommonStore<TaskManagerState, 'tasks'> {
  /**
   * == NON REACTIVE STATE AND UTILITY VARIABLES ==
   * Reactive state is defined in the super() constructor
   */
  private readonly _finishedTasksTimeout = 5000;
  /**
   * == GETTERS AND SETTERS ==
   */
  public readonly getTask = (id: string): RunningTask | undefined =>
    this._state.value.tasks.find(payload => payload.id === id);

  /**
   * == ACTIONS ==
   */
  public readonly startTask = (task: RunningTask): void => {
    if (task.progress && (task.progress < 0 || task.progress > 100)) {
      throw new TypeError(
        `[${this._storeKey}]: Progress can't be below 0 or above 100`
      );
    }

    if (isNil(this.getTask(task.id))) {
      this._state.value.tasks.push(task);
    }
  };

  public readonly finishTask = (id: string): void => {
    const clearTask = (): void => {
      const taskIndex = this._state.value.tasks.findIndex(
        task => task.id === id
      );

      this._state.value.tasks.splice(taskIndex, 1);
    };

    const task = this.getTask(id);

    if (task) {
      task.progress = 100;
      globalThis.setTimeout(clearTask, this._finishedTasksTimeout);
    }
  };

  public readonly startConfigSync = (): string => {
    const payload = {
      type: TaskType.ConfigSync,
      id: v4()
    };

    this.startTask(payload);

    return payload.id;
  };

  public constructor() {
    super({
      defaultState: () => ({
        tasks: []
      }),
      storeKey: 'taskManager',
      persistenceType: 'sessionStorage',
      resetOnLogout: true
    });

    /**
     * Handle refresh progress update for library items
     */
    const refreshProgressAction = async (type: string, data: object) => {
      if (
        type === 'RefreshProgress'
        && 'ItemId' in data
        && isStr(data.ItemId)
        && 'Progress' in data
      ) {
        // TODO: Verify all the different tasks that this message may belong to - here we assume libraries.

        const progress = Number(data.Progress);
        const taskPayload = this.getTask(data.ItemId);

        /**
         * Start task if update its received and it doesn't exist in the store.
         * Usually when a running task is started somewhere else and the client is accssed later
         */
        if (isNil(taskPayload)) {
          const item = await apiStore.getItemById(data.ItemId);

          if (item?.Id && item.Name) {
            this.startTask({
              type: TaskType.LibraryRefresh,
              id: item.Id,
              data: item.Name,
              progress
            });
          }
        } else if (progress >= 0 && progress < 100) {
          taskPayload.progress = progress;
        } else if (progress >= 0) {
          this.finishTask(data.ItemId);
        }
      }
    };
    /**
     * Handle refresh progress update for items that are not libraries
     */
    const libraryChangedAction = (type: string, data: object): void => {
      if (
        type === 'LibraryChanged'
        && 'ItemsUpdated' in data
        && isArray(data.ItemsUpdated)
      ) {
        for (const id of data.ItemsUpdated) {
          if (isStr(id)) {
            this.finishTask(id);
          }
        }
      }
    };

    watch(
      remote.socket.message,
      () => {
        if (!remote.socket.message.value) {
          return;
        }

        const { MessageType, Data } = remote.socket.message.value;

        if (!Data || !isObj(Data)) {
          return;
        }

        void refreshProgressAction(MessageType, Data);
        libraryChangedAction(MessageType, Data);
      }
    );
  }
}

export const taskManager = new TaskManagerStore();
