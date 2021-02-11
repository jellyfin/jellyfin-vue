<template>
  <settings-page page-title="settingsSections.user.playback.name">
    <template #content>
      <v-row justify="center">
        <v-card-actions>
          <v-icon>mdi-video</v-icon>
        </v-card-actions>
        <v-card-title>
          <h1 class="text-overline title">
            {{ $t('settings.playback.video.video') }}
          </h1>
        </v-card-title>
      </v-row>

      <v-card-title>
        {{ $t('settings.playback.video.controls') }}
      </v-card-title>
      <v-card-subtitle>
        {{ $t('settings.playback.video.controlsDescription') }}
      </v-card-subtitle>
      <v-divider />

      <div class="pa-5">
        <v-text-field
          v-model="backwardSeek"
          :value="backwardSeek"
          :rules="[validateInput]"
          min="0"
          :hint="$t('settings.playback.video.default')"
          prepend-icon="mdi-skip-backward"
          :suffix="$t('settings.playback.video.seconds')"
          type="number"
          :label="$t('settings.playback.video.backwardSeek')"
          class="input-text"
        />
        <v-text-field
          v-model="forwardSeek"
          :value="forwardSeek"
          :rules="[validateInput]"
          min="0"
          :hint="$t('settings.playback.video.default')"
          prepend-icon="mdi-skip-forward"
          :suffix="$t('settings.playback.video.seconds')"
          type="number"
          :label="$t('settings.playback.video.forwardSeek')"
          class="input-text"
        />
      </div>

      <v-row justify="center">
        <v-card-actions>
          <v-icon>mdi-music</v-icon>
        </v-card-actions>
        <v-card-title>
          <h1 class="text-overline title">
            {{ $t('settings.playback.music.music') }}
          </h1>
        </v-card-title>
      </v-row>

      <v-card-title>
        {{ $t('settings.playback.music.crossfade') }}
      </v-card-title>
      <v-card-subtitle>
        {{ $t('settings.playback.music.crossfadeDescription') }}
      </v-card-subtitle>
      <v-divider />

      <v-row justify="space-between" align="center" class="pa-5">
        <v-card-actions>
          <v-fade-transition>
            <v-slider
              v-show="crossfade"
              v-model="crossfadeTime"
              min="1"
              max="12"
              thumb-label
              class="slider"
            >
              <template #append>
                <span class="mt-1">
                  {{ crossfadeTime + 's' }}
                </span>
              </template>
            </v-slider>
          </v-fade-transition>
        </v-card-actions>
        <v-card-actions>
          <v-switch v-model="crossfade" />
        </v-card-actions>
      </v-row>

      <v-card-title>
        {{ $t('settings.playback.music.queueSync') }}
      </v-card-title>
      <v-card-subtitle>
        {{ $t('settings.playback.music.queueSyncDescription') }}
      </v-card-subtitle>
      <v-divider />

      <v-row justify="end" align="end" class="pa-5">
        <v-card-actions>
          <v-switch v-model="queueSync" />
        </v-card-actions>
      </v-row>
    </template>
  </settings-page>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';

export default Vue.extend({
  data() {
    return {
      crossfade: false,
      crossfadeTime: 0,
      queueSync: false,
      backwardSeek: 20,
      forwardSeek: 20
    };
  },
  head() {
    return {
      title: this.$store.state.page.title
    };
  },
  created() {
    this.setPageTitle({
      title: this.$t('settingsSections.user.playback.name')
    });
  },
  methods: {
    ...mapActions('page', ['setPageTitle']),
    validateInput(input: string): string | boolean {
      const int = parseFloat(input);

      if (int && int > 0 && Number.isInteger(int) && !isNaN(int)) {
        return true;
      } else {
        return this.$i18n.t('validation.invalidNumber');
      }
    }
  }
});
</script>

<style lang="scss" scoped>
.title {
  font-size: 1em !important;
}

.slider {
  width: 20vw;
}
</style>
