<template>
  <draggable
    v-model="queue"
    v-bind="dragOptions"
    class="list-group"
    @start="drag = true"
    @end="drag = false"
  >
    <transition-group type="transition" :name="!drag ? 'flip-list' : null">
      <v-list-item
        v-for="item in queue"
        :key="item.Id"
        class="list-group-item pa-0 ma-0"
      >
        <v-list-item-avatar tile>
          <blurhash-image :item="item" />
        </v-list-item-avatar>
        <v-list-item-title
          :class="{ 'primary--text': isPlaying(item) }"
          class="text-truncate"
          >{{ item.Name }}</v-list-item-title
        >
      </v-list-item>
    </transition-group>
  </draggable>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions, mapGetters } from 'vuex';
import { BaseItemDto } from '@jellyfin/client-axios';
import timeUtils from '~/mixins/timeUtils';

export default Vue.extend({
  mixins: [timeUtils],
  data() {
    return {
      dragOptions: {
        animation: 200,
        group: 'description',
        disabled: false,
        ghostClass: 'ghost'
      },
      drag: false
    };
  },
  computed: {
    queue: {
      get(): BaseItemDto[] {
        return this.$store.state.playbackManager.queue;
      },
      set(newValue: BaseItemDto[]): void {
        this.setNewQueue({ queue: newValue });
      }
    }
  },
  methods: {
    ...mapGetters('playbackManager', ['getCurrentItem']),
    ...mapActions('playbackManager', ['play', 'setNewQueue']),
    isPlaying(item: BaseItemDto): boolean {
      return this.getCurrentItem()?.Id === item.Id;
    }
  }
});
</script>

<style lang="scss" scoped>
.button {
  margin-top: 35px;
}
.flip-list-move {
  transition: transform 0.5s;
}
.no-move {
  transition: transform 0s;
}
.ghost {
  opacity: 0.5;
  background: #c8ebfb;
}
.list-group {
  min-height: 20px;
}
.list-group-item {
  cursor: grab;
}
.list-group-item i {
  cursor: pointer;
}
</style>
