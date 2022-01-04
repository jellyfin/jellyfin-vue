<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="false"
    :transition="'slide-y-transition'"
    bottom
    :nudge-bottom="nudgeBottom"
    offset-y
    min-width="25em"
    max-width="25em"
    min-height="25em"
    max-height="25em"
    :z-index="500"
    class="menu"
  >
    <!-- eslint-disable-next-line vue/no-template-shadow -->
    <template #activator="{ on: menu, attrs }">
      <app-bar-button-layout :custom-listener="menu" v-bind="attrs">
        <template #icon>
          <v-progress-circular indeterminate size="24" />
        </template>
        <template #tooltip>
          <span>{{ $t('appbar.tooltips.tasks') }}</span>
        </template>
      </app-bar-button-layout>
    </template>
    <v-card>
      <v-list color="transparent">
        <v-list-item v-for="(task, index) in taskList" :key="`${index}`">
          <v-list-item-content>
            {{ task.text }}
          </v-list-item-content>
          <v-list-item-action>
            <v-progress-circular
              v-if="task.progress === undefined"
              indeterminate
              size="24"
            />
            <v-progress-linear
              v-else-if="task.progress !== undefined && task.progress >= 0"
              :value="task.progress"
              :indeterminate="task.progress === 0"
            />
          </v-list-item-action>
          <v-divider />
        </v-list-item>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapState } from 'vuex';
import { RunningTask, TaskType } from '~/store/taskManager';

interface TaskInfo {
  progress: undefined | number;
  text: string;
}

export default Vue.extend({
  props: {
    fab: {
      type: Boolean,
      required: false
    },
    nudgeBottom: {
      type: Number,
      default: 5
    }
  },
  data() {
    return {
      menu: false,
      taskList: [] as TaskInfo[]
    };
  },
  computed: {
    ...mapState('taskManager', ['tasks']),
    ...mapState('clientSettings', ['locale'])
  },
  watch: {
    tasks: {
      immediate: true,
      handler(): void {
        this.getTaskList();
      }
    },
    locale() {
      this.getTaskList();
    }
  },
  methods: {
    getTaskList(): void {
      const list: Array<TaskInfo> = [];

      for (const task of this.tasks as RunningTask[]) {
        switch (task.type) {
          case TaskType.ConfigSync:
            list.push({
              progress: undefined,
              text: this.$t('appbar.tasks.configSync')
            });
            break;
          case TaskType.LibraryRefresh:
            list.push({
              progress: task.progress,
              text: this.$t('appbar.tasks.scanningLibrary', {
                library: task.data
              })
            });
            break;
        }
      }

      this.taskList = list;
    }
  }
});
</script>
