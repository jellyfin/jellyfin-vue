<template>
    <SettingsPage page-title="subtitles">
        <template #content>
            <VCol
              md="6"
              class="pt-0 pb-4">
                <VSelect
                  v-model="clientSettings.subtitleAppearance.fontFamily"
                  :label="$t('subtitleFont')"
                  :items="availableSubtitleFonts"/>

                <VSlider
                  v-model="fontSize"
                  :label="$t('fontSize')"
                  :min="1"
                  :max="4.5"
                  :step="0.1"
                  @end="updateFontSize"/>

                <VSlider
                  v-model="positionFromBottom"
                  :label="$t('positionFromBottom')"
                  :min="0"
                  :max="30"
                  :step="1"
                  @end="updatePositionFromBottom"/>

                <VCheckbox
                  v-model="clientSettings.subtitleAppearance.backdrop"
                  :label="$t('backdrop')"/>

                <VCheckbox
                  v-model="clientSettings.subtitleAppearance.stroke"
                  :label="$t('stroke')"/>

                <div class="subtitleappearance-preview-window">
                  <span class="subtitleappearance-preview-text"
                    :style="{
                    ...clientSettings.subtitleStyle,
                    fontSize: `${fontSize}em !important`,
                    marginBottom: `${positionFromBottom}vh !important`
                  }">
                    {{ $t('subtitlePreviewText') }}
                  </span>
                </div>
            </VCol>
        </template>
      </SettingsPage>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router/auto';
import { clientSettings } from '@/store/client-settings';
import { SUBTITLE_FONT_FAMILIES } from '@/utils/subtitles';

const { t } = useI18n();
const route = useRoute();

route.meta.title = t('subtitles');

const availableSubtitleFonts = ref<string[]>([]);

// Temporary values for slider preview
const fontSize = ref(clientSettings.subtitleAppearance.fontSize);
const positionFromBottom = ref(clientSettings.subtitleAppearance.positionFromBottom);

// Functions to update settings on slider release
const updateFontSize = () => {
  clientSettings.subtitleAppearance.fontSize = fontSize.value;
};
const updatePositionFromBottom = () => {
  clientSettings.subtitleAppearance.positionFromBottom = positionFromBottom.value;
};

// Load subtitle fonts available to the client
const loadAvailableFonts = async () => {
  const checkFontAvailability = async (font: string) => {
    if (font == SUBTITLE_FONT_FAMILIES[0]) return font // Default font

    try {
      const fontFace = new FontFace(font, `local(${font})`);
      const loaded = await fontFace.load();

      if (loaded.status !== "error") {
        return font;
      }
    } catch { }
  };

  const fontChecks = SUBTITLE_FONT_FAMILIES.map(checkFontAvailability);

  Promise.all(fontChecks).then(fonts => {
    const validFonts = fonts.filter(font => font !== undefined);
    availableSubtitleFonts.value = validFonts;
  })
};

onMounted(() => {
  loadAvailableFonts()
})
</script>

<style scoped>
.subtitleappearance-preview-window {
	position: fixed;
	text-align: center;
  user-select: none;
	width: 100%;
  bottom: 0;
  left: 0;
}

.subtitleappearance-preview-text {
  display: inline-block;
  white-space: break-spaces;
}
</style>
