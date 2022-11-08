import { track, trigger } from './effect'

export function reactive(obj: any) {
  return new Proxy(obj, {
    get(target, key, receiver) {
      const val = Reflect.get(target, key, receiver)
      track(target, key)
      return val
    },
    set(target, key, val, receiver) {
      const success = Reflect.set(target, key, val, receiver)
      trigger(target, key)
      return success
    },
  })
}
