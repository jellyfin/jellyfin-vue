declare module 'swiper/vue' {
  import { DefineComponent, PropType } from 'vue';
  import { SwiperOptions } from 'swiper';
  import { A11yOptions } from 'swiper/types/components/a11y';
  import { AutoplayOptions } from 'swiper/types/components/autoplay';
  import { ControllerOptions } from 'swiper/types/components/controller';
  import { CoverflowEffectOptions } from 'swiper/types/components/effect-coverflow';
  import { CubeEffectOptions } from 'swiper/types/components/effect-cube';
  import { FadeEffectOptions } from 'swiper/types/components/effect-fade';
  import { FlipEffectOptions } from 'swiper/types/components/effect-flip';
  import { HashNavigationOptions } from 'swiper/types/components/hash-navigation';
  import { HistoryOptions } from 'swiper/types/components/history';

  const Swiper: DefineComponent<{
    tag: {
      type: StringConstructor;
      default: StringConstructor;
    };
    wrapperTag: {
      type: StringConstructor;
      default: StringConstructor;
    };
    init: {
      type: BooleanConstructor;
      default: BooleanConstructor;
    };
    direction: {
      type: PropType<SwiperOptions['direction']>;
      default: SwiperOptions['direction'];
    };
    touchEventsTarget: {
      type: PropType<SwiperOptions['touchEventsTarget']>;
      default: SwiperOptions['touchEventsTarget'];
    };
    initialSlide: {
      type: NumberConstructor;
      default: SwiperOptions['initialSlide'];
    };
    speed: { type: NumberConstructor; default: SwiperOptions['speed'] };
    cssMode: { type: BooleanConstructor; default: SwiperOptions['cssMode'] };
    updateOnWindowResize: {
      type: BooleanConstructor;
      default: SwiperOptions['updateOnWindowResize'];
    };
    resizeObserver: {
      type: BooleanConstructor;
      default: SwiperOptions['resizeObserver'];
    };
    nested: { type: BooleanConstructor; default: SwiperOptions['nested'] };
    focusableElements: {
      type: BooleanConstructor;
      default: SwiperOptions['focusableElements'];
    };
    width: { type: NumberConstructor; default: SwiperOptions['width'] };
    height: { type: NumberConstructor; default: SwiperOptions['height'] };
    preventInteractionOnTransition: {
      type: string;
      default: SwiperOptions['preventInteractionOnTransition'];
    };
    userAgent: { type: StringConstructor; default: SwiperOptions['userAgent'] };
    url: { type: StringConstructor; default: SwiperOptions['url'] };
    edgeSwipeDetection: {
      type: [ObjectConstructor, StringConstructor];
      default: SwiperOptions['edgeSwipeDetection'];
    };
    edgeSwipeThreshold: {
      type: NumberConstructor;
      default: SwiperOptions['edgeSwipeThreshold'];
    };
    freeMode: { type: BooleanConstructor; default: SwiperOptions['freeMode'] };
    freeModeMomentum: {
      type: BooleanConstructor;
      default: SwiperOptions['freeModeMomentum'];
    };
    freeModeMomentumRatio: {
      type: NumberConstructor;
      default: SwiperOptions['freeModeMomentumRatio'];
    };
    freeModeMomentumBounce: {
      type: BooleanConstructor;
      default: SwiperOptions['freeModeMomentumBounce'];
    };
    freeModeMomentumBounceRatio: {
      type: NumberConstructor;
      default: SwiperOptions['freeModeMomentumBounceRatio'];
    };
    freeModeMomentumVelocityRatio: {
      type: NumberConstructor;
      default: SwiperOptions['freeModeMomentumVelocityRatio'];
    };
    freeModeSticky: {
      type: BooleanConstructor;
      default: SwiperOptions['freeModeSticky'];
    };
    freeModeMinimumVelocity: {
      type: NumberConstructor;
      default: SwiperOptions['freeModeMinimumVelocity'];
    };
    autoHeight: {
      type: BooleanConstructor;
      default: SwiperOptions['autoHeight'];
    };
    setWrapperSize: {
      type: BooleanConstructor;
      default: SwiperOptions['setWrapperSize'];
    };
    virtualTranslate: {
      type: BooleanConstructor;
      default: SwiperOptions['virtualTranslate'];
    };
    effect: {
      type: PropType<SwiperOptions['effect']>;
      default: SwiperOptions['effect'];
    };
    breakpoints: {
      type: ObjectConstructor;
      default: SwiperOptions['breakpoints'];
    };
    spaceBetween: {
      type: NumberConstructor;
      default: SwiperOptions['spaceBetween'];
    };
    slidesPerView: {
      type: [NumberConstructor, StringConstructor];
      default: SwiperOptions['slidesPerView'];
    };
    slidesPerColumn: {
      type: NumberConstructor;
      default: SwiperOptions['slidesPerColumn'];
    };
    slidesPerColumnFill: {
      type: PropType<SwiperOptions['slidesPerColumnFill']>;
      default: SwiperOptions['slidesPerColumnFill'];
    };
    slidesPerGroup: {
      type: NumberConstructor;
      default: SwiperOptions['slidesPerGroup'];
    };
    slidesPerGroupSkip: {
      type: NumberConstructor;
      default: SwiperOptions['slidesPerGroupSkip'];
    };
    centeredSlides: {
      type: BooleanConstructor;
      default: SwiperOptions['centeredSlides'];
    };
    centeredSlidesBounds: {
      type: BooleanConstructor;
      default: SwiperOptions['centeredSlidesBounds'];
    };
    slidesOffsetBefore: {
      type: NumberConstructor;
      default: SwiperOptions['slidesOffsetBefore'];
    };
    slidesOffsetAfter: {
      type: NumberConstructor;
      default: SwiperOptions['slidesOffsetAfter'];
    };
    normalizeSlideIndex: {
      type: BooleanConstructor;
      default: SwiperOptions['normalizeSlideIndex'];
    };
    centerInsufficientSlides: {
      type: BooleanConstructor;
      default: SwiperOptions['centerInsufficientSlides'];
    };
    watchOverflow: {
      type: BooleanConstructor;
      default: SwiperOptions['watchOverflow'];
    };
    roundLengths: {
      type: BooleanConstructor;
      default: SwiperOptions['roundLengths'];
    };
    touchRatio: {
      type: NumberConstructor;
      default: SwiperOptions['touchRatio'];
    };
    touchAngle: {
      type: NumberConstructor;
      default: SwiperOptions['touchAngle'];
    };
    simulateTouch: {
      type: BooleanConstructor;
      default: SwiperOptions['simulateTouch'];
    };
    shortSwipes: {
      type: BooleanConstructor;
      default: SwiperOptions['shortSwipes'];
    };
    longSwipes: {
      type: BooleanConstructor;
      default: SwiperOptions['longSwipes'];
    };
    longSwipesRatio: {
      type: NumberConstructor;
      default: SwiperOptions['longSwipesRatio'];
    };
    longSwipesMs: {
      type: NumberConstructor;
      default: SwiperOptions['longSwipesMs'];
    };
    followFinger: {
      type: BooleanConstructor;
      default: SwiperOptions['followFinger'];
    };
    allowTouchMove: {
      type: BooleanConstructor;
      default: SwiperOptions['allowTouchMove'];
    };
    threshold: { type: NumberConstructor; default: SwiperOptions['threshold'] };
    touchMoveStopPropagation: {
      type: BooleanConstructor;
      default: SwiperOptions['touchMoveStopPropagation'];
    };
    touchStartPreventDefault: {
      type: BooleanConstructor;
      default: SwiperOptions['touchStartPreventDefault'];
    };
    touchStartForcePreventDefault: {
      type: BooleanConstructor;
      default: SwiperOptions['touchStartForcePreventDefault'];
    };
    touchReleaseOnEdges: {
      type: BooleanConstructor;
      default: SwiperOptions['touchReleaseOnEdges'];
    };
    uniqueNavElements: {
      type: BooleanConstructor;
      default: SwiperOptions['uniqueNavElements'];
    };
    resistance: {
      type: BooleanConstructor;
      default: SwiperOptions['resistance'];
    };
    resistanceRatio: {
      type: NumberConstructor;
      default: SwiperOptions['resistanceRatio'];
    };
    watchSlidesProgress: {
      type: BooleanConstructor;
      default: SwiperOptions['watchSlidesProgress'];
    };
    watchSlidesVisibility: {
      type: BooleanConstructor;
      default: SwiperOptions['watchSlidesVisibility'];
    };
    grabCursor: {
      type: BooleanConstructor;
      default: SwiperOptions['grabCursor'];
    };
    preventClicks: {
      type: BooleanConstructor;
      default: SwiperOptions['preventClicks'];
    };
    preventClicksPropagation: {
      type: BooleanConstructor;
      default: SwiperOptions['preventClicksPropagation'];
    };
    slideToClickedSlide: {
      type: BooleanConstructor;
      default: SwiperOptions['slideToClickedSlide'];
    };
    preloadImages: {
      type: BooleanConstructor;
      default: SwiperOptions['preloadImages'];
    };
    updateOnImagesReady: {
      type: BooleanConstructor;
      default: SwiperOptions['updateOnImagesReady'];
    };
    loop: { type: BooleanConstructor; default: SwiperOptions['loop'] };
    loopAdditionalSlides: {
      type: NumberConstructor;
      default: SwiperOptions['loopAdditionalSlides'];
    };
    loopedSlides: {
      type: NumberConstructor;
      default: SwiperOptions['loopedSlides'];
    };
    loopFillGroupWithBlank: {
      type: BooleanConstructor;
      default: SwiperOptions['loopFillGroupWithBlank'];
    };
    loopPreventsSlide: {
      type: BooleanConstructor;
      default: SwiperOptions['loopPreventsSlide'];
    };
    allowSlidePrev: {
      type: BooleanConstructor;
      default: SwiperOptions['allowSlidePrev'];
    };
    allowSlideNext: {
      type: BooleanConstructor;
      default: SwiperOptions['allowSlideNext'];
    };
    swipeHandler: {
      type: BooleanConstructor;
      default: SwiperOptions['swipeHandler'];
    };
    noSwiping: {
      type: BooleanConstructor;
      default: SwiperOptions['noSwiping'];
    };
    noSwipingClass: {
      type: StringConstructor;
      default: SwiperOptions['noSwipingClass'];
    };
    noSwipingSelector: {
      type: StringConstructor;
      default: SwiperOptions['noSwipingSelector'];
    };
    passiveListeners: {
      type: BooleanConstructor;
      default: SwiperOptions['passiveListeners'];
    };
    containerModifierClass: {
      type: StringConstructor;
      default: SwiperOptions['containerModifierClass'];
    };
    slideClass: {
      type: StringConstructor;
      default: SwiperOptions['slideClass'];
    };
    slideBlankClass: {
      type: StringConstructor;
      default: SwiperOptions['slideBlankClass'];
    };
    slideActiveClass: {
      type: StringConstructor;
      default: SwiperOptions['slideActiveClass'];
    };
    slideDuplicateActiveClass: {
      type: StringConstructor;
      default: SwiperOptions['slideDuplicateActiveClass'];
    };
    slideVisibleClass: {
      type: StringConstructor;
      default: SwiperOptions['slideVisibleClass'];
    };
    slideDuplicateClass: {
      type: StringConstructor;
      default: SwiperOptions['slideDuplicateClass'];
    };
    slideNextClass: {
      type: StringConstructor;
      default: SwiperOptions['slideNextClass'];
    };
    slideDuplicateNextClass: {
      type: StringConstructor;
      default: SwiperOptions['slideDuplicateNextClass'];
    };
    slidePrevClass: {
      type: StringConstructor;
      default: SwiperOptions['slidePrevClass'];
    };
    slideDuplicatePrevClass: {
      type: StringConstructor;
      default: SwiperOptions['slideDuplicatePrevClass'];
    };
    wrapperClass: {
      type: StringConstructor;
      default: SwiperOptions['wrapperClass'];
    };
    runCallbacksOnInit: {
      type: BooleanConstructor;
      default: SwiperOptions['runCallbacksOnInit'];
    };
    observer: { type: BooleanConstructor; default: SwiperOptions['observer'] };
    observeParents: {
      type: BooleanConstructor;
      default: SwiperOptions['observeParents'];
    };
    observeSlideChildren: {
      type: BooleanConstructor;
      default: SwiperOptions['observeSlideChildren'];
    };
    a11y: {
      type: PropType<A11yOptions>;
      default: SwiperOptions['a11y'];
    };
    autoplay: {
      type: PropType<AutoplayOptions | boolean>;
      default: AutoplayOptions | boolean;
    };
    controller: {
      type: PropType<ControllerOptions>;
      default: ControllerOptions;
    };
    coverflowEffect: {
      type: PropType<CoverflowEffectOptions>;
      default: CoverflowEffectOptions;
    };
    cubeEffect: {
      type: PropType<CubeEffectOptions>;
      default: CubeEffectOptions;
    };
    fadeEffect: {
      type: PropType<FadeEffectOptions>;
      default: FadeEffectOptions;
    };
    flipEffect: {
      type: PropType<FlipEffectOptions>;
      default: FlipEffectOptions;
    };
    hashNavigation: {
      type: PropType<HashNavigationOptions | BooleanConstructor>;
      default: HashNavigationOptions | BooleanConstructor;
    };
    history: {
      type: HistoryOptions | boolean;
      default: HistoryOptions | boolean;
    };
    keyboard: {
      type: [BooleanConstructor, ObjectConstructor];
      default: SwiperOptions['keyboard'];
    };
    lazy: {
      type: [BooleanConstructor, ObjectConstructor];
      default: SwiperOptions['lazy'];
    };
    mousewheel: {
      type: [BooleanConstructor, ObjectConstructor];
      default: SwiperOptions['mousewheel'];
    };
    navigation: {
      type: [BooleanConstructor, ObjectConstructor];
      default: SwiperOptions['navigation'];
    };
    pagination: {
      type: [BooleanConstructor, ObjectConstructor];
      default: SwiperOptions['pagination'];
    };
    parallax: {
      type: [BooleanConstructor, ObjectConstructor];
      default: SwiperOptions['parallax'];
    };
    scrollbar: {
      type: [BooleanConstructor, ObjectConstructor];
      default: SwiperOptions['scrollbar'];
    };
    thumbs: { type: ObjectConstructor; default: SwiperOptions['thumbs'] };
    virtual: {
      type: [BooleanConstructor, ObjectConstructor];
      default: SwiperOptions['virtual'];
    };
    zoom: {
      type: [BooleanConstructor, ObjectConstructor];
      default: SwiperOptions['zoom'];
    };
  }>;

  const SwiperSlide: DefineComponent<{
    tag: {
      type: StringConstructor;
      default: 'div';
    };
    swiperRef: ObjectConstructor;
    zoom: { type: BooleanConstructor; default: boolean };
    virtualIndex: {
      type: StringConstructor | NumberConstructor;
      default: string | number;
    };
  }>;

  export { Swiper, SwiperSlide };
}
