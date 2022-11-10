import { isObject, toRawType } from '@frankcao/utils'
import { track, trigger } from './effect'

export const enum ReactiveFlags {
  RAW = '__raw',
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

const baseHandler = {
  get(target, key, receiver) {
    const val = Reflect.get(target, key, receiver)
    track(target, key, 'get')
    return isObject(val) ? reactive(val) : val
    // return target[key]
  },
  set(target, key, val, receiver) {
    const success = Reflect.set(target, key, val, receiver)
    // target[key] = val
    trigger(target, key, 'set')
    return success
    // return true
  },
  deleteProperty(target, key) {
    const res = Reflect.deleteProperty(target, key)
    trigger(target, key, 'delete')
    return res
  },
}

const collectionHandler = {
  get(target, key, receiver) {
    if (key === ReactiveFlags.RAW)
      return target
    if (key === 'size') {
      track(target, ITERATE_KEY, 'collection-size')
      return Reflect.get(target, key)
    }
    return collectionActions[key]
  },
}

const collectionActions = {
  add(key) {
    const target = this[ReactiveFlags.RAW]
    const ret = target.add(key)
    trigger(target, key, 'collection-add')
    return ret
  },
  delete(key) {
    const target = this[ReactiveFlags.RAW]
    const res = target.delete(key)
    trigger(target, key, 'collection-delete')
    return res
  },
  has() {},
}

export function reactive<T extends object>(obj: T): T {
  const handler = targetTypeMap(toRawType(obj)) === TargetType.COMMON ? baseHandler : collectionHandler
  return new Proxy(obj, handler)
}
