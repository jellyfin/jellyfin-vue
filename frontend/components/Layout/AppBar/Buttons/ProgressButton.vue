<template>
  <v-menu
    v-if="showButton"
    v-model="menu"
    :close-on-content-click="false"
    :close-on-click="$vuetify.breakpoint.mobile"
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
      <app-bar-button-layout
        :custom-listener="taskList.length ? menu : undefined"
        :color="buttonColor"
        v-bind="attrs"
      >
        <template #icon>
          <v-progress-circular v-if="!buttonColor" indeterminate size="24" />
          <v-icon v-else>mdi-check</v-icon>
        </template>
        <template #tooltip>
          <span>{{ $t('appbar.tooltips.tasks') }}</span>
        </template>
      </app-bar-button-layout>
    </template>
    <v-card>
      <v-list color="transparent">
        <v-list-item v-for="task in taskList" :key="`${task.id}`">
          <v-list-item-content>
            {{ task.text }}
          </v-list-item-content>
          <v-list-item-action>
            <v-progress-circular
              v-if="!(task.progress === 100)"
              :indeterminate="
                task.progress === undefined || task.progress === 0
              "
              :value="task.progress"
              rotate="-90"
              size="24"
            />
            <v-icon v-else>mdi-check</v-icon>
          </v-list-item-action>
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
  id: string;
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
    },
    timeout: {
      type: Number,
      default: 5000
    }
  },
  data() {
    return {
      menu: false,
      showButton: false,
      taskList: [] as TaskInfo[],
      scheduledTimeout: 0
    };
  },
  computed: {
    ...mapState('taskManager', ['tasks']),
    ...mapState('clientSettings', ['locale']),
    buttonColor(): string | undefined {
      return this.taskList.every((task) => {
        return task.progress === 100;
      })
        ? 'green'
        : undefined;
    }
  },
  watch: {
    tasks: {
      immediate: true,
      handler(): void {
        this.getTaskList();

        if (this.taskList.length) {
          this.showButton = true;
        }
      }
    },
    /**
     * Updates the text when locale changes
     */
    locale() {
      this.getTaskList();
    },
    /**
     * Handles all tasks completion
     */
    buttonColor() {
      window.clearTimeout(this.scheduledTimeout);

      if (this.buttonColor && !this.menu) {
        this.scheduledTimeout = window.setTimeout(
          this.clearState,
          this.timeout
        );
      }
    },
    /**
     * Don't remove the menu if the user has it opened
     */
    menu() {
      if (this.menu) {
        window.clearTimeout(this.scheduledTimeout);
      } else if (this.buttonColor) {
        this.scheduledTimeout = window.setTimeout(
          this.clearState,
          this.timeout
        );
      }
    }
  },
  methods: {
    clearState(): void {
      this.showButton = false;
      this.taskList = [];
    },
    getTaskList(): void {
      const list: Array<TaskInfo> = [];

      for (const task of this.tasks as RunningTask[]) {
        switch (task.type) {
          case TaskType.ConfigSync:
            list.push({
              progress: undefined,
              text: this.$t('appbar.tasks.configSync'),
              id: task.id
            });
            break;
          case TaskType.LibraryRefresh:
            list.push({
              progress: task.progress,
              text: this.$t('appbar.tasks.scanningLibrary', {
                library: task.data
              }),
              id: task.id
            });
            break;
        }
      }

      const taskIds = (list as TaskInfo[]).map((task) => {
        return task.id;
      });

      const finishedTasks: Array<TaskInfo> = [];

      this.taskList.forEach((task) => {
        if (!taskIds.includes(task.id)) {
          task.progress = 100;
          finishedTasks.push(task);
        }
      });

      this.taskList = list.concat(finishedTasks);
    }
  }
});
</script>
