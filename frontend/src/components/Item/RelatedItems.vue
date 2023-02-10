<template>
  <div v-if="relatedItems.length > 0">
    <div v-if="!vertical" class="related-items">
      <swiper-section
        :title="$t('youMayAlsoLike')"
        :items="relatedItems"
        :loading="loading" />
    </div>
    <div v-else-if="vertical">
      <h2 v-if="!loading && relatedItems.length > 0" class="text-h6 text-sm-h5">
        <slot>
          {{ $t('youMayAlsoLike') }}
        </slot>
      </h2>
      <!-- TODO: Wait for Vuetify 3.1 -->
      <!-- <v-skeleton-loader v-else-if="loading" type="heading" /> -->
      <v-list bg-color="transparent" lines="two">
        <div v-if="!loading && relatedItems.length > 0">
          <v-list-item
            v-for="relatedItem in relatedItems"
            :key="relatedItem.Id"
            :to="getItemDetailsLink(relatedItem)">
            <template #prepend>
              <v-avatar>
                <v-avatar color="card">
                  <blurhash-image :item="relatedItem" />
                </v-avatar>
              </v-avatar>
            </template>
            <v-list-item-title>{{ relatedItem.Name }}</v-list-item-title>
            <v-list-item-subtitle>
              {{ relatedItem.ProductionYear }}
            </v-list-item-subtitle>
          </v-list-item>
        </div>
        <div
          v-for="index in skeletonLength"
          v-else-if="loading"
          :key="index"
          class="d-flex align-center mt-5 mb-5">
          <!-- TODO: Wait for Vuetify 3.1 -->
          <!-- <v-skeleton-loader type="avatar" class="ml-3 mr-3" />
          <v-skeleton-loader type="sentences" width="10em" class="pr-5" /> -->
        </div>
      </v-list>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue';
import { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { getLibraryApi } from '@jellyfin/sdk/lib/utils/api/library-api';
import { useI18n } from 'vue-i18n';
import { getItemDetailsLink } from '@/utils/items';
import { useSnackbar, useRemote } from '@/composables';

const remote = useRemote();
const { t } = useI18n();

const props = withDefaults(
  defineProps<{
    item: BaseItemDto;
    vertical?: boolean;
    skeletonLength?: number;
  }>(),
  {
    vertical: false,
    skeletonLength: 5
  }
);

const relatedItems = ref<BaseItemDto[]>([]);
const loading = ref(true);

watch(
  () => props.item,
  async () => {
    loading.value = true;

    if (props.item.Id) {
      try {
        const response = await remote.sdk
          .newUserApi(getLibraryApi)
          .getSimilarItems({
            itemId: props.item.Id,
            userId: remote.auth.currentUserId,
            limit: props.vertical ? 5 : 12,
            excludeArtistIds: props.item.AlbumArtists?.flatMap(
              (albumArtist: BaseItemDto) =>
                albumArtist.Id ? [albumArtist.Id] : []
            )
          });

        if (response.data.Items) {
          relatedItems.value = response.data.Items;
        }
      } catch {
        useSnackbar(t('unableGetRelated'), 'error');
      }
    }

    loading.value = false;
  },
  { immediate: true }
);
</script>

<style lang="scss" scoped>
.header span {
  padding-left: 0.25em;
}

.header::before {
  background-color: white;
  content: '';
  position: relative;
  display: inline-block;
  height: 1px;
  bottom: 0.3em;
  left: 0;
  width: 1.25em;
}
</style>
