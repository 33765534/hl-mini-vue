import { render } from "./renderer";
import { createVNode } from "./vnode"

export function createApp(rootComponent) {
    return {
        mount(rootContainer) {
            // 先转换成vnode（虚拟节点）也就先接收一个component（组件）然后转换成vnode，然后所有的逻辑操作都会基于 vnode做处理
            const vnode = createVNode(rootComponent)

            // render函数主要是调用patch方法，方便我们递归调用
            render(vnode, rootContainer);
        }
    }
}