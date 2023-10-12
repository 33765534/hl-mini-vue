import { CREATE_ELEMENT_VNODE } from "./runtimeHeloers";

export const enum NodeTypes {
    INTERPOLATION,
    SIMPLE_EXPRESSION,
    ELEMENT,
    TEXT,
    ROOT,
    COMPOUND_EXPRESSION
}

export function createVNodeCall(context,tag,props,children){
    // 如果是element类型 则导入 createElementVNode 
    context.helper(CREATE_ELEMENT_VNODE);

    return {
        type: NodeTypes.ELEMENT,
        tag,
        props,
        children
    }
}