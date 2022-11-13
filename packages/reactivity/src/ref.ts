import { isObject } from '@frankcao/utils/src'
import { track, trigger } from './effect'
import { reactive } from './reactivity'
class RefImplement {
  isRef: boolean
  constructor(private val: any) {
    this.isRef = true
    this.val = convert(val)
  }

  get value() {
    track(this, 'value', 'ref-get')
    return this.val
  }

  set value(newVal: any) {
    if (newVal !== this.val) {
      this.val = newVal
      trigger(this, 'value', 'ref-set')
    }
  }
}
function convert(val: any) {
  return isObject(val) ? reactive(val) : val
}

export function isRef(val: any) {
  return !!val.isRef
}
export function ref(val: any) {
  return new RefImplement(val)
}
