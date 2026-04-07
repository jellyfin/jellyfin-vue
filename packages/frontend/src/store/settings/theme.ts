import { isNil, sealed } from '@jellyfin-vue/shared/validation';
import type { LiteralUnion } from 'type-fest';
import { darkColors, lightColors, type ColorPalette } from '@jellyfin-vue/shared/colors';
import { usePreferredDark, watchImmediate } from '@vueuse/core';
import { computed } from 'vue';
import { SyncedStore } from '#/store/super/synced-store';
import { vuetify } from '#/plugins/vuetify';

/**
 * Type for the different typography choices across the application
 *
 * default: Default application typography.
 *
 * system: System typography
 */
export type TypographyChoices = LiteralUnion<'default' | 'system', string>;

export interface ThemeSettingsState {
  darkMode?: boolean;
  colors: {
    dark: Record<ColorPalette, string>;
    light: Record<ColorPalette, string>;
  };
  transitionDuration?: number;
  typography: TypographyChoices;
}

export const DEFAULT_TYPOGRAPHY = 'Figtree Variable';

@sealed
class ThemeSettingsStore extends SyncedStore<ThemeSettingsState, 'typography'> {
  private readonly _dark = 'dark';
  private readonly _light = 'light';
  private readonly _browserPrefersDark = usePreferredDark();

  /**
   * @param mode - If true, sets the theme to dark, if false, to light. `undefined` sets it to auto
   */
  public readonly currentTheme = computed({
    get: () => {
      const browserColor = this._browserPrefersDark.value ? this._dark : this._light;
      const userColor
        = this._state.value.darkMode ? this._dark : this._light;

      return this.isAutoTheme.value ? browserColor : userColor;
    },
    set: (mode?: boolean) => {
      this._state.value.darkMode = mode;
    }
  });

  public readonly isAutoTheme = computed(() => isNil(this._state.value.darkMode));
  public readonly currentThemeIsDark = computed(() => this.currentTheme.value === this._dark);
  public readonly colors = computed(() => this._state.value.colors);
  public readonly transitionDuration = computed(() => this._state.value.transitionDuration ?? 0.3);
  public readonly currentTypography = computed(() => {
    if (this._state.value.typography === 'system') {
      return 'system-ui';
    } else if (this._state.value.typography === 'default') {
      return DEFAULT_TYPOGRAPHY;
    } else {
      return this._state.value.typography;
    }
  });

  public constructor() {
    super({
      storeKey: 'themeSettings',
      defaultState: () => ({
        darkMode: undefined,
        colors: {
          dark: darkColors(),
          light: lightColors()
        },
        transitionDuration: undefined,
        typography: 'default'
      }),
      persistenceType: 'localStorage',
      resetOnLogout: true
    });

    /**
     * TODO: Remove once Vuetify is ripped
     */
    watchImmediate(this.currentTheme, () => {
      globalThis.requestAnimationFrame(() => {
        vuetify.theme.global.name.value
          = this.currentTheme.value;
      });
    });
  }
}

export const themeSettings = new ThemeSettingsStore();
