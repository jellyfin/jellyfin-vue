import { RemovableRef, useStorage } from '@vueuse/core';
import { cloneDeep } from 'lodash-es';
import { v4 } from 'uuid';
import { watch } from 'vue';
import { mergeExcludingUnknown } from '@/utils/data-manipulation';
import { useRemote } from '@/composables';

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
  tasks: Array<RunningTask>;
  /**
   * The number of seconds to keep a finished task in the task list
   */
  finishedTasksTimeout: number;
}

/**
 * == UTILITY VARIABLES ==
 */
const storeKey = 'taskManager';

/**
 * == CLASS CONSTRUCTOR ==
 */
class TaskManagerStore {
  /**
   * == STATE ==
   */
  private _defaultState: TaskManagerState = {
    tasks: [],
    finishedTasksTimeout: 5000
  };

  private _state: RemovableRef<TaskManagerState> = useStorage(
    storeKey,
    cloneDeep(this._defaultState),
    sessionStorage,
    {
      mergeDefaults: (storageValue, defaults) =>
        mergeExcludingUnknown(storageValue, defaults)
    }
  );
  /**
   * == GETTERS AND SETTERS ==
   */
  public get tasks(): typeof this._state.value.tasks {
    return this._state.value.tasks;
  }
  public getTask = (id: string): RunningTask | undefined =>
    this._state.value.tasks.find((payload) => payload.id === id);
  /**
   * == ACTIONS ==
   */
  public startTask = (task: RunningTask): void => {
    if (task.progress && (task.progress < 0 || task.progress > 100)) {
      throw new TypeError(
        "[taskManager]: Progress can't be below 0 or above 100"
      );
    }

    if (this.getTask(task.id)) {
      this.updateTask(task);
    } else {
      this._state.value.tasks.push(task);
    }
  };

  public updateTask = (updatedTask: RunningTask): void => {
    const taskIndex = this._state.value.tasks.findIndex(
      (task) => task.id === updatedTask.id
    );

    if (taskIndex >= 0) {
      this._state.value.tasks[taskIndex] = updatedTask;
    }
  };

  public finishTask = (id: string): void => {
    const clearTask = (): void => {
      const taskIndex = this._state.value.tasks.findIndex(
        (task) => task.id === id
      );

      this._state.value.tasks.splice(taskIndex, 1);
    };

    const task = this.getTask(id);

    if (task) {
      if (this._state.value.finishedTasksTimeout > 0) {
        task.progress = 100;
        window.setTimeout(clearTask, this._state.value.finishedTasksTimeout);
      } else {
        clearTask();
      }
    }
  };

  public startConfigSync = (): string => {
    const payload = {
      type: TaskType.ConfigSync,
      id: v4()
    };

    this.startTask(payload);

    return payload.id;
  };

  private _clear = (): void => {
    Object.assign(this._state.value, this._defaultState);
  };

  public constructor() {
    const remote = useRemote();

    /**
     * Handle refresh progress update for library items
     */
    const refreshProgressAction = (type: string, data: object): void => {
      if (
        type === 'RefreshProgress' &&
        'ItemId' in data &&
        typeof data.ItemId === 'string' &&
        'Progress' in data
      ) {
        // TODO: Verify all the different tasks that this message may belong to - here we assume libraries.

        const progress = Number(data.Progress);
        const taskPayload = this.getTask(data.ItemId);
        const payload: RunningTask = {
          type: TaskType.LibraryRefresh,
          id: data.ItemId,
          progress
        };

        /**
         * Start task if update its received and it doesn't exist in the store.
         * Usually when a running task is started somewhere else and the client is accssed later
         */
        if (taskPayload === undefined) {
          this.startTask(payload);
        } else {
          if (progress >= 0 && progress < 100) {
            payload.data = taskPayload.data;
            this.updateTask(payload);
          } else if (progress >= 0) {
            this.finishTask(data.ItemId);
          }
        }
      }
    };
    /**
     * Handle refresh progress update for items that are not libraries
     */
    const libraryChangedAction = (type: string, data: object): void => {
      if (
        type === 'LibraryChanged' &&
        'ItemsUpdated' in data &&
        Array.isArray(data.ItemsUpdated)
      ) {
        for (const id of data.ItemsUpdated) {
          if (id) {
            this.finishTask(id);
          }
        }
      }
    };

    watch(
      () => remote.socket.message,
      () => {
        if (!remote.socket.message) {
          return;
        }

        const { MessageType, Data } = remote.socket.message;

        if (!Data || typeof Data !== 'object') {
          return;
        }

        refreshProgressAction(MessageType, Data);
        libraryChangedAction(MessageType, Data);
      }
    );

    watch(
      () => remote.auth.currentUser,
      () => {
        if (!remote.auth.currentUser) {
          this._clear();
        }
      }
    );
  }
}

const taskManager = new TaskManagerStore();

export default taskManager;
