/**
 * == TYPES AND INTERFACES ==
 */

import type { StyleValue } from 'vue';

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

export interface BufferMeta {
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

export interface InternalItem {
  index: number;
  style: StyleValue;
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
  const style = globalThis.getComputedStyle(element);

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
    const parentStyle = globalThis.getComputedStyle(parent);

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
 * Gets the gap and spacing between grid elements, alongside the flow of the grid
 */
export function getGridMeasurement(rootEl: Element): GridMeasurement {
  const computedStyle = globalThis.getComputedStyle(rootEl);

  return {
    rowGap: Number(computedStyle.getPropertyValue('row-gap')) || 0,
    colGap: Number(computedStyle.getPropertyValue('column-gap')) || 0,
    flow: computedStyle.getPropertyValue('grid-auto-flow') as 'column' | 'row',
    columns: computedStyle.getPropertyValue('grid-template-columns').split(' ').length,
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
 * Whether the scroll direction is horizontal or not
 */
function isHorizontallyScrolled(resizeMeasurement: ResizeMeasurement): boolean {
  return resizeMeasurement.flow === 'column';
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

  if (isHorizontallyScrolled(resizeMeasurement)) {
    crosswiseLines = rows;
    gap = colGap;
    itemSizeWithGap = itemWidthWithGap;
    windowInnerSize = windowInnerWidth;
    spaceBehind = spaceAroundWindow.left;
  } else {
    crosswiseLines = columns;
    gap = rowGap;
    itemSizeWithGap = itemHeightWithGap;
    windowInnerSize = windowInnerHeight;
    spaceBehind = spaceAroundWindow.top;
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
  const { columns, rows, itemWidthWithGap, itemHeightWithGap }
    = resizeMeasurement;

  let x: number;
  let y: number;

  if (isHorizontallyScrolled(resizeMeasurement)) {
    x = Math.floor(index / rows) * itemWidthWithGap;
    y = (index % rows) * itemHeightWithGap;
  } else {
    x = (index % columns) * itemWidthWithGap;
    y = Math.floor(index / columns) * itemHeightWithGap;
  }

  return { x, y };
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

/**
 * Gets the necessary information to scroll the grid to a specific item
 */
export function getScrollToInfo(scrollParents: ScrollParents, rootEl: HTMLElement, resizeMeasurement: ResizeMeasurement, scrollTo: number) {
  const computedStyle = globalThis.getComputedStyle(rootEl);

  const gridPaddingTop = Number(computedStyle.getPropertyValue('padding-top')) || 0;
  const gridBoarderTop = Number(computedStyle.getPropertyValue('border-top')) || 0;
  const gridPaddingLeft = Number(computedStyle.getPropertyValue('padding-left')) || 0;
  const gridBoarderLeft = Number(computedStyle.getPropertyValue('border-left')) || 0;

  const leftToGridContainer = rootEl instanceof HTMLElement
    && scrollParents.horizontal instanceof HTMLElement
    ? rootEl.offsetLeft - scrollParents.horizontal.offsetLeft
    : 0;

  const topToGridContainer = rootEl instanceof HTMLElement
    && scrollParents.vertical instanceof HTMLElement
    ? rootEl.offsetTop - scrollParents.vertical.offsetTop
    : 0;

  const { x, y } = getItemOffsetByIndex(scrollTo, resizeMeasurement);

  return {
    top: y + topToGridContainer + gridPaddingTop + gridBoarderTop,
    left: x + leftToGridContainer + gridPaddingLeft + gridBoarderLeft,
    target: isHorizontallyScrolled(resizeMeasurement) ? scrollParents.horizontal : scrollParents.vertical
  };
}
