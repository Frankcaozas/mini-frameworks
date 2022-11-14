import { ITERATE_KEY } from './reactivity'
const targetMap = new WeakMap()
let activeEffect: Function | null
const effectStack: Function[] = []
export function track(target: object, key: string | symbol) {
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
  activeEffect.deps.push(deps)
}

export function trigger(target: object, key: string | symbol, type: string) {
  const depsMap = targetMap.get(target)
  if (!depsMap)
    return
  if (type === 'collection-add' || type === 'collection-delete' || type === 'collection-has')
    key = ITERATE_KEY

  const deps = depsMap.get(key)
  if (deps) {
    const depsToRun = new Set(deps)
    for (const fn of depsToRun)
      fn()
  }
}

function cleanup(effectFn) {
  // effectFn的依赖清理
  // 全部清理，track的时候重新收集 Vue3.2的时候进行了优化 ，位运算
  for (let i = 0; i < effectFn.deps.length; i++)
    effectFn.deps[i].delete(effectFn)

  effectFn.deps = []
}

export function effect(fn: Function) {
  const effectFn = () => {
    let ret
    try {
      activeEffect = effectFn
      effectStack.push(activeEffect)
      cleanup(effectFn)
      ret = fn() // 会触发Proxy的get方法，执行track，执行依赖收集的
    }
    finally {
      // fn内部还有effect，activeEffect指向就错了
      effectStack.pop()
      // 回复上一个嵌套数组的值
      // effectStack = []
      activeEffect = effectStack[effectStack.length - 1]
    }
    return ret
  }
  effectFn.deps = []
  effectFn()
}
