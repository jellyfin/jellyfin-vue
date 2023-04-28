import { Directive, DirectiveBinding } from 'vue';
import SpatialNavigation, { EVENT_PREFIX } from './spatialNavigation';
import './extension';
import { vjsnOptions } from '@/plugins/spatialNav/options';
import App from '@/App.vue';

const vueSpatialNavigation = {
  install(Vue: App, config: vjsnOptions): void {
    const globalConfig = {
      selector: `[data-focusable=true]`
    } as vjsnOptions;

    Object.assign(globalConfig, config);
    SpatialNavigation.init();
    SpatialNavigation.set(globalConfig);
    Vue.config.globalProperties.$SpatialNavigation = SpatialNavigation;

    const assignConfig = (
      sectionId: string,
      config: vjsnOptions
    ): vjsnOptions => {
      const sectionConfig = Object.assign({}, globalConfig);

      if (config) {
        Object.assign(sectionConfig, config);
      }

      sectionConfig.selector = `[data-section-id="${sectionId}"] [data-focusable=true]`;

      return sectionConfig;
    };

    const focusSectionDirective: Directive<HTMLElement, vjsnOptions> = {
      beforeMount(el: HTMLElement, binding: DirectiveBinding<vjsnOptions>) {
        let sectionId;

        if (binding.arg) {
          sectionId = binding.arg;

          try {
            SpatialNavigation.add(sectionId, {});
          } catch (error) {
            console.error(error);
          }
        } else {
          sectionId = SpatialNavigation.add({});
        }

        // set sectionid to data set for removing when unbinding
        el.dataset.sectionId = sectionId;
        SpatialNavigation.set(
          sectionId,
          assignConfig(sectionId, binding.value)
        );

        // set default section
        if (binding.modifiers.default) {
          SpatialNavigation.setDefaultSection(sectionId);
        }
      },
      updated(el, binding) {
        let sectionId = el.dataset.sectionId;

        if (binding.arg && sectionId != binding.arg) {
          sectionId = binding.arg;
          el.dataset.sectionId = sectionId;
        }

        if (binding.value) {
          try {
            SpatialNavigation.set(sectionId, binding.value);
          } catch {
            SpatialNavigation.add(
              sectionId,
              assignConfig(sectionId!, binding.value)
            );
          }
        }
      },
      unmounted(el) {
        SpatialNavigation.remove(el.dataset.sectionId);
      }
    };

    // focus section directive
    Vue.directive('focus-section', focusSectionDirective);

    const disableSection = (sectionId: string, disable = true): void => {
      if (disable) {
        SpatialNavigation.disable(sectionId);
      } else {
        SpatialNavigation.enable(sectionId);
      }
    };

    // diasble focus section directive
    Vue.directive('disable-focus-section', {
      beforeMount(el, binding) {
        disableSection(el.dataset.sectionId, binding.value);
      },
      updated(el, binding) {
        disableSection(el.dataset.sectionId, binding.value);
      }
    } as Directive);

    const disableElement = (el: HTMLElement, focusable = true): void => {
      if (!el.dataset.focusable || el.dataset.focusable != `${focusable}`) {
        el.dataset.focusable = `${focusable}`;

        if (focusable) {
          el.tabIndex = -1;
        }
      }
    };

    // focusable directive
    Vue.directive('focus', {
      beforeMount(el, binding) {
        disableElement(el, binding.value);
      },
      mounted(el, binding) {
        el.addEventListener('mouseenter', () => {
          SpatialNavigation.focus(el);
        });
        el.addEventListener('click', () => {
          el.dispatchEvent(new KeyboardEvent('keydown', { keyCode: 13 }));
        });
      },
      updated(el, binding) {
        disableElement(el, binding.value);
      },
      unmounted(el) {
        delete el.dataset.focusable;
      }
    } as Directive);

    // It can be expensive to check through this list for every events registered for every button.
    // With typescript this could be done with typedefinition
    const EVENTS = new Set([
      'willmove',
      'willunfocus',
      'unfocused',
      'willfocus',
      'focused',
      'navigatefailed',
      'enter-down',
      'enter-up'
    ]);

    // At some point we might need the handling of what happens with eventlistener when the binding is updated.
    // This might also be split into different directives to handle remove eventlisteners
    Vue.directive('focus-events', {
      mounted(el, binding) {
        for (const [i, key] of Object.keys(binding.value).entries()) {
          if (EVENTS.has(key)) {
            el.addEventListener(EVENT_PREFIX + key, binding.value[key]);
          }
        }
      }
    } as Directive<HTMLElement, { [key: string]: EventListenerOrEventListenerObject }>);
  }
};

export * from './options';

export default vueSpatialNavigation;
