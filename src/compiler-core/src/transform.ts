import { NodeTypes } from "./ast";
import { TO_DISPLAY_STRING } from "./runtimeHeloers";

export function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    // 1. 遍历 - 深度优先搜索
    // 2. 修改 text content
    traverseNode(root, context);

    // codegenNode 来存放 children[0]
    createRootCodegen(root);

    // 把 helpers 赋值给根节点,这样在 codegen.ts 中就能直接ast.helpers取值了
    root.helpers = [...context.helpers.keys()];
}

function createRootCodegen(root: any) {
    root.codegenNode = root.children[0];
}

function createTransformContext(root: any, options: any): any {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1)
        }
    }

    return context;
}

// 遍历--深度优先搜索 -通过 traverseNode 函数递归来实现
function traverseNode(node: any, context) {
    console.log(node);
    // 1. element
    const nodeTransforms = context.nodeTransforms;
    // 循环遍历传入进来的函数
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        transform(node)
    }

    switch (node.type) {

        case NodeTypes.INTERPOLATION:
            // 判断每个节点的类型，插值的时候就添加一下 toDisplayString
            context.helper(TO_DISPLAY_STRING)
            break;
        case NodeTypes.ELEMENT:
        case NodeTypes.ROOT:
            traverseChildren(node, context);
            break;
        default:
            break;
    }


}

function traverseChildren(node: any, context: any) {
    const children = node.children;
    if (children) {
        for (let i = 0; i < children.length; i++) {
            const node = children[i];
            traverseNode(node, context)
        }
    }
}