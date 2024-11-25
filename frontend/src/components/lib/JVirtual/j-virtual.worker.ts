import { expose } from 'comlink';
import { getItemOffsetByIndex, type ResizeMeasurement, type BufferMeta, type InternalItem } from './pipeline';
import { sealed } from '@/utils/validation';

@sealed
class JVirtualWorker {
  /**
   * Gets the items that must be visible in the grid based on the buffer measurements
   */
  public readonly getVisibleIndexes = (
    bufferMeta: BufferMeta,
    resizeMeasurement: ResizeMeasurement,
    collectionLength: number
  ): InternalItem[] => {
    const { bufferedOffset, bufferedLength } = bufferMeta;

    /**
     * When approaching the end of the VirtualGrid, we want to always be sure that
     * bufferedLength = the amount of visible items,
     * so no DOM nodes are destroyed (which would be a waste of resources if the user reverses the scroll),
     * so we need to change the slice values depending on the current offset.
     *
     * OffsetPlusLength is the length ahead that we have DOM nodes available for rendering.
     *
     * We initialize 'first' to 0 and 'last' to collectionLength to take into account those cases
     * where the available buffer is bigger than the real amount of items we need to display,
     * the if statement is where we really take into account a real virtual scrolling scenario
     */
    const offsetPlusLength = bufferedOffset + bufferedLength;
    let first = 0;
    let last = collectionLength;

    if (collectionLength > bufferedLength) {
      first
      = collectionLength < offsetPlusLength
          ? collectionLength - bufferedLength
          : bufferedOffset;
      last
      = Math.min(collectionLength, offsetPlusLength);
    }

    const res = [];

    for (let index = first; index < last; index++) {
      const { x, y } = getItemOffsetByIndex(index, resizeMeasurement);
      const translateX = `translateX(${x}px)`;
      const translateY = `translateY(${y}px)`;

      res.push({
        index,
        style: {
          transform: `${translateX} ${translateY}`
        }
      });
    }

    return res;
  };
}

const instance = new JVirtualWorker();
export default instance;
export type IJVirtualWorker = typeof instance;

expose(instance);
