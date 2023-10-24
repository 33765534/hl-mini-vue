export const extend = Object.assign;
export * from './toDisplayString'
export const isObject = (val) => {
    return val !== null && typeof val === 'object'
}

export const isString = (val) => typeof val === 'string'
export const hasChanged = (val, newValue) => {
    return !Object.is(val, newValue)
}
export const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key)

// 烤肉串的方式
export const camelize = (str: string) => {
    return str.replace(/-(\w)/g, (_, c: string) => {
        return c ? c.toUpperCase() : ''
    })
}
// 首字母大写
export const capitalize = (str: string) => {
    return str.charAt(0).toUpperCase() + str.slice(1)
}

export const EMPTY_OBJ = {}

export { ShapeFlags } from './ShapeFlags'