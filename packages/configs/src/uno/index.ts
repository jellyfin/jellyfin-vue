import { defineConfig, presetWind4, transformerVariantGroup, presetIcons } from 'unocss';
import type { Theme } from 'unocss/preset-wind4';
import { lightColors, darkColors } from './colors.ts';

/**
 * The colors are CSS variables that can change at runtime.
 * See @jellyfin-vue/ui-toolkit/components/JApp.vue to see how these variables are generated
 */
const themeColors = Object.fromEntries(
  Object.keys({ ...lightColors(), ...darkColors() }).map(color => [
    color,
    `var(--j-theme-color-${color})`
  ])
);

export const defaultConfig = defineConfig<Theme>({
  content: {
    pipeline: {
      include: [
        /\.(vue|ts|html)($|\?)/
      ]
    }
  },
  presets: [
    presetWind4({
      prefix: 'uno-',
      variablePrefix: 'j-util-',
      preflights: {
        reset: true
      }
    }),
    presetIcons({
      mode: 'mask',
      warn: true,
      scale: 1.5
    })
  ],
  transformers: [
    transformerVariantGroup()
  ],
  rules: [
    ['uno-duration-default', { 'transition-duration': 'var(--j-theme-transition-duration)' }]
  ],
  shortcuts: [
    [
      /^bg-([^/]+)(?:\/.+)?$/,
      ([utility, color]) => {
        /**
         * Theme backgrounds also set the text color with the best contrast against them.
         * If not included in the theme colors, return undefined so the original class prevails.
         *
         * Since the shortcut has a prefix, the matched utility doesn't include it, so it's resolved
         * by the preset's rule (opacity modifiers included) instead of by this shortcut again.
         */
        if (color && Object.hasOwn(themeColors, color)) {
          return [utility, { color: `contrast-color(var(--j-theme-color-${color}))` }];
        }
      },
      { prefix: 'uno-', layer: 'shortcuts' }
    ]
  ],
  theme: {
    default: {
      transition: {
        duration: 'var(--j-theme-transition-duration)'
      }
    }
  },
  /**
   * Only the theme colors (and CSS keywords) are available, so every color utility
   * depends on the variables that can change at runtime.
   */
  extendTheme: (theme) => {
    theme.colors = {
      transparent: 'transparent',
      current: 'currentColor',
      inherit: 'inherit',
      ...themeColors
    };
  }
});
