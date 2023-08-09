import { PublicInstanceProxyHandlers } from "./componentPublicInstance";

// mountComponent 函数首先先通过虚拟节点创建一个组件实例对象 instance,因为组件本身有很多属性，所以可以抽离出一个组件实例instance
export function createComponentInstance(vnode) {
    const component = {
        vnode,
        // 本来type应该在虚拟节点内，为了方便可以在创建组件的时候创建个type
        type: vnode.type,
        setupState: {},
        el: null
    }
    return component
}

// setupStatefulComponent(instance)处理调用setup并且拿到setup的返回值
export function setupComponent(instance) {

    setupStatefulComponent(instance)
}

// 通过虚拟节点的type就可以获取到了component对象了，那么我们就能结构出setup了然后判断一下，用户有没有写setup,如果传了就调用一下，拿到result可以返回function或object
function setupStatefulComponent(instance) {
    const Component = instance.type;

    // 创建一个代理对象 一般我们称为 ctx 
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers)

    const { setup } = Component

    if (setup) {
        // 拿到result可以返回function或object
        const setupResult = setup();
        handleSetupResult(instance, setupResult)
    }
}

// 如果返回的是函数，就会认为是组件的render函数
// 如果返回的是object，就会把对象注入到组件的上下文中
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object') {
        instance.setupState = setupResult
    }

    // 保证我们组件的render必须是有值的
    finishComponentSetup(instance)
}

function finishComponentSetup(instance) {
    const Component = instance.type
    if (Component.render) {
        // 赋值到组件实例上
        instance.render = Component.render
    }
}