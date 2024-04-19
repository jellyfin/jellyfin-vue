import { unrefElement, type MaybeElementRef } from '@vueuse/core';
import { computed, type ComputedRef } from 'vue';

/**
 * == TYPES AND INTERFACES ==
 */

interface ScrollParents {
  vertical: Element;
  horizontal: Element;
}

export interface SpaceAroundWindow {
  left: number;
  top: number;
}

interface GridMeasurement {
  colGap: number;
  rowGap: number;
  flow: 'row' | 'column';
  columns: number;
  rows: number;
}

export interface ResizeMeasurement extends GridMeasurement {
  itemHeightWithGap: number;
  itemWidthWithGap: number;
}

interface BufferMeta {
  bufferedOffset: number;
  bufferedLength: number;
}

interface ItemOffset {
  x: number;
  y: number;
}

export interface ContentSize {
  width?: number;
  height?: number;
}

export interface InternalItem<T> {
  index: number;
  value: T;
  style?: { transform: string; gridArea: string };
}

/**
 * == HELPER FUNCTIONS FOR VIRTUALGRID ==
 */

/**
 * Gets the appropiate scroll parent for the virtual grid DOM element
 */
export function getScrollParents(
  element: HTMLElement,
  includeHidden = false
): ScrollParents {
  const style = getComputedStyle(element);

  if (style.position === 'fixed') {
    return {
      vertical: document.body,
      horizontal: document.body
    };
  }

  const overflowRegex = includeHidden
    ? /(auto|scroll|hidden)/
    : /(auto|scroll)/;

  let vertical: HTMLElement | undefined;
  let horizontal: HTMLElement | undefined;
  let parent: HTMLElement | null = element;

  while (parent && !vertical && !horizontal) {
    const parentStyle = getComputedStyle(parent);

    horizontal
      = overflowRegex.test(parentStyle.overflowX)
        ? parent
        : undefined;

    vertical
      = overflowRegex.test(parentStyle.overflowY)
        ? parent
        : undefined;

    /**
     * Parent.assignedSlot.parentElement find the correct parent if the grid is inside a native web component
     */
    parent = parent.assignedSlot?.parentElement ?? parent.parentElement;
  }

  const fallback = document.scrollingElement ?? document.documentElement;

  return {
    vertical: vertical ?? fallback,
    horizontal: horizontal ?? fallback
  };
}

/**
 * Gets the appropiate DOM element for listening to scroll events
 */
export function fromScrollParent(
  elRef: MaybeElementRef
): ComputedRef<(Element | (Window & typeof globalThis))[] | undefined> {
  return computed(() => {
    const el = unrefElement(elRef);

    if (el && el instanceof HTMLElement) {
      const { vertical, horizontal } = getScrollParents(el);

      /**
       * If the scrolling parent is the doc root, use window instead as using
       * document root might not work properly.
       */
      return (
        vertical === horizontal ? [vertical] : [vertical, horizontal]
      ).map(parent =>
        parent === document.documentElement ? window : parent
      );
    }
  });
}

/**
 * Gets the gap and spacing between grid elements, alongside the flow of the grid
 */
export function getGridMeasurement(rootEl: Element): GridMeasurement {
  const computedStyle = window.getComputedStyle(rootEl);

  return {
    rowGap: Number.parseInt(computedStyle.getPropertyValue('row-gap')) || 0,
    colGap: Number.parseInt(computedStyle.getPropertyValue('column-gap')) || 0,
    flow: computedStyle.getPropertyValue('grid-auto-flow').startsWith('column')
      ? 'column'
      : 'row',
    columns: computedStyle.getPropertyValue('grid-template-columns').split(' ')
      .length,
    rows: computedStyle.getPropertyValue('grid-template-rows').split(' ').length
  };
}

/**
 * Gets the size size measurement between the bounds of the viewport:
 * the space that's above and below what the user is currently seeing onscreen.
 */
export function getResizeMeasurement(
  rootEl: Element,
  rect: DOMRectReadOnly
): ResizeMeasurement {
  const { height, width } = rect;
  const { colGap, rowGap, flow, columns, rows } = getGridMeasurement(rootEl);

  return {
    colGap,
    rowGap,
    flow,
    columns,
    rows,
    itemHeightWithGap: height + rowGap,
    itemWidthWithGap: width + colGap
  };
}

/**
 * Gets the position of the virtual buffer (bufferOffset) and the
 * length of visible DOM nodes (bufferedLength)
 */
export function getBufferMeta(
  spaceAroundWindow: SpaceAroundWindow,
  resizeMeasurement: ResizeMeasurement,
  multiplier: number,
  windowInnerWidth: number = window.innerWidth,
  windowInnerHeight: number = window.innerHeight
): BufferMeta {
  const {
    colGap,
    rowGap,
    flow,
    columns,
    rows,
    itemHeightWithGap,
    itemWidthWithGap
  } = resizeMeasurement;

  let crosswiseLines: number;
  let gap: number;
  let itemSizeWithGap: number;
  let windowInnerSize: number;
  let spaceBehind: number;

  if (flow === 'row') {
    crosswiseLines = columns;
    gap = rowGap;
    itemSizeWithGap = itemHeightWithGap;
    windowInnerSize = windowInnerHeight;
    spaceBehind = spaceAroundWindow.top;
  } else {
    crosswiseLines = rows;
    gap = colGap;
    itemSizeWithGap = itemWidthWithGap;
    windowInnerSize = windowInnerWidth;
    spaceBehind = spaceAroundWindow.left;
  }

  /**
   * In this section we distinguish between the following concepts:
   * - Items: The array of elements that were passed to the VirtualGrid component
   * - Lines: Lines of the CSS grid
   */

  /**
   * Lines that are intersecting the viewport
   */
  const linesInView = Math.round((windowInnerSize + gap) / itemSizeWithGap);
  /**
   * All the lines (virtual + rendered) that are before the current scrolling position
   */
  const linesBefore = Math.ceil((spaceBehind + gap) / itemSizeWithGap);
  /**
   * All the items (virtual + rendered) that are before the current scrolling position
   */
  const itemsBefore = linesBefore * crosswiseLines;
  /**
   * Items that are currently intersecting the viewport.
   * Basically multiply lines by columns
   */
  const itemsIntersectingViewport = linesInView * crosswiseLines;
  /**
   * DOM nodes that will be in the DOM tree. Ensure it's an even number and that there are
   * the same amount of items above and below any scrolling position (that's why we multiply by 4).
   *
   * Take in account as well the user-provided multiplier
   */
  const intersectedWithMultiplier = itemsIntersectingViewport * multiplier;
  const renderedItems
    = (intersectedWithMultiplier) % 2 === 0
      ? intersectedWithMultiplier * 4
      : intersectedWithMultiplier * 4 + 1;
  /**
   * DOM nodes that are not intersecting the viewport
   */
  const itemsAroundViewport = renderedItems - itemsIntersectingViewport;
  /**
   * Position of the first item
   *
   * We divide by 2 as in itemsAroundViewport we have items above and below the viewport,
   * and we only want to get the items that are above.
   */
  const cursor = Math.max(itemsBefore - Math.round(itemsAroundViewport / 2), 0);

  return {
    bufferedOffset: cursor,
    bufferedLength: renderedItems
  };
}

/**
 * Gets the position of the item to apply it correctly into the grid
 */
export function getItemOffsetByIndex(
  index: number,
  resizeMeasurement: ResizeMeasurement
): ItemOffset {
  const { flow, columns, rows, itemWidthWithGap, itemHeightWithGap }
    = resizeMeasurement;

  let x;
  let y;

  if (flow === 'row') {
    x = (index % columns) * itemWidthWithGap;
    y = Math.floor(index / columns) * itemHeightWithGap;
  } else {
    x = Math.floor(index / rows) * itemWidthWithGap;
    y = (index % rows) * itemHeightWithGap;
  }

  return { x, y };
}

/**
 * Gets the items that must be visible in the grid based on the buffer measurements
 */
export function getVisibleItems<T>(
  bufferMeta: BufferMeta,
  resizeMeasurement: ResizeMeasurement,
  allItems: T[]
): InternalItem<T>[] {
  const { bufferedOffset, bufferedLength } = bufferMeta;

  /**
   * When approaching the end of the VirtualGrid, we want to always be sure that
   * bufferedLength = the amount of visible items,
   * so no DOM nodes are destroyed (which would be a waste of resources if the user reverses the scroll),
   * so we need to change the slice values depending on the current offset.
   *
   * OffsetPlusLength is the length ahead that we have DOM nodes available for rendering.
   *
   * We initialize 'first' to 0 and 'last' to allItems.length to take into account those cases
   * where the available buffer is bigger than the real amount of items we need to display,
   * the if statement is where we really take into account a real virtual scrolling scenario
   */
  const offsetPlusLength = bufferedOffset + bufferedLength;
  let first = 0;
  let last = allItems.length;

  if (allItems.length > bufferedLength) {
    first
      = allItems.length < offsetPlusLength
        ? allItems.length - bufferedLength
        : bufferedOffset;
    last
      = allItems.length < offsetPlusLength ? allItems.length : offsetPlusLength;
  }

  return allItems.slice(first, last).map((value, localIndex) => {
    const index = first + localIndex;
    const { x, y } = getItemOffsetByIndex(index, resizeMeasurement);

    return {
      index,
      value,
      style: {
        gridArea: '1/1',
        transform: `translate(${x}px, ${y}px)`
      }
    };
  });
}

/**
 * Gets the grid measurement based on the window resize
 */
export function getContentSize(
  resizeMeasurement: ResizeMeasurement,
  length: number
): ContentSize {
  const {
    colGap,
    rowGap,
    flow,
    columns,
    rows,
    itemWidthWithGap,
    itemHeightWithGap
  } = resizeMeasurement;

  return flow === 'row'
    ? { height: itemHeightWithGap * Math.ceil(length / columns) - rowGap }
    : { width: itemWidthWithGap * Math.ceil(length / rows) - colGap };
}
