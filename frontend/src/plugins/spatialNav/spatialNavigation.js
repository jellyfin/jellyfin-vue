/*
 * A javascript-based implementation of Spatial Navigation.
 *
 * Copyright (c) 2022 Luke Chang.
 * https://github.com/luke-chang/js-spatial-navigation
 *
 * Lic
"use strict";

/************************/
/* Global Configuration */
/************************/
// Note: an <extSelector> can be one of following types:
// - a valid selector string for "querySelectorAll" or jQuery (if it exists)
// - a NodeList or an array containing DOM elements
// - a single DOM element
// - a jQuery object
// - a string "@<sectionId>" to indicate the specified section
// - a string "@" to indicate the default section
var GlobalConfig = {
  selector: '', // can be a valid <extSelector> except "@" syntax.
  straightOnly: false,
  straightOverlapThreshold: 0.5,
  rememberSource: false,
  disabled: false,
  defaultElement: '', // <extSelector> except "@" syntax.
  enterTo: '', // '', 'last-focused', 'default-element'
  leaveFor: null, // {left: <extSelector>, right: <extSelector>,
  //  up: <extSelector>, down: <extSelector>}
  restrict: 'self-first', // 'self-first', 'self-only', 'none'
  tabIndexIgnoreList:
    'a, input, select, textarea, button, iframe, [contentEditable=true]',
  navigableFilter: null,
  scrollOptions: null // scrollIntoViewOptions https://developer.mozilla.org/en-US/docs/Web/API/Element/scrollIntoView
};

/*********************/
/* Constant Variable */
/*********************/
var KEYMAPPING = {
  37: 'left',
  38: 'up',
  39: 'right',
  40: 'down'
};

var REVERSE = {
  left: 'right',
  up: 'down',
  right: 'left',
  down: 'up'
};

export var EVENT_PREFIX = 'sn:';
var ID_POOL_PREFIX = 'section-';

/********************/
/* Private Variable */
/********************/
var _idPool = 0;
var _ready = false;
var _pause = false;
var _sections = {};
var _sectionCount = 0;
var _defaultSectionId = '';
var _lastSectionId = '';
var _duringFocusChange = false;

/************/
/* Polyfill */
/************/
var elementMatchesSelector =
  Element.prototype.matches ||
  Element.prototype.matchesSelector ||
  Element.prototype.mozMatchesSelector ||
  Element.prototype.webkitMatchesSelector ||
  Element.prototype.msMatchesSelector ||
  Element.prototype.oMatchesSelector ||
  function (selector) {
    var matchedNodes = (this.parentNode || this.document).querySelectorAll(
      selector
    );

    return Array.prototype.slice.call(matchedNodes).includes(this);
  };

/*****************/
/* Core Function */

/*****************/
/**
 *
 */
function getRect(elem) {
  var cr = elem.getBoundingClientRect();
  var rect = {
    left: cr.left,
    top: cr.top,
    right: cr.right,
    bottom: cr.bottom,
    width: cr.width,
    height: cr.height
  };

  rect.element = elem;
  rect.center = {
    x: rect.left + Math.floor(rect.width / 2),
    y: rect.top + Math.floor(rect.height / 2)
  };
  rect.center.left = rect.center.right = rect.center.x;
  rect.center.top = rect.center.bottom = rect.center.y;

  return rect;
}

function partition(rects, targetRect, straightOverlapThreshold) {
  var groups = [[], [], [], [], [], [], [], [], []];

  for (var rect of rects) {
    var center = rect.center;
    var x, y, groupId;

    if (center.x < targetRect.left) {
      x = 0;
    } else if (center.x <= targetRect.right) {
      x = 1;
    } else {
      x = 2;
    }

    if (center.y < targetRect.top) {
      y = 0;
    } else if (center.y <= targetRect.bottom) {
      y = 1;
    } else {
      y = 2;
    }

    groupId = y * 3 + x;
    groups[groupId].push(rect);

    if ([0, 2, 6, 8].includes(groupId)) {
      var threshold = straightOverlapThreshold;

      if (rect.left <= targetRect.right - targetRect.width * threshold) {
        if (groupId === 2) {
          groups[1].push(rect);
        } else if (groupId === 8) {
          groups[7].push(rect);
        }
      }

      if (rect.right >= targetRect.left + targetRect.width * threshold) {
        if (groupId === 0) {
          groups[1].push(rect);
        } else if (groupId === 6) {
          groups[7].push(rect);
        }
      }

      if (rect.top <= targetRect.bottom - targetRect.height * threshold) {
        if (groupId === 6) {
          groups[3].push(rect);
        } else if (groupId === 8) {
          groups[5].push(rect);
        }
      }

      if (rect.bottom >= targetRect.top + targetRect.height * threshold) {
        if (groupId === 0) {
          groups[3].push(rect);
        } else if (groupId === 2) {
          groups[5].push(rect);
        }
      }
    }
  }

  return groups;
}

/**
 *
 */
function generateDistanceFunction(targetRect) {
  return {
    nearPlumbLineIsBetter: function (rect) {
      var d;

      d =
        rect.center.x < targetRect.center.x
          ? targetRect.center.x - rect.right
          : rect.left - targetRect.center.x;

      return d < 0 ? 0 : d;
    },
    nearHorizonIsBetter: function (rect) {
      var d;

      d =
        rect.center.y < targetRect.center.y
          ? targetRect.center.y - rect.bottom
          : rect.top - targetRect.center.y;

      return d < 0 ? 0 : d;
    },
    nearTargetLeftIsBetter: function (rect) {
      var d;

      d =
        rect.center.x < targetRect.center.x
          ? targetRect.left - rect.right
          : rect.left - targetRect.left;

      return d < 0 ? 0 : d;
    },
    nearTargetTopIsBetter: function (rect) {
      var d;

      d =
        rect.center.y < targetRect.center.y
          ? targetRect.top - rect.bottom
          : rect.top - targetRect.top;

      return d < 0 ? 0 : d;
    },
    topIsBetter: function (rect) {
      return rect.top;
    },
    bottomIsBetter: function (rect) {
      return -1 * rect.bottom;
    },
    leftIsBetter: function (rect) {
      return rect.left;
    },
    rightIsBetter: function (rect) {
      return -1 * rect.right;
    }
  };
}

/**
 *
 */
function prioritize(priorities) {
  var destPriority = null;

  for (const priority of priorities) {
    if (priority.group.length > 0) {
      destPriority = priority;
      break;
    }
  }

  if (!destPriority) {
    return null;
  }

  var destDistance = destPriority.distance;

  destPriority.group.sort((a, b) => {
    for (var distance of destDistance) {
      var delta = distance(a) - distance(b);

      if (delta) {
        return delta;
      }
    }

    return 0;
  });

  return destPriority.group;
}

/**
 *
 */
function navigate(target, direction, candidates, config) {
  if (!target || !direction || !candidates || candidates.length === 0) {
    return null;
  }

  var rects = [];

  for (const candidate of candidates) {
    var rect = getRect(candidate);

    if (rect) {
      rects.push(rect);
    }
  }

  if (rects.length === 0) {
    return null;
  }

  var targetRect = getRect(target);

  if (!targetRect) {
    return null;
  }

  var distanceFunction = generateDistanceFunction(targetRect);

  var groups = partition(rects, targetRect, config.straightOverlapThreshold);

  var internalGroups = partition(
    groups[4],
    targetRect.center,
    config.straightOverlapThreshold
  );

  var priorities;

  switch (direction) {
    case 'left': {
      priorities = [
        {
          group: internalGroups[0]
            .concat(internalGroups[3])
            .concat(internalGroups[6]),
          distance: [
            distanceFunction.nearPlumbLineIsBetter,
            distanceFunction.topIsBetter
          ]
        },
        {
          group: groups[3],
          distance: [
            distanceFunction.nearPlumbLineIsBetter,
            distanceFunction.topIsBetter
          ]
        },
        {
          group: groups[0].concat(groups[6]),
          distance: [
            distanceFunction.nearHorizonIsBetter,
            distanceFunction.rightIsBetter,
            distanceFunction.nearTargetTopIsBetter
          ]
        }
      ];
      break;
    }
    case 'right': {
      priorities = [
        {
          group: internalGroups[2]
            .concat(internalGroups[5])
            .concat(internalGroups[8]),
          distance: [
            distanceFunction.nearPlumbLineIsBetter,
            distanceFunction.topIsBetter
          ]
        },
        {
          group: groups[5],
          distance: [
            distanceFunction.nearPlumbLineIsBetter,
            distanceFunction.topIsBetter
          ]
        },
        {
          group: groups[2].concat(groups[8]),
          distance: [
            distanceFunction.nearHorizonIsBetter,
            distanceFunction.leftIsBetter,
            distanceFunction.nearTargetTopIsBetter
          ]
        }
      ];
      break;
    }
    case 'up': {
      priorities = [
        {
          group: internalGroups[0]
            .concat(internalGroups[1])
            .concat(internalGroups[2]),
          distance: [
            distanceFunction.nearHorizonIsBetter,
            distanceFunction.leftIsBetter
          ]
        },
        {
          group: groups[1],
          distance: [
            distanceFunction.nearHorizonIsBetter,
            distanceFunction.leftIsBetter
          ]
        },
        {
          group: groups[0].concat(groups[2]),
          distance: [
            distanceFunction.nearPlumbLineIsBetter,
            distanceFunction.bottomIsBetter,
            distanceFunction.nearTargetLeftIsBetter
          ]
        }
      ];
      break;
    }
    case 'down': {
      priorities = [
        {
          group: internalGroups[6]
            .concat(internalGroups[7])
            .concat(internalGroups[8]),
          distance: [
            distanceFunction.nearHorizonIsBetter,
            distanceFunction.leftIsBetter
          ]
        },
        {
          group: groups[7],
          distance: [
            distanceFunction.nearHorizonIsBetter,
            distanceFunction.leftIsBetter
          ]
        },
        {
          group: groups[6].concat(groups[8]),
          distance: [
            distanceFunction.nearPlumbLineIsBetter,
            distanceFunction.topIsBetter,
            distanceFunction.nearTargetLeftIsBetter
          ]
        }
      ];
      break;
    }
    default: {
      return null;
    }
  }

  if (config.straightOnly) {
    priorities.pop();
  }

  var destGroup = prioritize(priorities);

  if (!destGroup) {
    return null;
  }

  var dest = null;

  if (
    config.rememberSource &&
    config.previous &&
    config.previous.destination === target &&
    config.previous.reverse === direction
  ) {
    for (const element of destGroup) {
      if (element.element === config.previous.target) {
        dest = element.element;
        break;
      }
    }
  }

  if (!dest) {
    dest = destGroup[0].element;
  }

  return dest;
}

/********************/
/* Private Function */

/********************/
/**
 *
 */
function generateId() {
  var id;

  /*eslint no-constant-condition: ["error", { "checkLoops": false }]*/
  while (true) {
    id = ID_POOL_PREFIX + String(++_idPool);

    if (!_sections[id]) {
      break;
    }
  }

  return id;
}

/**
 *
 */
function parseSelector(selector) {
  var result;

  if (window.jQuery) {
    result = window.jQuery(selector).get();
  } else if (typeof selector === 'string') {
    result = Array.prototype.slice.call(document.querySelectorAll(selector));
  } else if (typeof selector === 'object' && selector.length > 0) {
    result = Array.prototype.slice.call(selector);
  } else if (typeof selector === 'object' && selector.nodeType === 1) {
    result = [selector];
  } else {
    result = [];
  }

  return result;
}

/**
 *
 */
function matchSelector(elem, selector) {
  if (window.jQuery) {
    return window.jQuery(elem).is(selector);
  } else if (typeof selector === 'string') {
    return elementMatchesSelector.call(elem, selector);
  } else if (typeof selector === 'object' && selector.length > 0) {
    return selector.includes(elem);
  } else if (typeof selector === 'object' && selector.nodeType === 1) {
    return elem === selector;
  }

  return false;
}

/**
 * Takes the suggested current foccused element. This is useful if the current focused element is known. (see usage for explanation)
 */
function getCurrentFocusedElement(eventElement) {
  var activeElement = eventElement || document.activeElement;

  if (activeElement && activeElement !== document.body) {
    return activeElement;
  }
}

/**
 *
 */
function extend(out) {
  out = out || {};

  for (var i = 1; i < arguments.length; i++) {
    if (!arguments[i]) {
      continue;
    }

    for (var key in arguments[i]) {
      if (
        /*eslint no-prototype-builtins: "off"*/
        arguments[i].hasOwnProperty(key) &&
        arguments[i][key] !== undefined
      ) {
        out[key] = arguments[i][key];
      }
    }
  }

  return out;
}

/**
 *
 */
function exclude(elemList, excludedElem) {
  if (!Array.isArray(excludedElem)) {
    excludedElem = [excludedElem];
  }

  for (var i = 0, index; i < excludedElem.length; i++) {
    index = elemList.indexOf(excludedElem[i]);

    if (index >= 0) {
      elemList.splice(index, 1);
    }
  }

  return elemList;
}

/**
 *
 */
function isNavigable(elem, sectionId, verifySectionSelector) {
  if (
    !elem ||
    !sectionId ||
    !_sections[sectionId] ||
    _sections[sectionId].disabled
  ) {
    return false;
  }

  if (
    (elem.offsetWidth <= 0 && elem.offsetHeight <= 0) ||
    elem.hasAttribute('disabled')
  ) {
    return false;
  }

  if (
    verifySectionSelector &&
    !matchSelector(elem, _sections[sectionId].selector)
  ) {
    return false;
  }

  if (typeof _sections[sectionId].navigableFilter === 'function') {
    if (_sections[sectionId].navigableFilter(elem, sectionId) === false) {
      return false;
    }
  } else if (
    typeof GlobalConfig.navigableFilter === 'function' &&
    GlobalConfig.navigableFilter(elem, sectionId) === false
  ) {
    return false;
  }

  return true;
}

/**
 *
 */
function getSectionId(elem) {
  for (var id in _sections) {
    if (
      !_sections[id].disabled &&
      matchSelector(elem, _sections[id].selector)
    ) {
      return id;
    }
  }
}

/**
 *
 */
function getSectionNavigableElements(sectionId) {
  return parseSelector(_sections[sectionId].selector).filter((elem) => {
    return isNavigable(elem, sectionId);
  });
}

/**
 *
 */
function getSectionDefaultElement(sectionId) {
  var defaultElement = _sections[sectionId].defaultElement;

  if (!defaultElement) {
    return null;
  }

  if (typeof defaultElement === 'string') {
    // defaultElement = parseSelector(defaultElement)[0]; // bug !
    var elements = parseSelector(defaultElement);

    // check each element to see if it's navigable and stop when one has been found
    for (var element of elements) {
      if (isNavigable(element, sectionId, true)) {
        return element;
      }
    }

    return null;
  } else if ($ && defaultElement instanceof $) {
    defaultElement = defaultElement.get(0);

    if (isNavigable(defaultElement, sectionId, true)) {
      return defaultElement;
    }
  }

  return null;
}

/**
 *
 */
function getSectionLastFocusedElement(sectionId) {
  var lastFocusedElement = _sections[sectionId].lastFocusedElement;

  if (!isNavigable(lastFocusedElement, sectionId, true)) {
    return null;
  }

  return lastFocusedElement;
}

/**
 *
 */
function fireEvent(elem, type, details, cancelable) {
  if (arguments.length < 4) {
    cancelable = true;
  }

  var evt = document.createEvent('CustomEvent');

  evt.initCustomEvent(EVENT_PREFIX + type, true, cancelable, details);

  return elem.dispatchEvent(evt);
}

/**
 *
 */
function focusElement(elem, sectionId, direction) {
  if (!elem) {
    return false;
  }

  var currentFocusedElement = getCurrentFocusedElement();

  var focusNscroll = function () {
    if (
      _sections[sectionId].scrollOptions !== undefined &&
      _sections[sectionId].scrollOptions !== '' &&
      _sections[sectionId].scrollOptions !== null
    ) {
      elem.focus({ preventScroll: true });
      elem.scrollIntoView(_sections[sectionId].scrollOptions);
    } else if (
      GlobalConfig.scrollOptions !== undefined &&
      GlobalConfig.scrollOptions !== '' &&
      GlobalConfig.scrollOptions !== null
    ) {
      elem.focus({ preventScroll: true });
      elem.scrollIntoView(GlobalConfig.scrollOptions);
    } else {
      // Erwanlfrt: I'm afraid that the preventScroll into the "else" may change the behavior of existing app.
      // https://github.com/spacerefugee/vue-js-spatial-navigation/issues/5
      elem.focus({ preventScroll: true });
    }
  };

  var silentFocus = function () {
    if (currentFocusedElement) {
      currentFocusedElement.blur();
    }

    focusNscroll(elem);
    focusChanged(elem, sectionId);
  };

  if (_duringFocusChange) {
    silentFocus();

    return true;
  }

  _duringFocusChange = true;

  if (_pause) {
    silentFocus();
    _duringFocusChange = false;

    return true;
  }

  if (currentFocusedElement) {
    var unfocusProperties = {
      nextElement: elem,
      nextSectionId: sectionId,
      direction: direction,
      native: false
    };

    if (!fireEvent(currentFocusedElement, 'willunfocus', unfocusProperties)) {
      _duringFocusChange = false;

      return false;
    }

    currentFocusedElement.blur();
    fireEvent(currentFocusedElement, 'unfocused', unfocusProperties, false);
  }

  var focusProperties = {
    previousElement: currentFocusedElement,
    sectionId: sectionId,
    direction: direction,
    native: false
  };

  if (!fireEvent(elem, 'willfocus', focusProperties)) {
    _duringFocusChange = false;

    return false;
  }

  focusNscroll(elem);
  fireEvent(elem, 'focused', focusProperties, false);

  _duringFocusChange = false;

  focusChanged(elem, sectionId);

  return true;
}

/**
 *
 */
function focusChanged(elem, sectionId) {
  if (!sectionId) {
    sectionId = getSectionId(elem);
  }

  if (sectionId) {
    _sections[sectionId].lastFocusedElement = elem;
    _lastSectionId = sectionId;
  }
}

/**
 *
 */
function focusExtendedSelector(selector, direction) {
  if (selector.charAt(0) === '@') {
    if (selector.length === 1) {
      return focusSection();
    } else {
      var selectors = selector.split(',');

      for (const selector_ of selectors) {
        if (selector_) {
          var sectionId = selector_.trim().slice(1);

          return focusSection(sectionId);
        }
      }
    }
  } else {
    var next = parseSelector(selector)[0];

    if (next) {
      var nextSectionId = getSectionId(next);

      if (isNavigable(next, nextSectionId)) {
        return focusElement(next, nextSectionId, direction);
      }
    }
  }

  return false;
}

/**
 *
 */
function focusSection(sectionId) {
  var range = [];
  var addRange = function (id) {
    if (id && !range.includes(id) && _sections[id] && !_sections[id].disabled) {
      range.push(id);
    }
  };
  if (sectionId) {
    addRange(sectionId);
  } else {
    addRange(_defaultSectionId);
    addRange(_lastSectionId);
    Object.keys(_sections).map(addRange);
  }

  for (var id of range) {
    var next;

    next =
      _sections[id].enterTo === 'last-focused'
        ? getSectionLastFocusedElement(id) ||
          getSectionDefaultElement(id) ||
          getSectionNavigableElements(id)[0]
        : getSectionDefaultElement(id) ||
          getSectionLastFocusedElement(id) ||
          getSectionNavigableElements(id)[0];

    if (next) {
      return focusElement(next, id);
    }
  }

  return false;
}

/**
 *
 */
function fireNavigatefailed(elem, direction) {
  fireEvent(
    elem,
    'navigatefailed',
    {
      direction: direction
    },
    false
  );
}

/**
 *
 */
function gotoLeaveFor(sectionId, direction) {
  if (
    _sections[sectionId].leaveFor &&
    _sections[sectionId].leaveFor[direction] !== undefined
  ) {
    var next = _sections[sectionId].leaveFor[direction];

    if (typeof next === 'string') {
      if (next === '') {
        return null;
      }
      return focusExtendedSelector(next, direction);
    }

    if (window.jQuery && next instanceof window.jQuery) {
      next = next.get(0);
    }

    var nextSectionId = getSectionId(next);

    if (isNavigable(next, nextSectionId)) {
      return focusElement(next, nextSectionId, direction);
    }
  }

  return false;
}

/**
 *
 */
function focusNext(direction, currentFocusedElement, currentSectionId) {
  var extSelector = currentFocusedElement.getAttribute('data-sn-' + direction);

  if (typeof extSelector === 'string') {
    if (extSelector === '' || !focusExtendedSelector(extSelector, direction)) {
      fireNavigatefailed(currentFocusedElement, direction);

      return false;
    }

    return true;
  }

  const sectionNavigableElements = {};
  let allNavigableElements = [];

  for (const id in _sections) {
    sectionNavigableElements[id] = getSectionNavigableElements(id);
    allNavigableElements = allNavigableElements.concat(
      sectionNavigableElements[id]
    );
  }

  const config = extend({}, GlobalConfig, _sections[currentSectionId]);
  let next;

  if (config.restrict === 'self-only' || config.restrict === 'self-first') {
    var currentSectionNavigableElements =
      sectionNavigableElements[currentSectionId];

    next = navigate(
      currentFocusedElement,
      direction,
      exclude(currentSectionNavigableElements, currentFocusedElement),
      config
    );

    if (!next && config.restrict === 'self-first') {
      next = navigate(
        currentFocusedElement,
        direction,
        exclude(allNavigableElements, currentSectionNavigableElements),
        config
      );
    }
  } else {
    next = navigate(
      currentFocusedElement,
      direction,
      exclude(allNavigableElements, currentFocusedElement),
      config
    );
  }

  if (next) {
    _sections[currentSectionId].previous = {
      target: currentFocusedElement,
      destination: next,
      reverse: REVERSE[direction]
    };

    var nextSectionId = getSectionId(next);

    if (currentSectionId !== nextSectionId) {
      var result = gotoLeaveFor(currentSectionId, direction);

      if (result) {
        return true;
      } else if (result === null) {
        fireNavigatefailed(currentFocusedElement, direction);

        return false;
      }

      var enterToElement;

      switch (_sections[nextSectionId].enterTo) {
        case 'last-focused': {
          enterToElement =
            getSectionLastFocusedElement(nextSectionId) ||
            getSectionDefaultElement(nextSectionId);
          break;
        }
        case 'default-element': {
          enterToElement = getSectionDefaultElement(nextSectionId);
          break;
        }
      }

      if (enterToElement) {
        next = enterToElement;
      }
    }

    return focusElement(next, nextSectionId, direction);
  } else if (gotoLeaveFor(currentSectionId, direction)) {
    return true;
  }

  fireNavigatefailed(currentFocusedElement, direction);

  return false;
}

/**
 *
 */
function onKeyDown(evt) {
  if (
    !_sectionCount ||
    _pause ||
    evt.altKey ||
    evt.ctrlKey ||
    evt.metaKey ||
    evt.shiftKey
  ) {
    return;
  }

  var currentFocusedElement;
  var preventDefault = function () {
    evt.preventDefault();
    evt.stopPropagation();

    return false;
  };

  var direction = KEYMAPPING[evt.keyCode];

  if (!direction) {
    if (evt.keyCode == 13) {
      currentFocusedElement = getCurrentFocusedElement(evt.target);

      if (
        currentFocusedElement &&
        getSectionId(currentFocusedElement) &&
        !fireEvent(currentFocusedElement, 'enter-down')
      ) {
        return preventDefault();
      }
    }

    return;
  }

  // There is currently some accessibility support for keyboard navigation however its very basic (supports lists mostly).
  // This  interferes with this plugin in the sense that when you are trying to navigate a list (e.g navigation drawer),
  // any direction key skips 1 item. For instance if the navigation drawer has home-movies-series and you want to navigate from home to movies, when you press the down key, it skips movies and goes to series.
  // This is because the framework navigates to movies then this plugin navigates to series. So what you will see is that movies is skipped.
  // passing the keydown target resolves this issue. This should me monitored in case it regresses
  currentFocusedElement = getCurrentFocusedElement(evt.target);

  if (!currentFocusedElement) {
    if (_lastSectionId) {
      currentFocusedElement = getSectionLastFocusedElement(_lastSectionId);
    }

    if (!currentFocusedElement) {
      focusSection();

      return preventDefault();
    }
  }

  var currentSectionId = getSectionId(currentFocusedElement);

  if (!currentSectionId) {
    return;
  }

  var willmoveProperties = {
    direction: direction,
    sectionId: currentSectionId,
    cause: 'keydown'
  };

  if (fireEvent(currentFocusedElement, 'willmove', willmoveProperties)) {
    focusNext(direction, currentFocusedElement, currentSectionId);
  }

  return preventDefault();
}

/**
 * Keyup event listener to grab
 */
function onKeyUp(evt) {
  if (evt.altKey || evt.ctrlKey || evt.metaKey || evt.shiftKey) {
    return;
  }

  if (!_pause && _sectionCount && evt.keyCode == 13) {
    var currentFocusedElement = getCurrentFocusedElement();

    if (currentFocusedElement && getSectionId(currentFocusedElement)) {
      if (currentFocusedElement.click()) {
        evt.preventDefault();
        evt.stopPropagation();
      } else if (!fireEvent(currentFocusedElement, 'enter-up')) {
        evt.preventDefault();
        evt.stopPropagation();
      }
    }
  }
}

/**
 * Fire spatial navigation event when an element is focussed
 */
function onFocus(evt) {
  var target = evt.target;

  if (
    target !== window &&
    target !== document &&
    _sectionCount &&
    !_duringFocusChange
  ) {
    var sectionId = getSectionId(target);

    if (sectionId) {
      if (_pause) {
        focusChanged(target, sectionId);

        return;
      }

      var focusProperties = {
        sectionId: sectionId,
        native: true
      };

      if (fireEvent(target, 'willfocus', focusProperties)) {
        fireEvent(target, 'focused', focusProperties, false);
        focusChanged(target, sectionId);
      } else {
        _duringFocusChange = true;
        target.blur();
        _duringFocusChange = false;
      }
    }
  }
}

/**
 *
 */
function onBlur(evt) {
  var target = evt.target;

  if (
    target !== window &&
    target !== document &&
    !_pause &&
    _sectionCount &&
    !_duringFocusChange &&
    getSectionId(target)
  ) {
    var unfocusProperties = {
      native: true
    };

    if (fireEvent(target, 'willunfocus', unfocusProperties)) {
      fireEvent(target, 'unfocused', unfocusProperties, false);
    } else {
      _duringFocusChange = true;
      setTimeout(() => {
        target.focus();
        _duringFocusChange = false;
      });
    }
  }
}

/**
 * Focus when body is clicked
 */
function onBodyClick() {
  if (
    document.activeElement === document.body &&
    _lastSectionId &&
    _sections[_lastSectionId].lastFocusedElement
  ) {
    focusElement(_sections[_lastSectionId].lastFocusedElement, _lastSectionId);
  }
}

// function onClick(event) {
//   var currentFocusedElement = getCurrentFocusedElement();
//   if (
//     event.target == currentFocusedElement &&
//     getSectionId(currentFocusedElement)
//   ) {
//     if (!fireEvent(currentFocusedElement, "enter-up")) {
//       evt.preventDefault();
//       evt.stopPropagation();
//     }
//   }
// }

/*******************/
/* Public Function */
/*******************/
var SpatialNavigation = {
  init: function () {
    if (!_ready) {
      window.addEventListener('keydown', onKeyDown);
      window.addEventListener('keyup', onKeyUp);
      window.addEventListener('focusin', onFocus, true);
      window.addEventListener('blur', onBlur, true);
      // window.addEventListener("click", onClick);
      document.body.addEventListener('click', onBodyClick);
      _ready = true;
    }
  },

  uninit: function () {
    window.removeEventListener('blur', onBlur, true);
    window.removeEventListener('focus', onFocus, true);
    window.removeEventListener('keyup', onKeyUp);
    window.removeEventListener('keydown', onKeyDown);
    // window.removeEventListener("click", onClick);
    document.body.removeEventListener('click', onBodyClick);
    SpatialNavigation.clear();
    _idPool = 0;
    _ready = false;
  },

  clear: function () {
    _sections = {};
    _sectionCount = 0;
    _defaultSectionId = '';
    _lastSectionId = '';
    _duringFocusChange = false;
  },

  reset: function (sectionId) {
    if (sectionId) {
      _sections[sectionId].lastFocusedElement = undefined;
      _sections[sectionId].previous = undefined;
    } else {
      for (const id in _sections) {
        const section = _sections[id];

        section.lastFocusedElement = undefined;
        section.previous = undefined;
      }
    }
  },

  // set(<config>);
  // set(<sectionId>, <config>);
  set: function () {
    var sectionId, config;
    if (typeof arguments[0] === 'object') {
      config = arguments[0];
    } else if (
      typeof arguments[0] === 'string' &&
      typeof arguments[1] === 'object'
    ) {
      sectionId = arguments[0];
      config = arguments[1];

      if (!_sections[sectionId]) {
        throw new Error('Section "' + sectionId + '" doesn\'t exist!');
      }
    } else {
      return;
    }

    for (var key in config) {
      if (typeof GlobalConfig[key] !== 'undefined') {
        if (sectionId) {
          _sections[sectionId][key] = config[key];
        } else if (typeof config[key] !== 'undefined') {
          GlobalConfig[key] = config[key];
        }
      }
    }

    if (sectionId) {
      // remove "undefined" items
      _sections[sectionId] = extend({}, _sections[sectionId]);
    }
  },

  // add(<config>);
  // add(<sectionId>, <config>);
  add: function () {
    var sectionId;
    var config = {};

    if (typeof arguments[0] === 'object') {
      config = arguments[0];
    } else if (
      typeof arguments[0] === 'string' &&
      typeof arguments[1] === 'object'
    ) {
      sectionId = arguments[0];
      config = arguments[1];
    }

    if (!sectionId) {
      sectionId = typeof config.id === 'string' ? config.id : generateId();
    }

    if (_sections[sectionId]) {
      throw new Error('Section "' + sectionId + '" has already existed!');
    }

    _sections[sectionId] = {};
    _sectionCount++;

    SpatialNavigation.set(sectionId, config);

    return sectionId;
  },

  remove: function (sectionId) {
    if (!sectionId || typeof sectionId !== 'string') {
      throw new Error('Please assign the "sectionId"!');
    }

    if (_sections[sectionId]) {
      _sections[sectionId] = undefined;
      _sections = extend({}, _sections);
      _sectionCount--;

      if (_lastSectionId === sectionId) {
        _lastSectionId = '';
      }

      return true;
    }

    return false;
  },

  disable: function (sectionId) {
    if (_sections[sectionId]) {
      _sections[sectionId].disabled = true;

      return true;
    }

    return false;
  },

  enable: function (sectionId) {
    if (_sections[sectionId]) {
      _sections[sectionId].disabled = false;

      return true;
    }

    return false;
  },

  pause: function () {
    _pause = true;
  },

  resume: function () {
    _pause = false;
  },

  // focus([silent])
  // focus(<sectionId>, [silent])
  // focus(<extSelector>, [silent])
  // Note: "silent" is optional and default to false
  focus: function (elem, silent) {
    var result = false;

    if (silent === undefined && typeof elem === 'boolean') {
      silent = elem;
      elem = undefined;
    }

    var autoPause = !_pause && silent;

    if (autoPause) {
      SpatialNavigation.pause();
    }

    if (elem) {
      if (typeof elem === 'string') {
        result = _sections[elem]
          ? focusSection(elem)
          : focusExtendedSelector(elem);
      } else {
        if (window.jQuery && elem instanceof window.jQuery) {
          elem = elem.get(0);
        }

        var nextSectionId = getSectionId(elem);

        if (isNavigable(elem, nextSectionId)) {
          result = focusElement(elem, nextSectionId);
        }
      }
    } else {
      result = focusSection();
    }

    if (autoPause) {
      SpatialNavigation.resume();
    }

    return result;
  },

  // move(<direction>)
  // move(<direction>, <selector>)
  move: function (direction, selector) {
    direction = direction.toLowerCase();

    if (!REVERSE[direction]) {
      return false;
    }

    var elem = selector
      ? parseSelector(selector)[0]
      : getCurrentFocusedElement();

    if (!elem) {
      return false;
    }

    var sectionId = getSectionId(elem);

    if (!sectionId) {
      return false;
    }

    var willmoveProperties = {
      direction: direction,
      sectionId: sectionId,
      cause: 'api'
    };

    if (!fireEvent(elem, 'willmove', willmoveProperties)) {
      return false;
    }

    return focusNext(direction, elem, sectionId);
  },

  // makeFocusable()
  // makeFocusable(<sectionId>)
  makeFocusable: function (sectionId) {
    var doMakeFocusable = function (section) {
      var tabIndexIgnoreList =
        section.tabIndexIgnoreList === undefined
          ? GlobalConfig.tabIndexIgnoreList
          : section.tabIndexIgnoreList;

      for (const elem of parseSelector(section.selector)) {
        if (
          !matchSelector(elem, tabIndexIgnoreList) &&
          !elem.getAttribute('tabindex')
        ) {
          elem.setAttribute('tabindex', '-1');
        }
      }
    };

    if (sectionId) {
      if (_sections[sectionId]) {
        doMakeFocusable(_sections[sectionId]);
      } else {
        throw new Error('Section "' + sectionId + '" doesn\'t exist!');
      }
    } else {
      for (var id in _sections) {
        doMakeFocusable(_sections[id]);
      }
    }
  },

  setDefaultSection: function (sectionId) {
    if (!sectionId) {
      _defaultSectionId = '';
    } else if (_sections[sectionId]) {
      _defaultSectionId = sectionId;
    } else {
      throw new Error('Section "' + sectionId + '" doesn\'t exist!');
    }
  }
};

window.SpatialNavigation = SpatialNavigation;

window.SpatialNavigation.init();

export default SpatialNavigation;
