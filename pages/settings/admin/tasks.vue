<template>
  <settings-page
    page-title="settingsSections.admin.scheduledTasks.name"
    help-link="https://jellyfin.org/docs/general/server/tasks.html"
  >
    <template #content>
      <v-list
        v-for="(tasks, category) in allTasks"
        :key="`${category}-${uuid}`"
        color="transparent"
      >
        <h1 class="text-overline">{{ category }}</h1>
        <div v-for="task in tasks" :key="task.Id">
          <v-card
            v-if="!task.IsHidden"
            :loading="taskStatus[task.Id] !== idle"
            class="ma-2"
          >
            <template #progress>
              <v-progress-linear
                :color="taskStatus[task.Id] === cancelling ? 'red' : 'primary'"
                :query="
                  (taskStatus[task.Id] !== idle && !taskProgresses[task.Id]) ||
                  taskStatus[task.Id] === cancelling
                "
                buffer-value="0"
                stream
                :value="taskProgresses[task.Id]"
                :indeterminate="
                  (taskStatus[task.Id] !== idle && !taskProgresses[task.Id]) ||
                  taskStatus[task.Id] === cancelling
                "
              />
            </template>
            <div class="d-flex">
              <span>
                <v-card-title class="text-no-wrap">{{
                  task.Name
                }}</v-card-title>
                <v-card-subtitle v-if="!$vuetify.breakpoint.smAndDown">
                  {{ task.Description }}
                </v-card-subtitle>
                <v-card-text
                  v-if="
                    taskStatus[task.Id] === idle &&
                    !$vuetify.breakpoint.smAndDown
                  "
                  v-text="getRuntimeText(task)"
                />
                <v-card-text
                  v-else-if="
                    taskStatus[task.Id] !== idle &&
                    !taskProgresses[task.Id] &&
                    !$vuetify.breakpoint.smAndDown
                  "
                  v-text="$t('settings.tasks.starting')"
                />
                <v-card-text
                  v-else-if="
                    taskStatus[task.Id] === running &&
                    !$vuetify.breakpoint.smAndDown
                  "
                  v-text="$t('settings.tasks.running')"
                />
                <v-card-text
                  v-else-if="
                    taskStatus[task.Id] === cancelling &&
                    !$vuetify.breakpoint.smAndDown
                  "
                  v-text="$t('settings.tasks.cancelling')"
                />
              </span>
              <v-card-actions class="ml-auto mr-2">
                <v-btn icon disabled>
                  <v-icon>mdi-pencil</v-icon>
                </v-btn>
                <v-btn
                  icon
                  :color="taskStatus[task.Id] === running ? 'red' : 'primary'"
                  :disabled="taskStatus[task.Id] === cancelling"
                  @click="onClick(task.Id)"
                >
                  <v-icon v-if="taskStatus[task.Id] === idle">mdi-play</v-icon>
                  <v-icon v-else>mdi-stop</v-icon>
                </v-btn>
              </v-card-actions>
            </div>
          </v-card>
        </div>
      </v-list>
    </template>
  </settings-page>
</template>

<script lang="ts">
import Vue from 'vue';
import { TaskInfo, TaskState } from '@jellyfin/client-axios';
import { v4 as uuidv4 } from 'uuid';
import { groupBy } from 'lodash';
import { mapActions } from 'vuex';

interface GroupedTasks {
  [k: string]: TaskInfo[];
}

export default Vue.extend({
  middleware: 'adminMiddleware',
  async asyncData({ $api }) {
    const rawTasks = (await $api.scheduledTasks.getTasks()).data;

    rawTasks.forEach((task) => {
      if (task.IsHidden) {
        rawTasks.splice(rawTasks.indexOf(task));
      }
    });

    rawTasks.sort((a: TaskInfo, b: TaskInfo) => {
      if (a.Category && b.Category) {
        if (a.Category < b.Category) {
          return -1;
        }
        if (a.Category > b.Category) {
          return 1;
        }
      }
      return 0;
    });

    const allTasks = groupBy(rawTasks, 'Category');
    const taskStatus = {} as { [k: string]: TaskState };
    const taskProgresses = {} as { [k: string]: number };
    rawTasks.forEach((task) => {
      if (task.Id) {
        taskStatus[task.Id] = task.State as TaskState;
        if (task.CurrentProgressPercentage) {
          taskProgresses[task.Id] = task.CurrentProgressPercentage;
        } else {
          taskProgresses[task.Id] = 0;
        }
      }
    });

    return { allTasks, taskStatus, taskProgresses };
  },
  data() {
    const uuid = uuidv4();
    return {
      uuid,
      idle: TaskState.Idle,
      cancelling: TaskState.Cancelling,
      running: TaskState.Running,
      allTasks: {} as GroupedTasks,
      taskStatus: {} as { [k: string]: TaskState },
      taskProgresses: {} as { [k: string]: number },
      loading: false,
      interval: 0
    };
  },
  head() {
    return {
      title: this.$store.state.page.title
    };
  },
  created() {
    this.setPageTitle({
      title: this.$t('settingsSections.admin.scheduledTasks.name')
    });
  },
  mounted() {
    /**
     * TODO: Use WebSocket for this once it's available in the API.
     */
    this.interval = window.setInterval(this.pollUpdates, 700);
  },
  destroyed() {
    window.clearInterval(this.interval);
  },
  methods: {
    ...mapActions('page', ['setPageTitle']),
    getRuntimeText(task: TaskInfo): string {
      if (
        task.LastExecutionResult?.StartTimeUtc &&
        task.LastExecutionResult?.EndTimeUtc
      ) {
        const delta = this.$dateFns.formatDistance(
          Date.parse(task.LastExecutionResult?.StartTimeUtc),
          Date.parse(task.LastExecutionResult?.EndTimeUtc),
          {
            locale: this.$i18n.locale
          }
        );
        const time = this.$dateFns.formatDistance(
          Date.parse(task.LastExecutionResult?.StartTimeUtc),
          Date.now(),
          {
            addSuffix: true,
            locale: this.$i18n.locale
          }
        );
        return this.$i18n.t('settings.tasks.lastRan', { time, delta });
      } else {
        return this.$i18n.t('settings.tasks.noRuntimeInfo');
      }
    },
    async pollUpdates(): Promise<void> {
      const rawTasks = (await this.$api.scheduledTasks.getTasks())
        .data as TaskInfo[];
      rawTasks.forEach((task: TaskInfo) => {
        if (!task.IsHidden && task.Id) {
          this.taskStatus[task.Id] = task.State as TaskState;
          if (task.CurrentProgressPercentage) {
            this.taskProgresses[task.Id] = task.CurrentProgressPercentage;
          } else {
            this.taskProgresses[task.Id] = 0;
          }
        } else {
          rawTasks.splice(rawTasks.indexOf(task));
        }
      });
      this.allTasks = groupBy(rawTasks, 'Category');
    },
    async onClick(id: string): Promise<void> {
      if (
        this.taskStatus[id] !== TaskState.Running &&
        this.taskStatus[id] !== TaskState.Cancelling
      ) {
        try {
          this.taskStatus[id] = TaskState.Running;
          await this.$api.scheduledTasks.startTask({
            taskId: id
          });
        } catch {
          this.taskStatus[id] = TaskState.Idle;
        }
      } else {
        try {
          this.taskStatus[id] = TaskState.Cancelling;
          await this.$api.scheduledTasks.stopTask({
            taskId: id
          });
        } catch {
          this.taskStatus[id] = TaskState.Running;
        }
      }
    }
  }
});
</script>
