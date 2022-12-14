export function isObject(value: any): boolean {
  return typeof value === 'object' && value !== null
}

export function isOn(key: string) {
  return key[0] === 'o' && key[1] === 'n'
}

export function toRawType(value: any) {
  return Object.prototype.toString.call(value).slice(8, -1)
}
