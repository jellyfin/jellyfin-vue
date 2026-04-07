import { vuetify } from '#/plugins/vuetify';

const display = vuetify.display;

/**
 * Returns an additional class based on current Vuetify breakpoint.
 * Possibilities:
 * * lg, lg-and-down, lg-and-up
 * * md, md-and-down, md-and-up
 * * sm, sm-and-down, sm-and-up
 * * xl, xl-and-down, xl-and-up
 * * xs
 * * xxl
 * * mobile
 *
 * Additionally to all the classes stated above, a mobile class is also added
 * when the mobile breakpoint is active.
 */
export function useResponsiveClasses(classes: string): string {
  let out = classes;

  if (display.lg.value) {
    out += ' lg';
  }

  if (display.lgAndDown.value) {
    out += ' lg-and-down';
  }

  if (display.lgAndUp.value) {
    out += ' lg-and-up';
  }

  if (display.md.value) {
    out += ' md';
  }

  if (display.mdAndDown.value) {
    out += ' md-and-down';
  }

  if (display.mdAndUp.value) {
    out += ' md-and-up';
  }

  if (display.sm.value) {
    out += ' sm';
  }

  if (display.smAndDown.value) {
    out += ' sm-and-down';
  }

  if (display.smAndUp.value) {
    out += ' sm-and-up';
  }

  if (display.xl.value) {
    out += ' xl';
  }

  if (display.xlAndDown.value) {
    out += ' xl-and-down';
  }

  if (display.xlAndUp.value) {
    out += ' xl-and-up';
  }

  if (display.xs.value) {
    out += ' xs';
  }

  if (display.xxl.value) {
    out += ' xxl';
  }

  if (display.mobile.value) {
    out += ' mobile';
  }

  return out;
}
