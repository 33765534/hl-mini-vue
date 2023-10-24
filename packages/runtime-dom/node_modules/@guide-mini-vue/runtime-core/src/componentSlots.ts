import { ShapeFlags } from "@guide-mini-vue/shared"

export function initSlots(instance, children) {
    const { vnode } = instance
    // 判断 当前虚拟节点是不是 SLOT_CHILDREN 类型，如果是在进行处理slots
    if (vnode.shapeFlag & ShapeFlags.SLOT_CHILDREN) {
        normalizeObjectSlots(children, instance.slots)
    }
}

function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value]
}

function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key]
        // 还需要使用函数 所以我们把这个变成一个函数
        slots[key] = (props) => normalizeSlotValue(value(props))
    }
}