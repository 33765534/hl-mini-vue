import { NodeTypes } from "./ast";

export function isText(node) {
    // 判断类型是不是 text 或者插值
    return (node.type === NodeTypes.TEXT || node.type === NodeTypes.INTERPOLATION)
}