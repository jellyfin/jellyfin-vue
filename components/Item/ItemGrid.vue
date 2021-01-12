<template>
  <div>
    <v-row v-if="loading && !mounted">
      <v-col cols="12" class="card-grid-container">
        <skeleton-card v-for="n in 24" :key="n" text />
      </v-col>
    </v-row>
    <v-row v-else-if="!loading && !items.length & !mounted" justify="center">
      <v-col cols="12" class="card-grid-container empty-card-container">
        <skeleton-card v-for="n in 24" :key="n" text boilerplate />
      </v-col>
      <div class="empty-message text-center">
        <slot>
          <h1 class="text-h5">
            {{ $t('noResultsFound') }}
          </h1>
        </slot>
      </div>
    </v-row>
    <v-row>
      <v-col
        v-show="!loading && items.length && mounted"
        ref="cardArea"
        cols="12"
        class="card-grid-container"
      />
    </v-row>
  </div>
</template>

<script lang="ts">
import Vue from 'vue';
import { BaseItemDto } from '@jellyfin/client-axios';
import { xorBy, chunk, range, reverse } from 'lodash';
import CardVue from './Card/VirtualCard.vue';

const CardConstructor = Vue.extend(CardVue);

interface LazyCardInstance extends Vue {
  item: BaseItemDto;
  $el: Element;
}
/**
 * Variables that doesn't need to use Vue's reactivity system, so setting them here should
 * improve performance as there are no Vue proxies involved.
 *
 * If, at some point, we will have more than one ItemGrid component rendered at the same time, we need
 * to move all the variables here inside data(), as these variables are going to be shared with all the
 * ItemGrid instances and that will break everything.
 */
let intersectedRows = [] as number[];
let instances = [] as LazyCardInstance[];
let chunkedItems = [] as BaseItemDto[][];
let chunkedInstances = [] as LazyCardInstance[][];
let rowsInViewport = 0;
let virtualCards = 0;
let cardsPerRow = 0;
let cardHeight = 0;
let virtualRows = 0;
let realRows = 0;
let firstRow = 0;
let endRow = 0;

export default Vue.extend({
  props: {
    items: {
      type: Array,
      required: true,
      default: (): BaseItemDto[] => {
        return [];
      }
    },
    loading: {
      type: Boolean,
      required: true
    },
    /**
     * This is just an estimation of the *minimum* amount of cards that will be rendered: for the best experience,
     * all the rows must contain the same amount of cards and additional cards will be created
     * if the page is zoomed out. If any of both conditions take place, additional components to supply the carencies will be appended.
     */
    targetCards: {
      type: Number,
      required: false,
      default: 150
    }
  },
  data() {
    return {
      mounted: false,
      observer: undefined as undefined | IntersectionObserver,
      cardArea: undefined as undefined | HTMLElement
    };
  },
  watch: {
    items: {
      handler(newArr: BaseItemDto[], oldArr: BaseItemDto[]): void {
        if (this.items.length && !this.loading && !this.mounted) {
          this.$nextTick(() => {
            this.initComponents();
          });
        } else if (this.items.length) {
          this.onItemsUpdate(newArr, oldArr);
        }
      },
      deep: true,
      immediate: true
    },
    mounted: {
      handler(): void {
        window.requestAnimationFrame(() => {
          this.updateSentinel();
        });
      },
      immediate: true
    }
  },
  beforeMount(): void {
    virtualCards = this.targetCards;
  },
  mounted() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        this.onIntersect(entry);
      });
    });
    this.cardArea = this.$refs.cardArea as HTMLElement;
    window.addEventListener('resize', this.onResize);
    window.addEventListener('scroll', this.onScroll, { passive: true });
  },
  destroyed(): void {
    this.observer?.disconnect();
    window.removeEventListener('resize', this.onResize);
    window.removeEventListener('scroll', this.onScroll);
    intersectedRows = [];
    /**
     * TODO: Investigate if this is really needed: I (ferferga) had some memory leaks while in dev mode.
     * I did thorough testing in production, however, that proves anything.
     *
     * Is important to test this as $destroy is not supported in Vue 3.
     */
    instances.forEach((instance) => {
      instance.$destroy();
    });
    instances = [];
    chunkedItems = [] as BaseItemDto[][];
    chunkedInstances = [] as LazyCardInstance[][];
    rowsInViewport = 0;
    virtualCards = 0;
    cardsPerRow = 0;
    cardHeight = 0;
    virtualRows = 0;
    realRows = 0;
    firstRow = 0;
    endRow = 0;
  },
  methods: {
    // eslint-disable-next-line jsdoc/require-param
    /**
     * Getters / setters helper functions
     */
    setDataItemId(target: HTMLElement | Element, item: BaseItemDto): void {
      target.setAttribute('data-item-id', item.Id as string);
    },
    getDataItemId(target: HTMLElement | Element): string {
      return target.getAttribute('data-item-id') as string;
    },
    setInstanceIndex(target: HTMLElement | Element, index: number): void {
      target.setAttribute('data-instance-index', index.toString());
    },
    getInstanceIndex(target: HTMLElement | Element): number {
      return parseInt(target.getAttribute('data-instance-index') as string);
    },
    getDataItemIndex(target: HTMLElement | Element): number {
      return parseInt(target.getAttribute('data-item-index') as string);
    },
    setDataItemIndex(target: HTMLElement | Element, index: number): void {
      target.setAttribute('data-item-index', index.toString());
    },
    getDataRow(target: HTMLElement | Element): number {
      return parseInt(target.getAttribute('data-row') as string);
    },
    setDataRow(target: HTMLElement | Element, row: number): void {
      target.setAttribute('data-row', row.toString());
    },
    /**
     * Initializes the Vue instances that holds the card's DOM.
     *
     * @param {number} cardnum - Number of cards to create. If not specified, initComponents will determine it automatically.
     */
    initComponents(cardnum?: number | undefined): void {
      let loop = 0;
      let maxIterations = 0;
      if (!cardnum) {
        if (!instances.length) {
          if (virtualCards > this.items.length) {
            maxIterations = this.items.length;
          } else {
            maxIterations = virtualCards;
          }
        } else if (virtualCards > instances.length) {
          maxIterations = virtualCards - instances.length;
        }
      } else {
        maxIterations = cardnum;
      }

      while (loop < maxIterations) {
        const item = this.items[instances.length] as BaseItemDto;
        const card = new CardConstructor({
          parent: this,
          key: item?.Id,
          data: {
            item
          }
        });
        instances.push(card);
        card.$mount();
        this.setInstanceIndex(card.$el, instances.length - 1);
        this.setDataItemId(card.$el, item);
        this.setDataItemIndex(card.$el, this.items.indexOf(item));
        /**
         * At this stage, cardArea is hidden with 'display: none' in the v-show directive
         * because mounted is still not true, so no reflow it's taking place
         * and appends are very performant
         */
        this.cardArea?.appendChild(card.$el);
        this.observer?.observe(card.$el);
        loop++;
      }
      this.mounted = true;
      window.requestAnimationFrame(() => {
        this.determineCardsPerRow();
      });
    },
    /**
     * Determines the number of cards that a row has and the height between the rows, so we can calculate
     * the number of "virtual" rows we need to simulate.
     */
    determineCardsPerRow(): void {
      cardsPerRow = 0;
      let lastYCoord = 0;
      for (const [index, instance] of instances.entries()) {
        const rect = instance.$el.getBoundingClientRect();
        if (lastYCoord === 0) {
          lastYCoord = rect.y;
          cardHeight = rect.height;
        } else if (lastYCoord < rect.y) {
          cardsPerRow = index;
          break;
        }
      }
      rowsInViewport = Math.floor(window.innerHeight / cardHeight);

      chunkedInstances = chunk(instances, cardsPerRow);
      chunkedItems = chunk(this.items, cardsPerRow) as BaseItemDto[][];
      virtualRows = chunkedInstances.length;

      if (endRow === 0) {
        endRow = virtualRows;
      }

      /**
       * Update the row of each of the instances
       */
      instances.forEach((instance) => {
        const el = instance.$el;
        const index = this.getDataItemIndex(el);
        const newRow = Math.floor(index / cardsPerRow);
        this.setDataRow(el, newRow);
      });
      realRows = Math.floor(this.items.length / cardsPerRow) - 1; // To account for the virtual rows, that start from 0.

      /**
       * After updating the rows, we get the actual elements and sorted by item index (minor to major), as the instances
       * index are only a reference for the correct firstRow only during mount. After scrolling, all of them are shuffled
       * around the page, so they're no longer an indicative of the actual row order.
       */
      const func = this.getDataItemIndex;
      const cards = Array.from(
        (this.cardArea as HTMLElement).querySelectorAll(`span[data-row]`)
      ).sort((a, b) => {
        return func(a) - func(b);
      });

      firstRow = this.getDataRow(cards[0]);
      endRow = this.getDataRow(cards[cards.length - 1]);

      this.createExtraCards();
      this.updateSentinel();
      this.swapRows();
    },
    /**
     * Updates the visible components after an items prop update.
     *
     * @param {BaseItemDto[]} changedItems - XOR of the new and old BaseItemDto array.
     * @param {BaseItemDto[]} oldArr - Old BaseItemDto array
     */
    updateComponents(changedItems: BaseItemDto[], oldArr: BaseItemDto[]): void {
      for (const item of changedItems) {
        const oldItemIndex = oldArr.indexOf(item);
        const newItemIndex = this.items.indexOf(item);
        /**
         * Queries the DOM elements of VirtualCard Vue components.
         */
        const target = this.cardArea?.querySelector(
          `span[data-item-index="${newItemIndex}"]`
        );
        const oldTarget = this.cardArea?.querySelector(
          `span[data-item-index="${oldItemIndex}"]`
        );
        /**
         * If target exists, it means that the item index in the array was updated while it was visible to the user.
         * If it doesn't, it means that the item was removed, or it is outside the viewport.
         *
         * All the item's updates for items not in the viewport will be handled by swapRows() function.
         */
        if (!target && !oldTarget) {
          continue;
        }

        if (target && !oldTarget) {
          const instance = instances[this.getInstanceIndex(target)];
          instance.item = item;
          this.setDataItemId(target, item);
          instance.$el.classList.remove('d-none');
        } else if (oldTarget && !target && oldItemIndex !== undefined) {
          const it = this.items[oldItemIndex] as BaseItemDto;
          if (!it) {
            continue;
          }
          const instance = instances[this.getInstanceIndex(oldTarget)];
          instance.item = it;
          this.setDataItemId(oldTarget, it);
          instance.$el.classList.remove('d-none');
        } else if (target && oldTarget && oldItemIndex !== undefined) {
          const oldIt = this.items[oldItemIndex] as BaseItemDto;
          if (!oldIt) {
            continue;
          }
          const oldInstance = instances[this.getInstanceIndex(oldTarget)];
          const newInstance = instances[this.getInstanceIndex(target)];
          oldInstance.item = oldIt;
          newInstance.item = item;
          this.setDataItemId(target, item);
          this.setDataItemId(oldTarget, oldIt);
          oldInstance.$el.classList.remove('d-none');
          newInstance.$el.classList.remove('d-none');
        }
      }

      instances.forEach((instance) => {
        if (!this.items.includes(instance.item)) {
          instance.$el.classList.add('d-none');
        } else {
          instance.$el.classList.remove('d-none');
        }
      });
    },
    /**
     * Fires the functions that need to run after an update to the items array.
     *
     * @param {BaseItemDto[]} newArr - New Array.
     * @param {BaseItemDto[]} oldArr - Original array.
     */
    onItemsUpdate(newArr: BaseItemDto[], oldArr: BaseItemDto[]): void {
      if (newArr.length) {
        if (virtualCards < instances.length) {
          this.initComponents();
        }
        /**
         * We need to reset the sentinel first so the card height can be determined properly.
         */
        window.requestAnimationFrame(() => {
          this.resetSentinel();
        });
        this.updateComponents(
          xorBy(newArr, oldArr, (item) => {
            if (newArr.includes(item)) {
              return item.Id;
            }
          }) as BaseItemDto[],
          oldArr
        );
        window.requestAnimationFrame(() => {
          this.determineCardsPerRow();
        });
      }
    },
    /**
     * Checks if the last row has the same amount of cards that all the other cards. If it doesn't, it create extra cards,
     * so all the rows  are equal.
     */
    createExtraCards(): void {
      if (this.mounted && !this.loading && chunkedInstances.length) {
        const cardsInLastRow =
          chunkedInstances[chunkedInstances.length - 1].length;

        const cardsToAdd = cardsPerRow - cardsInLastRow;

        if (
          cardsInLastRow !== cardsPerRow &&
          virtualCards + cardsToAdd <= this.items.length
        ) {
          this.initComponents(cardsToAdd);
          virtualCards += cardsToAdd;
        }
        chunkedInstances = chunk(instances, cardsPerRow);
      }
    },
    /**
     * When the webpage is zoomed out, more components than the ones that we already have created will need to ve visible.
     * This is specially true when browsing a music library at 25% of zoom. We create one row with this function. IntersectionObserver
     * will catch the callbacks for those added items and check their visibility. If more cards are still needed, onIntersect will call this function again.
     */
    createExtraRow(): void {
      if (virtualCards + cardsPerRow <= this.items.length) {
        this.initComponents(cardsPerRow);
        endRow++;
        virtualRows++;
        virtualCards += cardsPerRow;
      }
    },
    /**
     * Make the scrollbar appear as if we were scrolling the real items
     */
    updateSentinel(): void {
      if (realRows <= virtualRows) {
        this.resetSentinel();
      } else {
        const topSpace = firstRow * cardHeight;
        const bottomSpace = realRows * cardHeight - endRow * cardHeight;
        (this.cardArea as HTMLElement).style.marginBottom = `${bottomSpace}px`;
        (this.cardArea as HTMLElement).style.marginTop = `${topSpace}px`;
      }
    },
    resetSentinel(): void {
      (this.cardArea as HTMLElement).style.marginBottom = '0px';
      (this.cardArea as HTMLElement).style.marginTop = '0px';
    },
    /**
     * Moves a row to the bottom.
     *
     * @param {number} row - The row number to move to the bottom
     */
    rowToBottom(row: number): void {
      const func = this.getDataItemIndex;
      const cards = Array.from(
        (this.cardArea as HTMLElement).querySelectorAll(
          `span[data-row="${row}"]`
        )
      ).sort((a, b) => {
        return func(a) - func(b);
      });

      const resultingRow = endRow + 1;
      const itemRow = chunkedItems[resultingRow];

      if (itemRow && cards.length > 0) {
        for (const [index, elem] of cards.entries()) {
          /**
           * We could append the item directly to move it, but removing it and doing all the operations offscreen
           * provides better performance.
           */
          this.cardArea?.removeChild(elem);
          this.setDataRow(elem, resultingRow);
          const instance = instances[this.getInstanceIndex(elem)];
          const item = itemRow[index];
          if (!item) {
            elem.classList.add('d-none');
          } else {
            elem.classList.remove('d-none');
            this.setDataItemIndex(elem, this.items.indexOf(item));
            this.setDataItemId(elem, item);
            instance.item = item;
          }
          this.cardArea?.appendChild(elem);
        }
        firstRow++;
        endRow++;
        this.updateSentinel();
      }
    },
    /**
     * Moves a row to the top.
     *
     * @param {number} row - The row number to move to the top
     */
    rowToTop(row: number): void {
      const func = this.getDataItemIndex;
      const cards = Array.from(
        (this.cardArea as HTMLElement).querySelectorAll(
          `span[data-row="${row}"]`
        )
      ).sort((a, b) => {
        return func(b) - func(a);
      });

      const resultingRow = firstRow - 1;
      const itemRow = chunkedItems[resultingRow];

      const elemArr = [];
      if (itemRow && cards.length > 0) {
        for (const [index, elem] of cards.entries()) {
          /**
           * We could append the item directly to move it, but removing it and doing all the operations offscreen
           * provides better performance.
           */
          this.cardArea?.removeChild(elem);
          this.setDataRow(elem, resultingRow);
          const instance = instances[this.getInstanceIndex(elem)];
          const item = itemRow[index];
          elem.classList.remove('d-none');
          this.setDataItemIndex(elem, this.items.indexOf(item));
          this.setDataItemId(elem, item);
          instance.item = item;
          elemArr.push(elem);
        }

        /**
         * We need to append them in reverse order. We can't do this in the main loop, as we will be reversing the
         * order of the items but not the appends itself, which is what we need to do.
         */
        reverse(elemArr).forEach((elem) => {
          this.cardArea?.insertBefore(elem, this.cardArea?.firstChild);
        });

        firstRow--;
        endRow--;
        this.updateSentinel();
      }
    },
    /**
     * Handles all the logic for swapping rows to the top or to the bottom.
     */
    swapRows(): void {
      if (this.mounted && !this.loading) {
        let topRang = [] as number[];
        let botRang = [] as number[];
        /**
         * This gives us the realRow equivalent of the row that it's located at the top of the viewport
         */
        const visibleRow = Math.floor(window.scrollY / cardHeight);
        /**
         * This will give us the realRow equivalent of the centered row in the viewport
         */
        const centeredRow = visibleRow + Math.ceil(rowsInViewport / 2);
        /**
         * This will give us the realRow equivalent of the centered row in viewport of the virtual cards.
         */
        const virtualCenteredRow = Math.ceil(virtualRows / 2) + firstRow;
        /**
         * This give us the minimum top row that must be present in our virtual cards.
         */
        const minTopRow = centeredRow - virtualCenteredRow + firstRow;

        if (centeredRow > virtualCenteredRow) {
          if (minTopRow <= 0) {
            topRang = range(firstRow, 0);
          } else {
            topRang = range(firstRow, minTopRow + 1);
          }
        }
        /**
         * This gives us the minimum bottom row that must be present in our virtual cards.
         */
        const minBotRow = minTopRow + virtualRows;

        if (centeredRow < virtualCenteredRow) {
          if (minBotRow >= realRows) {
            botRang = range(endRow, realRows);
          } else {
            botRang = range(endRow, minBotRow);
          }
        }

        topRang.forEach((row) => {
          this.rowToBottom(row);
        });
        botRang.forEach((row) => {
          this.rowToTop(row);
        });
      }
    },
    /**
     * Handles the IntersectionObserver callback.
     *
     * @param {IntersectionObserverEntry} entry - entry of the intersection observer.
     */
    onIntersect(entry: IntersectionObserverEntry): void {
      if (entry.isIntersecting) {
        intersectedRows.push(this.getDataRow(entry.target));
      } else {
        intersectedRows.splice(
          intersectedRows.indexOf(this.getDataRow(entry.target), 1)
        );
      }

      if (
        intersectedRows.length === virtualCards &&
        this.items.length > intersectedRows.length
      ) {
        /**
         * We create three extra rows, instead of one to have more "buffer" space. If there are still more items that must be visible,
         * this IntersectionObserver callback will be called again and create 3 rows more for us.
         */
        this.createExtraRow();
        this.createExtraRow();
        this.createExtraRow();
      }
    },
    /**
     * Handles all the resizing events
     */
    onResize(): void {
      if (this.mounted && !this.loading) {
        window.requestAnimationFrame(async () => {
          await this.determineCardsPerRow();
        });
      }
    },
    onScroll(): void {
      this.swapRows();
    }
  }
});
</script>

<style lang="scss" scoped>
.empty-card-container {
  max-height: 90vh;
  overflow: hidden;
  mask-image: linear-gradient(to bottom, rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0));
}

.empty-message {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
}

.card-grid-container {
  content-visibility: auto;
  user-select: none;
  display: grid;
}

@import '~vuetify/src/styles/styles.sass';
@media #{map-get($display-breakpoints, 'sm-and-down')} {
  .card-grid-container {
    grid-template-columns: repeat(3, minmax(calc(100% / 3), 1fr));
  }
}

@media #{map-get($display-breakpoints, 'sm-and-up')} {
  .card-grid-container {
    grid-template-columns: repeat(4, minmax(calc(100% / 4), 1fr));
  }
}

@media #{map-get($display-breakpoints, 'lg-and-up')} {
  .card-grid-container {
    grid-template-columns: repeat(6, minmax(calc(100% / 6), 1fr));
  }
}

@media #{map-get($display-breakpoints, 'xl-only')} {
  .card-grid-container {
    grid-template-columns: repeat(8, minmax(calc(100% / 8), 1fr));
  }
}
</style>
