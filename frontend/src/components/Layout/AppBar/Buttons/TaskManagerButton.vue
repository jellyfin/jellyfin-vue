<template>
  <AppBarButtonLayout
    v-if="showButton"
    :color="buttonColor">
    <template #icon>
      <VProgressCircular
        v-if="!buttonColor"
        indeterminate
        size="24" />
      <VIcon v-else>
        <IMdiCheck />
      </VIcon>
      <VMenu
        v-model="menu"
        :close-on-content-click="false"
        persistent
        :transition="'slide-y-transition'"
        location="bottom"
        :z-index="1006">
        <VCard min-width="25em">
          <VList>
            <VListItem
              v-for="task in UITaskList"
              :key="`${task.id}`"
              :title="$t(task.textKey, { ...task.textParams })">
              <template #append>
                <VProgressCircular
                  v-if="task.progress !== 100"
                  :indeterminate="
                    task.progress === undefined || task.progress === 0
                  "
                  :model-value="task.progress"
                  size="24" />
                <VIcon v-else>
                  <IMdiCheck />
                </VIcon>
              </template>
            </VListItem>
          </VList>
        </VCard>
      </VMenu>
    </template>
    <template #tooltip>
      <span>{{ $t('appbar.tooltips.tasks') }}</span>
    </template>
  </AppBarButtonLayout>
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
          textKey: 'appbar.tasks.scanningItem',
          textParams: {
            item: t.data ?? ''
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
const UITaskList = computed(() => [
  ...(menu.value
    ? mappedTaskList.value.filter((t) => t.progress !== 100)
    : mappedTaskList.value),
  ...completedTaskList.value
]);
const showButton = computed(() => UITaskList.value.length > 0);

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
