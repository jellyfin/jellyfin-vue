<template>
  <v-menu
    v-if="showButton"
    v-model="menu"
    :close-on-content-click="false"
    :persistent="false"
    :transition="'slide-y-transition'"
    location="bottom"
    :z-index="500">
    <template #activator="{ props: menuProps }">
      <app-bar-button-layout
        :custom-listener="taskList.length > 0 ? menu : undefined"
        :color="buttonColor"
        v-bind="menuProps">
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
import { ref, computed, watch, toRaw } from 'vue';
import { taskManagerStore } from '@/store';
import { TaskType } from '@/store/taskManager';

interface TaskInfo {
  progress: undefined | number;
  textKey: string;
  textParams?: Record<string, string>;
  id: string;
}

defineProps<{ fab?: boolean }>();

const menu = ref(false);
const taskManager = taskManagerStore();
let frozenTaskList: readonly TaskInfo[] = [];
const runningTaskList = computed<TaskInfo[]>(() => {
  return taskManager.tasks.map((t) => {
    switch (t.type) {
      case TaskType.ConfigSync: {
        return {
          progress: t.progress,
          textKey: 'appbar.tasks.configSync',
          id: t.id
        };
      }
      case TaskType.LibraryRefresh: {
        return {
          progress: t.progress,
          textKey: 'appbar.tasks.scanningLibrary',
          textParams: {
            library: t.data ?? ''
          },
          id: t.id
        };
      }
    }
  });
});

const allCompleted = computed(() =>
  runningTaskList.value.every((t) => t.progress === 100)
);

const buttonColor = computed(() =>
  allCompleted.value ? 'success' : undefined
);

const taskList = computed(() =>
  menu.value && allCompleted.value ? frozenTaskList : runningTaskList.value
);

const showButton = computed(() => taskList.value.length > 0);

watch([menu, allCompleted], () => {
  if (menu.value && allCompleted.value) {
    frozenTaskList = Object.freeze([...toRaw(runningTaskList.value)]);
  }
});
</script>
