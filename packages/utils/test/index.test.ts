import { describe, expect, it } from 'vitest'
import { isObject, isOn } from '../src'

describe('test utils', () => {
  it('text isObject Function', () => {
    expect(isObject({})).toBe(true)
    expect(isObject(1)).toBe(false)
    expect(isObject(null)).toBe(false)
    expect(isObject(undefined)).toBe(false)
    expect(isObject('')).toBe(false)
    expect(isObject([])).toBe(true)
  })
  it('test isOn Funtion', () => {
    expect(isOn('onClick')).toBe(true)
    expect(isOn('click')).toBe(false)
  })
})
