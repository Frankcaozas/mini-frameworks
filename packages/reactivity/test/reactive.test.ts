import { describe, expect, it } from 'vitest'
import { effect } from '../src/effect'
import { reactive } from '../src/reactivity'
import { ref } from '../src/ref'

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
})
