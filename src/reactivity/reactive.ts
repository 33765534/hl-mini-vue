import { mutableHandlers, readonlyHandlers } from "./baseHandlers"

export const enum ReactiveFlags {
    IS_REACTIVE = "_v_isReactive",
    IS_READONLY = "_v_isReadonly"
}

export function reactive(obj) {
    return createActiveObject(obj, mutableHandlers)
}

export function readonly(obj) {
    return createActiveObject(obj, readonlyHandlers)
}

function createActiveObject(raw: any, baseHandlers) {
    return new Proxy(raw, baseHandlers)
}

export function isRactive(value) {
    return !!value[ReactiveFlags.IS_REACTIVE]
}
export function isReadonly(value) {
    return !!value[ReactiveFlags.IS_READONLY]
}




