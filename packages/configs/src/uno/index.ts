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

/**
 * Points of CSS's ease-in-out timing function (cubic-bezier(0.42, 0, 0.58, 1)), sampled in 15 steps.
 * Gradients can't ease between their color stops natively yet, so scrims are approximated with these points.
 */
const easeInOutPoints = Array.from({ length: 16 }, (_, index) => {
  const t = index / 15;
  const bezier = (p1: number, p2: number) => (3 * ((1 - t) ** 2) * t * p1) + (3 * (1 - t) * (t ** 2) * p2) + (t ** 3);

  return { position: bezier(0.42, 0.58), progress: bezier(0, 1) };
});
const scrimDirections = { t: 'top', r: 'right', b: 'bottom', l: 'left' };

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
    ['uno-duration-default', { 'transition-duration': 'var(--j-theme-transition-duration)' }],
    [
      /^bg-scrim-to-([trbl])-([^/]+)(?:\/(\d+))?$/,
      ([, direction, color, opacity = '100']) => {
        /**
         * Scrim: a theme color that fades to transparent towards the given side with an ease-in-out curve,
         * which avoids the visible edge of a linear fade. Like the theme backgrounds, it also sets
         * the text color with the best contrast against the color.
         *
         * For example, uno-bg-scrim-to-b-background/75 starts with the background color at 75% opacity
         * on the top and fades out towards the bottom.
         */
        if (!direction || !color || !Object.hasOwn(themeColors, color)) {
          return;
        }

        const stops = easeInOutPoints.map(({ position, progress }) => {
          const alpha = Math.round(Number(opacity) * (1 - progress) * 10) / 1000;

          return `rgb(from var(--j-theme-color-${color}) r g b / ${alpha}) ${Math.round(position * 1000) / 10}%`;
        });

        return {
          'background-image': `linear-gradient(to ${scrimDirections[direction as keyof typeof scrimDirections]}, ${stops.join(', ')})`,
          'color': `contrast-color(var(--j-theme-color-${color}))`
        };
      },
      { prefix: 'uno-' }
    ]
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
