import { camelize, capitalize } from "@guide-mini-vue/shared";

export const emit = (instance, event, ...args) => {
    
    const { props } = instance;

    const toHandlerKey = (str: string) => {
        return str ? "on" + capitalize(str) : ""
    }

    const handlerName = toHandlerKey(camelize(event))
    const handler = props[handlerName]
    handler && handler(...args)
}