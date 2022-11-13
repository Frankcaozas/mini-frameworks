import { isObject } from '@frankcao/utils'
import { track, trigger } from './effect'
import { reactive, ReactiveFlags } from './reactivity'
function createGetter(isShallow: boolean) {
  return function (target, key, receiver) {
    const val = Reflect.get(target, key, receiver)
    track(target, key, 'get')
    if (key === ReactiveFlags.IS_REACTIVE)
      return true

    if (isShallow)
      return val
    return isObject(val) ? reactive(val) : val
  }
}

function set(target, key, val, receiver) {
  const success = Reflect.set(target, key, val, receiver)
  // target[key] = val
  trigger(target, key, 'set')
  return success
  // return true
}

function deleteProperty(target, key) {
  const res = Reflect.deleteProperty(target, key)
  trigger(target, key, 'delete')
  return res
}

export const baseHandler = {
  get: createGetter(false),
  set,
  deleteProperty,
}

export const baseShallowReactiveHandlers = {
  get: createGetter(true),
  set,
  deleteProperty,
}
