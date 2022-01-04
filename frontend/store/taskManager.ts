import { defineStore } from 'pinia';

function checkTaskIndex(index: number | undefined): void {
  if (typeof index !== 'number') {
    throw new TypeError(
      '[taskManager]: This task does not exist in taskManager. Did you start it?'
    );
  }
}

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
 * - ConfigSync: Only the type key is needed, the rest will be ignored. Use
 * - LibraryRefresh: Id must be the ItemId of the library. Data should be the library's name.
 */
export interface RunningTask {
  type: TaskType;
  id?: string;
  data?: string;
  progress?: number;
}

export interface TaskManagerState {
  tasks: Array<RunningTask>;
}

export const taskManagerStore = defineStore('taskManager', {
  state: () => {
    return {
      tasks: []
    } as TaskManagerState;
  },
  actions: {
    startTask(task: RunningTask): void {
      if (task.progress && (task.progress < 0 || task.progress > 100)) {
        throw new TypeError(
          "[taskManager]: Progress can't be below 0 or above 100"
        );
      }

      this.tasks.push(task);
    },
    updateTask(updatedTask: RunningTask): void {
      const taskIndex = this.tasks.findIndex(
        (task) => task.id === updatedTask.id
      );

      checkTaskIndex(taskIndex);
      const newArray = Array.from(this.tasks);

      newArray[taskIndex] = updatedTask;
      this.tasks = newArray;
    },
    finishTask(id: string): void {
      const taskIndex = this.tasks.findIndex((task) => task.id === id);

      checkTaskIndex(taskIndex);
      this.tasks.splice(taskIndex);
    },
    startConfigSync(): void {
      const payload = {
        type: TaskType.ConfigSync
      };

      this.startTask(payload);
    },
    stopConfigSync(): void {
      this.tasks.splice(
        this.tasks.findIndex((payload) => payload.type === TaskType.ConfigSync)
      );
    }
  },
  getters: {
    getTask:
      (state) =>
      (id: string): RunningTask | undefined => {
        return state.tasks.find((payload) => {
          return payload.id === id;
        });
      }
  }
});
