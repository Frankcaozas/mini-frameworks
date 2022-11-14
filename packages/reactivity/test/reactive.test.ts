import { describe, expect, it, vi } from 'vitest'
import { effect } from '../src/effect'
import { isReactive, reactive, shallowReactive } from '../src/reactivity'
import { isRef, ref } from '../src/ref'

describe('reactive', () => {
  it('reactive基本功能', () => {
    const obj = reactive({ count: 1 })
    let val
    effect(() => {
      val = obj.count
    })
    expect(val).toBe(1) // 过了

    obj.count++
    expect(val).toBe(2) // effect副作用执行了
  })

  it('reactive suppourt nested object', () => {
    const proxyObj = reactive({ count: 1, person: { name: 'wupeng' } })
    let name
    effect(() => {
      name = proxyObj.person.name
    })
    expect(name).toBe('wupeng')
    proxyObj.person.name = 'frankcao'
    expect(name).toBe('frankcao')
  })

  it('reactive deleteProperty', () => {
    const proxyObj = reactive({ count: 1, person: { name: 'wupeng' } })
    let val
    effect(() => {
      val = proxyObj.person.name
    })
    expect(val).toBe('wupeng')
    delete proxyObj.person.name
    expect(val).toBeUndefined()
  })

  it('ref', () => {
    const num = ref(1)
    let val
    effect(() => {
      val = num.value
    })
    expect(val).toBe(1)

    num.value++
    expect(val).toBe(2)
  })
  it('ref支持复杂数据类型', () => {
    const num = ref({ count: 1 })
    let val
    effect(() => {
      val = num.value.count
    })
    expect(val).toBe(1)

    num.value.count++
    expect(val).toBe(2)
  })

  it('why reflect', () => {
    const obj = {
      _count: 1,
      get count() {
        return this._count
      },
    }
    const res = reactive(obj)
    let val
    effect(() => {
      val = res.count
    })

    expect(val).toBe(1)
    res._count++
    expect(val).toBe(2)
  })
})

describe('支持set/map', () => {
  it('set', () => {
    const set = reactive(new Set([1]))
    let val
    effect(() => {
      val = set.size
    })
    expect(val).toBe(1)
    set.add(2)
    expect(val).toBe(2)
  })
  // @todo 作业
  it('set的删除', () => {
    const set = reactive(new Set([1, 2]))
    let val
    effect(() => {
      val = set.size
    })
    expect(val).toBe(2)
    set.delete(2)
    expect(val).toBe(1)
  })
  it('set has', () => {
    const set = reactive(new Set([1, 2]))
    expect(set.has(2)).toBe(true)
    set.delete(2)
    expect(set.has(2)).toBe(false)
  })

  describe('shallow reactive', () => {
    it('shallow', () => {
      const proxyObj = shallowReactive({ count: 1, person: { name: 'wupeng' } })
      let val1, val2
      effect(() => {
        val1 = proxyObj.person.name
      })
      effect(() => {
        val2 = proxyObj.count
      })
      expect(val1).toBe('wupeng')
      expect(val2).toBe(1)
      proxyObj.count++
      proxyObj.person.name = 'aaa'
      expect(val2).toBe(2)
      expect(val1).toBe('wupeng')
    })
  })

  describe('isReactive isRef', () => {
    it('isReactive', () => {
      const obj1 = { cnt: 1 }
      const obj2 = reactive({ cnt: 1 })
      const res1 = isReactive(obj1)
      const res2 = isReactive(obj2)
      expect(res1).toBe(false)
      expect(res2).toBe(true)
    })

    it('isRef', () => {
      const obj1 = 1
      const obj2 = ref(1)
      const res1 = isRef(obj1)
      const res2 = isRef(obj2)
      expect(res1).toBe(false)
      expect(res2).toBe(true)
    })
  })

  it('响应式的清理', () => {
    const obj = reactive({
      ok: true,
      name: 'dasheng',
    })
    let val
    const fn = vi.fn(() => {
      val = obj.ok ? obj.name : 'vue3'
    })
    effect(fn)
    expect(val).toBe('dasheng')
    expect(fn).toBeCalledTimes(1)

    obj.ok = false
    expect(val).toBe('vue3')
    expect(fn).toBeCalledTimes(2)

    obj.name = 'xiaosheng'
    expect(fn).toBeCalledTimes(2)
  })
})
