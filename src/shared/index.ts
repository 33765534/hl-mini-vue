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

export const EMPTY_OBJ = {}