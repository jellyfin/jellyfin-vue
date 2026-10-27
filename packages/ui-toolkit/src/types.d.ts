/**
 * Places some content (the `content` slot) next to an anchor (the default slot) using CSS anchor positioning.
 *
 * By default, the content is floating: it's rendered in the top layer, so no ancestor of the anchor can clip it,
 * constrain it or paint over it. That's what tooltips and menus need. Content that is part of the anchor
 * (like a badge) must use `inPlace` instead.
 */
export interface JAnchorProps {
  /**
   * Preferred side of the anchor where the content is placed. The real position might differ,
   * since the content flips to the opposite side automatically if it doesn't fit.
   */
  position?: 'top' | 'bottom' | 'left' | 'right';
  /**
   * Whether the content is displayed. Like the native `open` attribute, it's false when omitted
   */
  open?: boolean;
  /**
   * Gap (in px) between the anchor and the content. It's also kept as the minimum
   * distance to the edges of the available area.
   */
  offset?: number;
  /**
   * Renders the content in place, next to the anchor, instead of in the top layer.
   *
   * Use it for content that belongs to the anchor, like badges or status indicators, so it behaves like
   * any other part of it: it scrolls, fades and transforms along with the anchor, it's clipped by the same
   * containers and it stays below other overlays (like menus or dialogs).
   *
   * The content is positioned (and clipped) inside the anchor's closest positioned ancestor, so make sure there's
   * one with enough room for it. Floating content (like tooltips or menus) mustn't use it: any ancestor with overflow,
   * transforms or containment would clip it or leave it without room to be placed where it should.
   *
   * It has no z-index of its own, so positioned siblings with one (like JOverlay's 50) are painted over it.
   * Pass a z-index class if it must stay on top of them, keeping it below the app bar's (1006).
   *
   * @default false
   */
  inPlace?: boolean;
}

declare module 'vue' {
  interface HTMLAttributes {
    /**
     * Not included in Vue's typings yet
     */
    popover?: 'auto' | 'hint' | 'manual' | '';
  }
}
