import { toRawType } from '@frankcao/utils'
import { baseHandler, baseShallowReactiveHandlers } from './baseHandlers'
import { collectionHandler } from './collectionHandlers'

export const enum ReactiveFlags {
  RAW = '__v_raw',
  IS_REACTIVE = '__is_reactive',
}

const enum TargetType {
  INVALID = 0,
  COMMON = 1,
  COLLECTION = 2,
}

export const ITERATE_KEY = Symbol('iterate')

function targetTypeMap(rawType: string) {
  switch (rawType) {
    case 'Object':
    case 'Array':
      return TargetType.COMMON
    case 'Map':
    case 'Set':
    case 'WeakMap':
    case 'WeakSet':
      return TargetType.COLLECTION
    default:
      return TargetType.INVALID
  }
}

export function isReactive(val: any) {
  return !!val[ReactiveFlags.IS_REACTIVE]
}

export function reactive<T extends object>(obj: T): T {
  const handler = targetTypeMap(toRawType(obj)) === TargetType.COMMON ? baseHandler : collectionHandler
  return new Proxy(obj, handler)
}

export function shallowReactive<T extends object>(obj: T): T {
  const handler = targetTypeMap(toRawType(obj)) === TargetType.COMMON ? baseShallowReactiveHandlers : collectionHandler
  return new Proxy(obj, handler)
}
