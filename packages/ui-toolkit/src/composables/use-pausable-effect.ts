import { watchImmediate } from '@vueuse/core';
import { effectScope, getCurrentInstance, isVNode, onMounted, onScopeDispose, toRef, type ComponentInternalInstance, type EffectScope, type MaybeRefOrGetter, type VNode, type VNodeArrayChildren } from 'vue';

/**
 * `scope` exists in every component instance, but it's marked as internal in Vue's public types
 */
type ScopedInstance = ComponentInternalInstance & { scope: EffectScope };

/**
 * Components that use usePausableEffect, so they decide whether they and their descendants are paused
 */
const deciders = new WeakSet<ComponentInternalInstance>();

/**
 * Pauses the effect scope of the given component instance and all its descendants.
 *
 * The effect scopes of components are detached from their parent's, so pausing a component doesn't pause its descendants:
 * this walks the rendered tree to pause them one by one. Pending Suspense branches are skipped, since they're not
 * being displayed yet, as well as the descendants that use usePausableEffect, since they decide by themselves.
 *
 * TODO: Once https://github.com/vuejs/core/pull/13303 is merged, component scopes will be attached to their parent's,
 * so pausing a component will also pause its descendants. Check then if this walk can be replaced: pending Suspense
 * branches must not stay paused and the descendants that use usePausableEffect must keep deciding by themselves.
 *
 * @returns A function that resumes all the paused scopes
 */
function pauseTree(instance: ComponentInternalInstance): () => void {
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
      if (!deciders.has(node.component)) {
        pause(node.component);
      }
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

/**
 * While the passed argument is truthy, the current component and its descendants are paused: their effects don't react
 * to changes, so they don't patch the DOM either. The effects triggered meanwhile run once the argument is falsy again.
 *
 * The closest component that uses this composable decides for its descendants, so with `false` a component and its
 * descendants keep running while an ancestor is paused. This is useful for components that must keep reflecting
 * live state, like media players.
 *
 * Only the components being displayed when the argument becomes truthy are paused: the ones rendered afterwards
 * (through forced updates from their parents, which pausing doesn't prevent) keep running.
 */
export function usePausableEffect(signal: MaybeRefOrGetter<boolean>): void {
  const instance = getCurrentInstance();

  if (!instance) {
    return;
  }

  deciders.add(instance);

  /**
   * A component that is never paused only needs to be skipped by its ancestors
   */
  if (signal === false) {
    return;
  }

  /**
   * The watcher can't be part of the component's scope: it would be paused alongside it, so it could never resume it
   */
  const scope = effectScope(true);
  let resume: (() => void) | undefined;

  /**
   * Nothing is displayed before the component is mounted, so there's nothing to pause until then
   */
  onMounted(() => {
    scope.run(() => {
      watchImmediate(toRef(signal), (paused) => {
        if (paused) {
          resume ??= pauseTree(instance);
        } else {
          resume?.();
          resume = undefined;
        }
      }, { flush: 'sync' });
    });
  });
  onScopeDispose(() => scope.stop());
}
