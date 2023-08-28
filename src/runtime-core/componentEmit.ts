export const emit = (instance, event, ...args) => {
    debugger
    const { props } = instance;

    // 烤肉串的方式
    const camelize = (str: string) => {
        return str.replace(/-(\w)/g, (_, c: string) => {
            return c ? c.toUpperCase() : ''
        })
    }
    // 首字母大写
    const capitalize = (str: string) => {
        return str.charAt(0).toUpperCase() + str.slice(1)
    }

    const toHandlerKey = (str: string) => {
        return str ? "on" + capitalize(str) : ""
    }

    const handlerName = toHandlerKey(camelize(event))
    const handler = props[handlerName]
    handler && handler(...args)
}