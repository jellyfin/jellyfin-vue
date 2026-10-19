import { watchImmediate } from '@vueuse/core';
import { getCurrentScope, isVNode, toRef, type ComponentInternalInstance, type EffectScope, type MaybeRefOrGetter, type VNode, type VNodeArrayChildren } from 'vue';

/**
 * When the passed argument is truthy, the effect scope of the current component will be paused
 * until the argument becomes falsy again.
 *
 * This is useful for components that need to pause the DOM patching
 */
export function usePausableEffect(signal: MaybeRefOrGetter<boolean>) {
  const scope = getCurrentScope();

  if (scope) {
    watchImmediate(toRef(signal), val => val ? scope.pause() : scope.resume(), { flush: 'sync' });
  }
}

/**
 * `scope` exists in every component instance, but it's marked as internal in Vue's public types
 */
type ScopedInstance = ComponentInternalInstance & { scope: EffectScope };

/**
 * Pauses the effect scope of the given component instance and all its descendants.
 *
 * The effect scopes of components are detached from their parent's, so pausing a component doesn't pause its descendants:
 * this walks the rendered tree to pause them one by one. Pending Suspense branches are skipped, since they're not
 * being displayed yet.
 *
 * TODO: Once https://github.com/vuejs/core/pull/13303 is merged, component scopes will be attached to their parent's,
 * so this can be replaced with `instance.scope.pause()`, returning `() => instance.scope.resume()`. Check that
 * pending Suspense branches don't stay paused, since this function skips them.
 *
 * @returns A function that resumes all the paused scopes
 */
export function pauseTree(instance: ComponentInternalInstance): () => void {
  const paused: EffectScope[] = [];
  const pause = (component: ComponentInternalInstance) => {
    const { scope } = component as ScopedInstance;

    scope.pause();
    paused.push(scope);
    walk(component.subTree);
  };
  const walkChildren = (children: VNodeArrayChildren) => {
    for (const child of children) {
      if (Array.isArray(child)) {
        walkChildren(child);
      } else if (isVNode(child)) {
        walk(child);
      }
    }
  };
  const walk = (node: VNode) => {
    if (node.component) {
      pause(node.component);
    } else if (node.suspense) {
      if (node.suspense.activeBranch) {
        walk(node.suspense.activeBranch);
      }
    } else if (Array.isArray(node.children)) {
      walkChildren(node.children);
    }
  };

  pause(instance);

  return () => {
    for (const scope of paused) {
      scope.resume();
    }
  };
}
