// 创建完vnode之后，我们创建render函数，接收一个vnode以及一个容器container

import { isObject } from "../shared"
import { ShapeFlags } from "./ShapeFlags"
import { createComponentInstance, setupComponent } from "./component"
import { Fragment, Text } from "./vnode"

// render函数主要是调用patch方法，方便我们递归调用
export function render(vnode, container) {
    patch(vnode, container, null)

}

// 调用 patch函数， patch函数 去处理组件 processComponent(vnode,container) 给它虚拟节点以及容器 
function patch(vnode, container, parentComponent) {
    // 判断vnode 是不是一个element 
    // 如果是 element 那么应该处理element
    // processElement()
    const { type, shapeFlag } = vnode
    switch (type) {
        case Fragment:
            processFragment(vnode, container, parentComponent);
            break;
        case Text:
            processText(vnode, container);
            break;
        default:
            if (shapeFlag & ShapeFlags.ELEMENT) {
                processElement(vnode, container, parentComponent)
            } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                // 去处理组件
                processComponent(vnode, container, parentComponent)
            }
            break;
    }

}
function processText(vnode, container) {
    const textVnode = (vnode.el = document.createTextNode(vnode.children))
    container.append(textVnode)
}

function processFragment(vnode, container, parentComponent) {
    mountChildren(vnode, container, parentComponent)
}

function processElement(vnode, container, parentComponent) {
    // 初始化 mountElement
    mountElement(vnode, container, parentComponent)
}

function mountElement(vnode, container, parentComponent) {
    // 节点是通过document.createElement创建的，需要把el存起来
    // node中有 type,props,children
    const el = (vnode.el = document.createElement(vnode.type));

    // 在创建children时我们会碰到两种类型 string和array
    const { children, shapeFlag } = vnode;
    if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
        el.textContent = children;
    } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
        // 如果是数组则遍历数组，然后调用patch重新判断，参数为vnode以及容器，此时容器是我们的父类节点 el
        mountChildren(vnode, el, parentComponent)
    }

    // props
    const { props } = vnode;
    for (const key in props) {
        const val = props[key];
        const isOn = (key) => /^on[A-Z]/.test(key)
        if (isOn(key)) {
            const event = key.slice(2).toLowerCase();
            el.addEventListener(event, val)
        } else {
            el.setAttribute(key, val);
        }

    }

    container.append(el)
}

function mountChildren(vnode, container, parentComponent) {
    vnode.children.forEach((v) => {
        patch(v, container, parentComponent)
    })
}

function processComponent(vnode, container, parentComponent) {
    mountComponent(vnode, container, parentComponent)
}

// mountComponent 函数首先先通过虚拟节点创建一个组件实例对象 instance,因为组件本身有很多属性，所以可以抽离出一个组件实例instance
function mountComponent(initialVNode, container, parentComponent) {
    const instance = createComponentInstance(initialVNode, parentComponent)

    // setupComponent(instance)去处理 props、slots、以及调用setup返回的一些值
    setupComponent(instance);

    setupRenderEffect(instance, initialVNode, container)
}

// setupRenderEffect(instance) 函数，调用render函数得到虚拟节点tree
function setupRenderEffect(instance, initialVNode, container) {
    const { proxy } = instance
    // 绑定一下代理对象 当我们调用render的时候 把我们的代理对象绑定到 render函数的this上
    const subTree = instance.render.call(proxy)

    // vnode => patch
    // vnode => element => mountElement
    /**
     * 得到虚拟节点之后再进一步调用 patch
        我们现在虚拟节点是一种element类型然后下一步就是挂载 mountElement
        调用patch时 我们需要传入容器
     */
    patch(subTree, container, instance)

    // 所有的element都实例化处理完之后取el 
    initialVNode.el = subTree.el
}
