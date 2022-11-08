import { describe, expect, it } from 'vitest'
import { effect } from '../src/effect'
import { reactive } from '../src/reactivity'
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
})
