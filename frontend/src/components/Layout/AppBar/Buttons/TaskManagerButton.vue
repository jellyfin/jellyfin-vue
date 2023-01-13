<template>
  <v-menu
    v-if="showButton"
    v-model="menu"
    :close-on-content-click="false"
    :persistent="false"
    :transition="'slide-y-transition'"
    location="bottom"
    :z-index="500">
    <!-- eslint-disable-next-line vue/no-template-shadow -->
    <template #activator="{ props }">
      <app-bar-button-layout
        :custom-listener="taskList.length > 0 ? menu : undefined"
        :color="buttonColor"
        v-bind="props">
        <template #icon>
          <v-progress-circular v-if="!buttonColor" indeterminate size="24" />
          <v-icon v-else>
            <i-mdi-check />
          </v-icon>
        </template>
        <template #tooltip>
          <span>{{ $t('appbar.tooltips.tasks') }}</span>
        </template>
      </app-bar-button-layout>
    </template>
    <v-card min-width="25em">
      <v-list>
        <v-list-item
          v-for="task in taskList"
          :key="`${task.id}`"
          :title="$t(task.textKey, { ...task.textParams })">
          <template #append>
            <v-progress-circular
              v-if="task.progress !== 100"
              :indeterminate="
                task.progress === undefined || task.progress === 0
              "
              :model-value="task.progress"
              rotate="-90"
              size="24" />
            <v-icon v-else>
              <i-mdi-check />
            </v-icon>
          </template>
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
import { taskManagerStore } from '@/store';
import { RunningTask, TaskType } from '@/store/taskManager';

interface TaskInfo {
  progress: undefined | number;
  textKey: string;
  textParams?: Record<string, string>;
  id: string;
}

const props = withDefaults(
  defineProps<{
    fab?: boolean;
    timeout: number;
  }>(),
  { timeout: 5000 }
);

const menu = ref(false);
const taskList = ref<TaskInfo[]>([]);
const scheduledTimeout = ref(0);
const taskManager = taskManagerStore();

const buttonColor = computed(() => {
  return taskList.value.every((task) => {
    return task.progress === 100;
  })
    ? 'success'
    : undefined;
});

const showButton = computed(() => taskList.value.length > 0);

/**
 *  Clear the tasks list
 */
function clearState(): void {
  taskList.value = [];
}

/**
 * Set a timeout to hide the button
 */
function setTimeout(): void {
  scheduledTimeout.value = window.setTimeout(clearState, props.timeout);
}

/**
 * Locally retrieve and parse the tasks list
 */
function getTaskList(): void {
  const list: Array<TaskInfo> = [];

  for (const task of taskManager.tasks as RunningTask[]) {
    switch (task.type) {
      case TaskType.ConfigSync: {
        list.push({
          progress: undefined,
          textKey: 'appbar.tasks.configSync',
          id: task.id
        });

        break;
      }
      case TaskType.LibraryRefresh: {
        list.push({
          progress: task.progress,
          textKey: 'appbar.tasks.scanningLibrary',
          textParams: {
            library: task.data || ''
          },
          id: task.id
        });

        break;
      }
    }
  }

  const taskIds = new Set(
    (list as TaskInfo[]).map((task) => {
      return task.id;
    })
  );
  const finishedTasks: Array<TaskInfo> = [];

  for (const task of taskList.value) {
    if (!taskIds.has(task.id)) {
      task.progress = 100;
      finishedTasks.push(task);
    }
  }

  taskList.value = [...list, ...finishedTasks];
}

watch(
  taskManager.tasks,
  () => {
    getTaskList();
  },
  { immediate: true }
);

watch(buttonColor, () => {
  window.clearTimeout(scheduledTimeout.value);

  if (buttonColor.value && !menu.value) {
    setTimeout();
  }
});

watch(menu, () => {
  if (menu.value) {
    window.clearTimeout(scheduledTimeout.value);
  } else if (buttonColor.value) {
    setTimeout();
  }
});
</script>
