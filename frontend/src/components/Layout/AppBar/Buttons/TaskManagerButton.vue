<template>
  <AppBarButtonLayout
    v-if="showButton"
    :color="buttonColor">
    <template #icon>
      <JProgressCircular
        v-if="!buttonColor"
        class="uno-w-full"
        indeterminate />
      <JIcon
        v-else
        class="i-mdi:check" />
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
              :title="task.text">
              <template #append>
                <VListItemAction>
                  <JProgressCircular
                    v-if="task.progress !== 100"
                    class="uno-w-15"
                    :indeterminate="!!task.progress"
                    :value="task.progress" />
                  <JIcon
                    v-else
                    class="i-mdi:check" />
                </VListItemAction>
              </template>
            </VListItem>
          </VList>
        </VCard>
      </VMenu>
    </template>
    <template #tooltip>
      <span>{{ $t('runningTasks') }}</span>
    </template>
  </AppBarButtonLayout>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue';
import { useTranslation } from 'i18next-vue';
import { VListItemAction } from 'vuetify/components';
import { taskManager, TaskType } from '#/store/task-manager';

interface TaskInfo {
  progress: undefined | number;
  text: string;
  id: string;
}

const menu = ref(false);
const completedTaskList = ref<TaskInfo[]>([]);
const { t } = useTranslation();

const mappedTaskList = computed<TaskInfo[]>(() => {
  return taskManager.state.value.tasks.map((tsk) => {
    switch (tsk.type) {
      case TaskType.ConfigSync: {
        return {
          progress: tsk.progress,
          text: t('syncingSettingsInProgress'),
          id: tsk.id
        };
      }
      case TaskType.LibraryRefresh: {
        return {
          progress: tsk.progress,
          text: t('scanningItemInProgress', {
            item: tsk.data ?? ''
          }),
          id: tsk.id
        };
      }
    }
  });
});

const mappedCompleted = computed(() =>
  mappedTaskList.value.filter(t => t.progress === 100)
);
const allCompleted = computed(
  () => mappedCompleted.value.length === mappedTaskList.value.length
);
const buttonColor = computed(() =>
  allCompleted.value ? 'success' : undefined
);
const UITaskList = computed(() => [
  ...(menu.value
    ? mappedTaskList.value.filter(t => t.progress !== 100)
    : mappedTaskList.value),
  ...completedTaskList.value
]);
const showButton = computed(() => UITaskList.value.length);

watch([menu, mappedCompleted], () => {
  if (menu.value) {
    const ids = new Set(completedTaskList.value.map(t => t.id));

    completedTaskList.value.push(
      ...mappedCompleted.value.filter(t => !ids.has(t.id))
    );
  } else {
    completedTaskList.value = [];
  }
});
</script>
