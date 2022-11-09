import { describe, expect, it, vi } from 'vitest'
import { effect } from '../src/effect'
import { reactive } from '../src/reactivity'
describe('effect', () => {
  it('nested effect', () => {
    const data = { foo: 1, bar: 2 }
    const obj = reactive(data)
    let tmp1, tmp2
    const fn1 = vi.fn(() => {})
    const fn2 = vi.fn(() => {})

    effect(() => {
      fn1()
      effect(() => {
        fn2()
        tmp2 = obj.bar
      })
      tmp1 = obj.foo
    })

    expect(fn1).toBeCalledTimes(1)
    expect(fn2).toBeCalledTimes(1)
    expect(tmp1).toBe(1)
    expect(tmp2).toBe(2)

    obj.bar = 3
    expect(fn1).toBeCalledTimes(1)
    expect(fn2).toBeCalledTimes(2)
  })
})
