import { getCurrentInstance } from "./component";

export function provide(key, value) {
    // 存
    // 获取到组件实例对象
    const currentInstance: any = getCurrentInstance()

    // 先判断组件实例是否存在，存在之后取出 provides 然后给它赋值，通过provides[key]和value
    if (currentInstance) {
        let { provides } = currentInstance;
        // 先获取到父类的 provides
        const parentProvides = currentInstance.parent.provides

        // 初始化时我们给当前的 priovides赋值了父类的，那么我们只需要判断当前的priovides是不是等于父类的，从而达到只赋值创建一次原型
        if (provides === parentProvides) {
            // 通过Object.create 创建父类原型
            provides = currentInstance.provides = Object.create(parentProvides)
        }

        provides[key] = value;
    }
}

export function inject(key, defaultValue) {
    // 取  
    // 获取到组件实例对象
    const currentInstance: any = getCurrentInstance()

    // 通过parent的provides 来获取值
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;

        if (key in parentProvides) {
            return parentProvides[key]
        } else if (defaultValue) {
            if (typeof defaultValue === "function") {
                return defaultValue()
            }
            return defaultValue
        }
    }
}
