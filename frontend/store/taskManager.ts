import { ActionTree, MutationTree, GetterTree } from 'vuex';
import { v4 as uuidv4 } from 'uuid';
import { AppState } from '.';

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
 * - ConfigSync: Only the type key is strictly needed. Always start this task using the setConfigSync action.
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

export const defaultState = (): TaskManagerState => ({
  tasks: []
});

export const state = defaultState;

export const getters: GetterTree<TaskManagerState, AppState> = {
  getTaskProgress:
    (state) =>
    (id: string): number | undefined => {
      return state.tasks.find((payload) => {
        return payload.id === id;
      })?.progress;
    },
  getTask:
    (state) =>
    (id: string): RunningTask | undefined => {
      return state.tasks.find((payload) => {
        return payload.id === id;
      });
    }
};

export const mutations: MutationTree<TaskManagerState> = {
  START_TASK(state: TaskManagerState, payload: RunningTask) {
    state.tasks.push(payload);
  },
  UPDATE_TASK(
    state: TaskManagerState,
    { payload, index }: { payload: RunningTask; index: number }
  ) {
    const newArray = Array.from(state.tasks);

    newArray[index] = payload;
    state.tasks = newArray;
  },
  FINISH_TASK(state: TaskManagerState, taskIndex: number) {
    state.tasks.splice(taskIndex);
  },
  RESET(state: TaskManagerState) {
    Object.assign(state, defaultState());
  }
};

function checkTaskIndex(index: number | undefined): void {
  if (typeof index !== 'number') {
    throw new TypeError(
      '[VUEX taskManager]: This task does not exist in taskManager. Did you start it?'
    );
  }
}

export const actions: ActionTree<TaskManagerState, TaskManagerState> = {
  startTask({ commit, getters }, payload: RunningTask) {
    if (payload.progress && (payload.progress < 0 || payload.progress > 100)) {
      throw new TypeError(
        "[VUEX: taskManager]: Progress can't be below 0 or above 100"
      );
    }

    if (getters.getTask(payload.id)) {
      throw new TypeError('[VUEX: taskManager]: This task id already exists');
    }

    commit('START_TASK', payload);
  },
  updateTask(
    { commit, state },
    { newPayload }: { id: string; newPayload: RunningTask }
  ) {
    const taskIndex = state.tasks.findIndex(
      (payload) => payload.id === newPayload.id
    );

    checkTaskIndex(taskIndex);
    commit('UPDATE_TASK', { payload: newPayload, index: taskIndex });
  },
  finishTask({ commit, state }, taskId: string) {
    const taskIndex = state.tasks.findIndex((payload) => payload.id === taskId);

    checkTaskIndex(taskIndex);
    commit('FINISH_TASK', taskIndex);
  },
  setConfigSyncStatus({ commit, state }, value: boolean) {
    const payload = {
      type: TaskType.ConfigSync,
      id: uuidv4()
    };

    if (
      value === true &&
      !state.tasks.some((payload) => payload.type === TaskType.ConfigSync)
    ) {
      commit('START_TASK', payload);
    } else if (value === false) {
      commit(
        'FINISH_TASK',
        state.tasks.find((payload) => payload.type === TaskType.ConfigSync)
      );
    }
  },
  reset({ commit }) {
    commit('RESET');
  }
};
