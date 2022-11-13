import { ITERATE_KEY } from './reactivity'
const targetMap = new WeakMap()
let activeEffect: Function | null
const effectStack: Function[] = []
export function track(target: object, key: string | symbol, type: string) {
  if (!activeEffect)
    return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  let deps = depsMap.get(key)
  if (!deps) {
    deps = new Set()
    depsMap.set(key, deps)
  }
  deps.add(activeEffect)
}

export function trigger(target: object, key: string | symbol, type: string) {
  const depsMap = targetMap.get(target)
  if (!depsMap)
    return
  if (type === 'collection-add' || type === 'collection-delete' || type === 'collection-has')
    key = ITERATE_KEY

  const deps = depsMap.get(key)
  if (deps) {
    for (const fn of deps)
      fn()
  }
}

export function effect(fn: Function) {
  activeEffect = fn
  effectStack.push(fn)
  fn()
  effectStack.pop()
  activeEffect = effectStack[effectStack.length - 1]
}
