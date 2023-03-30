<template>
  <app-bar-button-layout v-if="showButton" :color="buttonColor">
    <template #icon>
      <v-progress-circular v-if="!buttonColor" indeterminate size="24" />
      <v-icon v-else>
        <i-mdi-check />
      </v-icon>
      <v-menu
        v-model="menu"
        :close-on-content-click="false"
        persistent
        :transition="'slide-y-transition'"
        location="bottom"
        :z-index="500">
        <v-card min-width="25em">
          <v-list>
            <v-list-item
              v-for="task in UITaskList"
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
    <template #tooltip>
      <span>{{ $t('appbar.tooltips.tasks') }}</span>
    </template>
  </app-bar-button-layout>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue';
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
const completedTaskList = ref<TaskInfo[]>([]);

const mappedTaskList = computed<TaskInfo[]>(() => {
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

const mappedCompleted = computed(() =>
  mappedTaskList.value.filter((t) => t.progress === 100)
);
const allCompleted = computed(
  () => mappedCompleted.value.length === mappedTaskList.value.length
);
const buttonColor = computed(() =>
  allCompleted.value ? 'success' : undefined
);
const UITaskList = computed(
  () =>
    new Set([
      ...(menu.value
        ? mappedTaskList.value.filter((t) => t.progress !== 100)
        : mappedTaskList.value),
      ...completedTaskList.value
    ])
);
const showButton = computed(() => UITaskList.value.size > 0);

watch([menu, mappedCompleted], () => {
  if (menu.value) {
    const ids = new Set(completedTaskList.value.map((t) => t.id));

    completedTaskList.value.push(
      ...mappedCompleted.value.filter((t) => !ids.has(t.id))
    );
  } else {
    completedTaskList.value = [];
  }
});
</script>
