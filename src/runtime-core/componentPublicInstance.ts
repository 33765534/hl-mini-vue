const publicPropertiesMap = {
    $el: (i) => i.vnode.el
}

export const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // setupState
        const { setupState } = instance;
        if (key in setupState) {
            return setupState[key]
        }

        // map对象来获取对应的值，后续只需要判断 key是不是在map中，如果在直接执行
        const publicGetter = publicPropertiesMap[key]
        if (publicGetter) {
            return publicGetter(instance)
        }
    }
}