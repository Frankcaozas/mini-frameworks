import { track, trigger } from './effect'
import { ITERATE_KEY, ReactiveFlags } from './reactivity'

export const collectionHandler = {
  get(target, key) {
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
  add(key: any) {
    const target: Set<any> = this[ReactiveFlags.RAW]
    const ret = target.add(key)
    trigger(target, key, 'collection-add')
    return ret
  },
  delete(key: any) {
    const target: Set<any> = this[ReactiveFlags.RAW]
    const res = target.delete(key)
    trigger(target, key, 'collection-delete')
    return res
  },
  has(key: any) {
    const target: Set<any> = this[ReactiveFlags.RAW]
    const res = target.has(key)
    trigger(target, key, 'collection-has')
    return res
  },
}
