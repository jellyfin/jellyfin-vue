<template>
  <div>
    <v-app-bar shrink-on-scroll flat fixed class="second-toolbar">
      <v-toolbar-title class="d-flex genre-toolbar">
        <span>{{ genre.Name }}</span>
        <v-btn
          v-if="loaded"
          class="play-button ml-auto mr-2"
          color="primary"
          min-width="8em"
          :disabled="isPlayable"
          depressed
          rounded
          :to="`./${genre.Id}/play`"
          >{{ $t('play') }}</v-btn
        >
        <v-btn
          v-if="loaded"
          class="play-button mr-2"
          min-width="8em"
          :disabled="isPlayable"
          outlined
          rounded
          :to="`./${genre.Id}/shuffle`"
          >{{ $t('shuffleAll') }}</v-btn
        >
      </v-toolbar-title>
    </v-app-bar>
    <v-container class="second-toolbar-follow">
      <v-row v-if="!loaded">
        <v-col cols="12" class="card-grid-container">
          <skeleton-card v-for="n in 24" :key="n" />
        </v-col>
      </v-row>
      <item-grid v-if="items.length" :items="itemsChunks" />
      <v-row v-else-if="loaded" justify="center">
        <v-col cols="12" class="card-grid-container empty-card-container">
          <skeleton-card v-for="n in 24" :key="n" boilerplate />
        </v-col>
        <div class="empty-message text-center">
          <h1 class="text-h5">
            {{ $t('libraryEmpty') }}
          </h1>
        </div>
      </v-row>
    </v-container>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { mapActions } from 'vuex';
import { chunk } from 'lodash';
import { BaseItemDto } from '~/api/api';

export default Vue.extend({
  data() {
    return {
      genre: [] as BaseItemDto,
      items: [] as BaseItemDto[],
      loaded: false
    };
  },
  computed: {
    itemsChunks: {
      get() {
        let cardsPerLine = 8;

        if (this.$vuetify.breakpoint.smAndDown) {
          cardsPerLine = 3;
        } else if (
          this.$vuetify.breakpoint.smAndUp &&
          !this.$vuetify.breakpoint.lgAndUp
        ) {
          cardsPerLine = 4;
        } else if (
          this.$vuetify.breakpoint.lgAndUp &&
          !this.$vuetify.breakpoint.xlOnly
        ) {
          cardsPerLine = 6;
        }

        const chunks = chunk(this.$data.items, cardsPerLine);

        const keyedChunks = chunks.map((itemChunk, index) => {
          return {
            id: index,
            chunk: itemChunk
          };
        });

        return keyedChunks;
      }
    }
  },
  async beforeMount() {
    this.setAppBarOpacity({ opaqueAppBar: true });

    const type = this.$route.query.type;
    try {
      this.genre = (
        await this.$api.userLibrary.getItem({
          userId: this.$auth.user.Id,
          itemId: this.$route.params.itemId
        })
      ).data;

      this.setPageTitle({
        title: this.genre.Name
      });

      this.items = (
        await this.$api.items.getItems({
          uId: this.$auth.user.Id,
          userId: this.$auth.user.Id,
          genreIds: this.$route.params.itemId,
          includeItemTypes: type,
          recursive: true
        })
      ).data.Items as BaseItemDto[];

      this.loaded = true;
    } catch (error) {
      console.error(error);
      // Can't get given library ID
      this.$nuxt.error({
        statusCode: 404,
        message: this.$t('libraryNotFound') as string
      });
    }
  },
  destroyed() {
    this.setAppBarOpacity({ opaqueAppBar: false });
  },
  methods: {
    ...mapActions('page', ['setPageTitle', 'setAppBarOpacity'])
  },
  head() {
    return {
      title: this.$store.state.page.title
    };
  }
});
</script>

<style lang="scss" scoped>
.second-toolbar {
  top: 64px;
  left: 256px !important;
}

.second-toolbar-follow {
  padding-top: 128px;
}

.genre-toolbar {
  width: 100%;
}

.scroller {
  max-height: 100%;
}

.empty-card-container {
  max-height: 90vh;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0));
}

.empty-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

@import '~vuetify/src/styles/styles.sass';
.card-grid-container {
  display: grid;
}

@media #{map-get($display-breakpoints, 'sm-and-down')} {
  .card-grid-container {
    grid-template-columns: repeat(3, minmax(calc(100% / 3), 1fr));
  }
}

@media #{map-get($display-breakpoints, 'sm-and-up')} {
  .card-grid-container {
    grid-template-columns: repeat(4, minmax(calc(100% / 4), 1fr));
  }
}

@media #{map-get($display-breakpoints, 'lg-and-up')} {
  .card-grid-container {
    grid-template-columns: repeat(6, minmax(calc(100% / 6), 1fr));
  }
}

@media #{map-get($display-breakpoints, 'xl-only')} {
  .card-grid-container {
    grid-template-columns: repeat(8, minmax(calc(100% / 8), 1fr));
  }
}
</style>
