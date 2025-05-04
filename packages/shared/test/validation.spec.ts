/* eslint-disable unicorn/no-null, unicorn/no-useless-undefined */
import { test, expect } from 'vitest';
import { isNumber, isBool, isStr, isFunc, isUndef, isNull, isNil, isObj, isArray } from '../src/universal/validation.ts';

test('isNumber', () => {
  expect(isNumber(0)).toBe(true);
  expect(isNumber(false)).toBe(false);
  expect(isNumber(true)).toBe(false);
  expect(isNumber('0')).toBe(false);
  expect(isNumber(null)).toBe(false);
  expect(isNumber(undefined)).toBe(false);
  expect(isNumber(Number.MIN_SAFE_INTEGER)).toBe(true);
  expect(isNumber(Number.MAX_SAFE_INTEGER)).toBe(true);
  expect(isNumber(Number.MAX_VALUE)).toBe(true);
  expect(isNumber(Number.MIN_VALUE)).toBe(true);
  expect(isNumber(Number.EPSILON)).toBe(true);
  expect(isNumber(Number.POSITIVE_INFINITY)).toBe(true);
  expect(isNumber(Number.NEGATIVE_INFINITY)).toBe(true);
  expect(isNumber(Number.NaN)).toBe(true);
  expect(isNumber(() => 0)).toBe(false);
  expect(isNumber({})).toBe(false);
  expect(isNumber([])).toBe(false);
});

test('isBool', () => {
  expect(isBool(0)).toBe(false);
  expect(isBool(false)).toBe(true);
  expect(isBool(true)).toBe(true);
  expect(isBool('0')).toBe(false);
  expect(isBool(null)).toBe(false);
  expect(isBool(undefined)).toBe(false);
  expect(isBool(Number.MIN_SAFE_INTEGER)).toBe(false);
  expect(isBool(Number.MAX_SAFE_INTEGER)).toBe(false);
  expect(isBool(Number.MAX_VALUE)).toBe(false);
  expect(isBool(Number.MIN_VALUE)).toBe(false);
  expect(isBool(Number.EPSILON)).toBe(false);
  expect(isBool(Number.POSITIVE_INFINITY)).toBe(false);
  expect(isBool(Number.NEGATIVE_INFINITY)).toBe(false);
  expect(isBool(Number.NaN)).toBe(false);
  expect(isBool(() => 0)).toBe(false);
  expect(isBool(() => true)).toBe(false);
  expect(isBool({})).toBe(false);
  expect(isBool([])).toBe(false);
});

test('isStr', () => {
  expect(isStr(0)).toBe(false);
  expect(isStr(false)).toBe(false);
  expect(isStr(true)).toBe(false);
  expect(isStr('0')).toBe(true);
  expect(isStr(null)).toBe(false);
  expect(isStr(undefined)).toBe(false);
  expect(isStr(Number.MIN_SAFE_INTEGER)).toBe(false);
  expect(isStr(Number.MAX_SAFE_INTEGER)).toBe(false);
  expect(isStr(Number.MAX_VALUE)).toBe(false);
  expect(isStr(Number.MIN_VALUE)).toBe(false);
  expect(isStr(Number.EPSILON)).toBe(false);
  expect(isStr(Number.POSITIVE_INFINITY)).toBe(false);
  expect(isStr(Number.NEGATIVE_INFINITY)).toBe(false);
  expect(isStr(Number.NaN)).toBe(false);
  expect(isStr(() => 0)).toBe(false);
  expect(isStr(() => '0')).toBe(false);
  expect(isStr({})).toBe(false);
  expect(isStr([])).toBe(false);
});

test('isFunc', () => {
  expect(isFunc(0)).toBe(false);
  expect(isFunc(false)).toBe(false);
  expect(isFunc(true)).toBe(false);
  expect(isFunc('0')).toBe(false);
  expect(isFunc(null)).toBe(false);
  expect(isFunc(undefined)).toBe(false);
  expect(isFunc(Number.MIN_SAFE_INTEGER)).toBe(false);
  expect(isFunc(Number.MAX_SAFE_INTEGER)).toBe(false);
  expect(isFunc(Number.MAX_VALUE)).toBe(false);
  expect(isFunc(Number.MIN_VALUE)).toBe(false);
  expect(isFunc(Number.EPSILON)).toBe(false);
  expect(isFunc(Number.POSITIVE_INFINITY)).toBe(false);
  expect(isFunc(Number.NEGATIVE_INFINITY)).toBe(false);
  expect(isFunc(Number.NaN)).toBe(false);
  expect(isFunc(() => 0)).toBe(true);
  expect(isFunc(() => '0')).toBe(true);
  expect(isFunc({})).toBe(false);
  expect(isFunc([])).toBe(false);
});

test('isUndef', () => {
  expect(isUndef(0)).toBe(false);
  expect(isUndef(false)).toBe(false);
  expect(isUndef(true)).toBe(false);
  expect(isUndef('0')).toBe(false);
  expect(isUndef(null)).toBe(false);
  expect(isUndef(undefined)).toBe(true);
  expect(isUndef(Number.MIN_SAFE_INTEGER)).toBe(false);
  expect(isUndef(Number.MAX_SAFE_INTEGER)).toBe(false);
  expect(isUndef(Number.MAX_VALUE)).toBe(false);
  expect(isUndef(Number.MIN_VALUE)).toBe(false);
  expect(isUndef(Number.EPSILON)).toBe(false);
  expect(isUndef(Number.POSITIVE_INFINITY)).toBe(false);
  expect(isUndef(Number.NEGATIVE_INFINITY)).toBe(false);
  expect(isUndef(Number.NaN)).toBe(false);
  expect(isUndef(() => 0)).toBe(false);
  expect(isUndef(() => undefined)).toBe(false);
  expect(isUndef({})).toBe(false);
  expect(isUndef([])).toBe(false);
});

test('isNull', () => {
  expect(isNull(0)).toBe(false);
  expect(isNull(false)).toBe(false);
  expect(isNull(true)).toBe(false);
  expect(isNull('0')).toBe(false);
  expect(isNull(null)).toBe(true);
  expect(isNull(undefined)).toBe(false);
  expect(isNull(Number.MIN_SAFE_INTEGER)).toBe(false);
  expect(isNull(Number.MAX_SAFE_INTEGER)).toBe(false);
  expect(isNull(Number.MAX_VALUE)).toBe(false);
  expect(isNull(Number.MIN_VALUE)).toBe(false);
  expect(isNull(Number.EPSILON)).toBe(false);
  expect(isNull(Number.POSITIVE_INFINITY)).toBe(false);
  expect(isNull(Number.NEGATIVE_INFINITY)).toBe(false);
  expect(isNull(Number.NaN)).toBe(false);
  expect(isNull(() => 0)).toBe(false);
  expect(isNull(() => null)).toBe(false);
  expect(isNull({})).toBe(false);
  expect(isNull([])).toBe(false);
});

test('isNil', () => {
  expect(isNil(0)).toBe(false);
  expect(isNil(false)).toBe(false);
  expect(isNil(true)).toBe(false);
  expect(isNil('0')).toBe(false);
  expect(isNil(null)).toBe(true);
  expect(isNil(undefined)).toBe(true);
  expect(isNil(Number.MIN_SAFE_INTEGER)).toBe(false);
  expect(isNil(Number.MAX_SAFE_INTEGER)).toBe(false);
  expect(isNil(Number.MAX_VALUE)).toBe(false);
  expect(isNil(Number.MIN_VALUE)).toBe(false);
  expect(isNil(Number.EPSILON)).toBe(false);
  expect(isNil(Number.POSITIVE_INFINITY)).toBe(false);
  expect(isNil(Number.NEGATIVE_INFINITY)).toBe(false);
  expect(isNil(Number.NaN)).toBe(false);
  expect(isNil(() => 0)).toBe(false);
  expect(isNil(() => null)).toBe(false);
  expect(isNil(() => undefined)).toBe(false);
  expect(isNil({})).toBe(false);
  expect(isNil([])).toBe(false);
});

test('isObj', () => {
  expect(isObj(0)).toBe(false);
  expect(isObj(false)).toBe(false);
  expect(isObj(true)).toBe(false);
  expect(isObj('0')).toBe(false);
  expect(isObj(null)).toBe(false);
  expect(isObj(undefined)).toBe(false);
  expect(isObj(Number.MIN_SAFE_INTEGER)).toBe(false);
  expect(isObj(Number.MAX_SAFE_INTEGER)).toBe(false);
  expect(isObj(Number.MAX_VALUE)).toBe(false);
  expect(isObj(Number.MIN_VALUE)).toBe(false);
  expect(isObj(Number.EPSILON)).toBe(false);
  expect(isObj(Number.POSITIVE_INFINITY)).toBe(false);
  expect(isObj(Number.NEGATIVE_INFINITY)).toBe(false);
  expect(isObj(Number.NaN)).toBe(false);
  expect(isObj(() => 0)).toBe(false);
  expect(isObj(() => ({}))).toBe(false);
  expect(isObj({})).toBe(true);
  expect(isObj([])).toBe(false);
});

test('isArray', () => {
  expect(isArray(0)).toBe(false);
  expect(isArray(false)).toBe(false);
  expect(isArray(true)).toBe(false);
  expect(isArray('0')).toBe(false);
  expect(isArray(null)).toBe(false);
  expect(isArray(undefined)).toBe(false);
  expect(isArray(Number.MIN_SAFE_INTEGER)).toBe(false);
  expect(isArray(Number.MAX_SAFE_INTEGER)).toBe(false);
  expect(isArray(Number.MAX_VALUE)).toBe(false);
  expect(isArray(Number.MIN_VALUE)).toBe(false);
  expect(isArray(Number.EPSILON)).toBe(false);
  expect(isArray(Number.POSITIVE_INFINITY)).toBe(false);
  expect(isArray(Number.NEGATIVE_INFINITY)).toBe(false);
  expect(isArray(Number.NaN)).toBe(false);
  expect(isArray(() => 0)).toBe(false);
  expect(isArray(() => [])).toBe(false);
  expect(isArray({})).toBe(false);
  expect(isArray([])).toBe(true);
});
