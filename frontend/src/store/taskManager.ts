import { RemovableRef, useStorage } from '@vueuse/core';
import { cloneDeep } from 'lodash-es';
import { v4 } from 'uuid';
import { computed } from 'vue';
import { mergeExcludingUnknown } from '@/utils/data-manipulation';

/**
 * == INTERFACES ==
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
}

/**
 * == HELPER FUNCTIONS ==
 */
/**
 * Type guard function for checking that the given task exists
 */
function checkTaskIndex(index: number | undefined): void {
  if (typeof index !== 'number') {
    throw new TypeError(
      '[taskManager]: This task does not exist in taskManager. Did you start it?'
    );
  }
}

/**
 * == STATE VARIABLES ==
 */
const storeKey = 'taskManager';
const defaultState: TaskManagerState = {
  tasks: []
};

const state: RemovableRef<TaskManagerState> = useStorage(
  storeKey,
  cloneDeep(defaultState),
  sessionStorage,
  {
    mergeDefaults: (storageValue, defaults) =>
      mergeExcludingUnknown(storageValue, defaults)
  }
);

/**
 * == CLASS CONSTRUCTOR ==
 */
class TaskManagerStore {
  /**
   * == GETTERS ==
   */
  public get tasks(): typeof state.value.tasks {
    return state.value.tasks;
  }
  public getTask = (id: string): RunningTask | undefined => {
    return computed(() => {
      return state.value.tasks.find((payload) => {
        return payload.id === id;
      });
    }).value;
  };
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
      state.value.tasks.push(task);
    }
  };

  public updateTask = (updatedTask: RunningTask): void => {
    const taskIndex = state.value.tasks.findIndex(
      (task) => task.id === updatedTask.id
    );

    checkTaskIndex(taskIndex);

    const newArray = [...state.value.tasks];

    newArray[taskIndex] = updatedTask;
    state.value.tasks = newArray;
  };

  public finishTask = (id: string): void => {
    const taskIndex = state.value.tasks.findIndex((task) => task.id === id);

    checkTaskIndex(taskIndex);
    state.value.tasks.splice(taskIndex);
  };

  public startConfigSync = (): void => {
    if (!state.value.tasks.some((task) => task.type === TaskType.ConfigSync)) {
      const payload = {
        type: TaskType.ConfigSync,
        id: v4()
      };

      this.startTask(payload);
    }
  };

  public stopConfigSync = (): void => {
    state.value.tasks.splice(
      state.value.tasks.findIndex(
        (payload) => payload.type === TaskType.ConfigSync
      )
    );
  };
}

const taskManager = new TaskManagerStore();

export default taskManager;
