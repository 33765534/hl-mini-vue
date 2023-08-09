export const enum ShapeFlags {
    ELEMENT = 1, // 01 -> 0001
    // 1<<1 左移一位数 10
    STATEFUL_COMPONENT = 1 << 1,//10 -> 0010
    TEXT_CHILDREN = 1 << 2,// 100  -> 0100
    ARRAY_CHILDREN = 1 << 3, // 1000
}