<template>
  <v-menu
    v-model="menu"
    :close-on-content-click="true"
    :close-on-click="true"
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
    <template #activator="{ on: menu, attrs }">
      <v-tooltip bottom>
        <template #activator="{ on: tooltip }">
          <v-btn
            class="align-self-center active-button"
            :icon="!fab"
            :fab="fab"
            small
            :class="{ 'ml-1': fab }"
            v-bind="attrs"
            v-on="{ ...tooltip, ...menu }"
          >
            <v-icon>
              {{ isConnected ? 'mdi-cast-connected' : 'mdi-cast' }}
            </v-icon>
          </v-btn>
        </template>
        <span>{{ $t('remoteDevices') }}</span>
      </v-tooltip>
    </template>
    <v-card>
      <v-list color="transparent" two-line>
        <v-list-item-group>
          <client-only>
            <v-list-item>
              <v-list-item-icon>
                <v-icon>mdi-account-group</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                {{ $t('syncPlayGroups') }}
              </v-list-item-content>
              <v-list-item-action>
                <v-icon>mdi-arrow-right</v-icon>
              </v-list-item-action>
            </v-list-item>
            <v-divider />
            <v-list-item v-if="$features.airPlay">
              <v-list-item-icon>
                <v-icon>mdi-apple-airplay</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                {{ $t('airPlayDevices') }}
              </v-list-item-content>
            </v-list-item>
            <v-list-item
              v-if="$features.googleCast"
              @click="handleGoogleCastClick"
            >
              <v-list-item-icon>
                <v-icon>mdi-cast</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                {{ $t('googleCastDevice') }}
              </v-list-item-content>
              <v-list-item-action v-if="googleCastSession !== null">
                <v-icon>mdi-check</v-icon>
              </v-list-item-action>
            </v-list-item>
            <v-list-item
              v-for="session in sessions"
              :key="session.Id"
              two-line
              @click="handleSessionClick(session)"
            >
              <v-list-item-icon>
                <v-icon>{{ getDeviceIcon(session) }}</v-icon>
              </v-list-item-icon>
              <v-list-item-content>
                <v-list-item-title>
                  {{
                    $t('userOnDevice', {
                      user: session.UserName,
                      device: session.DeviceName
                    })
                  }}
                </v-list-item-title>
                <v-list-item-subtitle>
                  {{ `${session.Client} ${session.ApplicationVersion}` }}
                </v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </client-only>
        </v-list-item-group>
      </v-list>
    </v-card>
  </v-menu>
</template>

<script lang="ts">
import { BaseItemDto, SessionInfo } from '@jellyfin/client-axios';
import Vue from 'vue';
import { mapActions, mapGetters, mapState } from 'vuex';

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
      /* eslint-disable-next-line no-undef */
      googleCastSession: (null as unknown) as chrome.cast.Session | null,
      sessions: null as SessionInfo[] | null
    };
  },
  async fetch() {
    this.sessions = (
      await this.$api.session.getSessions({
        controllableByUserId: this.$auth.user.Id
      })
    ).data.filter((session) => {
      return session.DeviceId !== this.deviceId;
    });
  },
  computed: {
    ...mapGetters('playbackManager', ['getCurrentItemSubtitleTracks']),
    ...mapState('playbackManager', ['currentSubtitleStreamIndex']),
    ...mapState('deviceProfile', ['deviceId']),
    isConnected(): boolean {
      return this.googleCastSession !== null;
    }
  },
  methods: {
    ...mapActions('playbackManager', ['setRemote', 'setQueue', 'unpause']),
    handleGoogleCastClick(): void {
      if (this.googleCastSession === null) {
        window.chrome.cast.requestSession(
          (session) => {
            this.googleCastSession = session;

            console.debug('Google Cast session started');
          },
          () => {
            console.error('Google Cast failed to join a session');
          }
        );
      } else {
        this.googleCastSession.stop(
          () => {
            console.debug('Google Cast session ended');
          },
          () => {
            console.debug('Error ending Google Cast session');
          }
        );
        this.googleCastSession = null;
      }
    },
    async handleSessionClick(session: SessionInfo): Promise<void> {
      this.setRemote(true);

      const queueItems: BaseItemDto[] = [];
      let currentIndex;

      if (session.NowPlayingItem) {
        currentIndex = session.NowPlayingQueue?.findIndex(
          (item) => item.Id === session.NowPlayingItem?.Id
        );
      }

      if (session.NowPlayingQueue) {
        const queueIds = session.NowPlayingQueue.map((item) => item.Id || '');

        for (const itemId of queueIds) {
          const item = (
            await this.$api.userLibrary.getItem({
              userId: this.$auth.user.Id,
              itemId
            })
          ).data;

          queueItems.push(item);
        }
      }

      this.setQueue({
        queue: queueItems,
        currentIndex
      });
      this.unpause();
    },
    getDeviceIcon(session: SessionInfo): string {
      console.dir(session);

      switch (session.DeviceName) {
        case 'Firefox':
          return '$vuetify.icons.firefox';
        case 'Chrome':
          return '$vuetify.icons.chrome';
        default:
          return '$vuetify.icons.jellyfin';
      }
    }
  }
});
</script>
