<template>
  <div v-if="!vertical">
    <SwiperSection
      :title="t('youMayAlsoLike')"
      :items="relatedItems" />
  </div>
  <div v-else-if="vertical">
    <h2
      v-if="relatedItems.length > 0"
      class="text-h6 text-sm-h5">
      <slot>
        {{ t('youMayAlsoLike') }}
      </slot>
    </h2>
    <VList
      bg-color="transparent"
      lines="two">
      <div v-if="relatedItems.length > 0">
        <VListItem
          v-for="relatedItem in relatedItems"
          :key="relatedItem.Id"
          :to="getItemDetailsLink(relatedItem)"
          :title="relatedItem.Name ?? ''"
          :subtitle="relatedItem.ProductionYear ?? ''">
          <template #prepend>
            <VAvatar>
              <VAvatar color="card">
                <BlurhashImage :item="relatedItem" />
              </VAvatar>
            </VAvatar>
          </template>
        </VListItem>
      </div>
    </VList>
  </div>
</template>

<script setup lang="ts">
import type { BaseItemDto } from '@jellyfin/sdk/lib/generated-client';
import { useI18n } from 'vue-i18n';
import { getItemDetailsLink } from '@/utils/items';

withDefaults(
  defineProps<{
    relatedItems: BaseItemDto[];
    vertical?: boolean;
  }>(),
  {
    vertical: false
  }
);

const { t } = useI18n();
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
