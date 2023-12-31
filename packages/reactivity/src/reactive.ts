import { isObject } from "@guide-mini-vue/shared"
import { mutableHandlers, readonlyHandlers, shallowReadonlyHandlers } from "./baseHandlers"

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

export function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers)
}

export function isProxy(value) {
    return isReactive(value) || isReadonly(value)
}

function createActiveObject(target: any, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} 必须是一个对象`)
        return target
    }
    return new Proxy(target, baseHandlers)
}

export function isReactive(value) {
    return !!value[ReactiveFlags.IS_REACTIVE]
}
export function isReadonly(value) {
    return !!value[ReactiveFlags.IS_READONLY]
}




