const targetMap = new WeakMap()
let activeEffect: Function | null

export function track(target: object, key: string | symbol) {
  if (!activeEffect)
    return
  let depsMap = targetMap.get(target)
  if (!depsMap) {
    depsMap = new Map()
    targetMap.set(target, depsMap)
  }
  let deps = depsMap.get(target)
  if (!deps) {
    deps = new Set()
    depsMap.set(key, deps)
  }
  deps.add(activeEffect)
}

export function trigger(target: object, key: string | symbol) {
  const depsMap = targetMap.get(target)
  if (!depsMap)
    return
  const deps = depsMap.get(key)
  if (deps) {
    for (const fn of deps)
      fn()
  }
}

export function effect(fn: Function) {
  activeEffect = fn
  fn()
  activeEffect = null
}
