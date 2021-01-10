<template>
  <div>
    <v-app-bar shrink-on-scroll flat fixed class="second-toolbar">
      <v-toolbar-title class="d-flex genre-toolbar">
        <span>{{ genre.Name }}</span>
        <v-btn
          v-if="loaded && canPlay(genre)"
          class="play-button ml-auto mr-2"
          color="primary"
          min-width="8em"
          depressed
          rounded
          @click="play({ items: [genre] })"
        >
          {{ $t('play') }}
        </v-btn>
        <v-btn
          v-if="loaded"
          class="play-button mr-2"
          min-width="8em"
          outlined
          rounded
          nuxt
          :to="`./${genre.Id}/shuffle`"
        >
          {{ $t('shuffleAll') }}
        </v-btn>
      </v-toolbar-title>
    </v-app-bar>
    <v-container class="second-toolbar-follow">
      <v-row v-if="!loaded">
        <v-col cols="12" class="card-grid-container">
          <skeleton-card v-for="n in 24" :key="n" />
        </v-col>
      </v-row>
      <item-grid v-if="items.length" :items="items" />
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
import { BaseItemDto } from '@jellyfin/client-axios';
import itemHelper from '~/mixins/itemHelper';

export default Vue.extend({
  mixins: [itemHelper],
  async asyncData({ params, $api, $auth }) {
    const genre = (
      await $api.userLibrary.getItem({
        userId: $auth.user?.Id,
        itemId: params.itemId
      })
    ).data;

    return { genre };
  },
  data() {
    return {
      genre: [] as BaseItemDto,
      items: [] as BaseItemDto[],
      loaded: false
    };
  },
  head() {
    return {
      title: this.$store.state.page.title
    };
  },
  async beforeMount() {
    this.setAppBarOpacity({ opaqueAppBar: true });
    this.setPageTitle({
      title: this.genre.Name
    });

    try {
      this.items = (
        await this.$api.items.getItems({
          userId: this.$auth.user?.Id,
          genreIds: [this.$route.params.itemId],
          includeItemTypes: [this.$route.query.type.toString()],
          recursive: true,
          sortBy: 'SortName',
          sortOrder: 'Ascending'
        })
      ).data.Items as BaseItemDto[];

      this.loaded = true;
    } catch (error) {
      console.error(error);
      // Can't get given library ID
      this.$nuxt.error({
        statusCode: 404,
        message: this.$t('libraryNotFound')
      });
    }
  },
  destroyed() {
    this.setAppBarOpacity({ opaqueAppBar: false });
  },
  methods: {
    ...mapActions('playbackManager', ['play']),
    ...mapActions('page', ['setPageTitle', 'setAppBarOpacity'])
  }
});
</script>

<style lang="scss" scoped>
.second-toolbar {
  top: 64px;
  left: 256px !important;
}

.second-toolbar-follow {
  padding-top: 140px;
}

.genre-toolbar {
  width: 100%;
}

.scroller {
  max-height: 100%;
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
