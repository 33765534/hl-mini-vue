import { hasChanged, isObject } from "@guide-mini-vue/shared";
import { isTracking, trackEffects, triggerEffects } from "./effect";
import { reactive } from "./reactive";

class RefImpl {
    private _value: any;
    public dep;
    private _rawValue;
    public __v_isRef = true
    constructor(value) {
        this._rawValue = value
        this._value = convert(value);
        this.dep = new Set()
    }
    get value() {
        trackRefValue(this);

        return this._value;
    }
    set value(newValue) {
        // 判断值有没有修改
        if (hasChanged(newValue, this._rawValue)) {
            // 一定先去修改 value 再调用触发依赖
            this._rawValue = newValue
            this._value = convert(newValue);
            triggerEffects(this.dep)
        }

    }
}
function convert(value) {
    // 判断是不是object类型 如果是对象就用reactive包裹
    return isObject(value) ? reactive(value) : value
}
function trackRefValue(ref) {
    if (isTracking()) {
        // 依赖收集
        trackEffects(ref.dep)
    }
}
export function ref(raw) {
    return new RefImpl(raw)
}

export function isRef(ref) {
    // 当有值时候直接返回true, 没有值的时候 把undefined 转成Boolean -> !! 
    return !!ref.__v_isRef
}

export function unRef(ref) {
    // 判断一下是不是ref ，如果是ref则返回ref.value ,否则直接返回ref
    return isRef(ref) ? ref.value : ref
}

export function proxyRefs(raw) {
    return new Proxy(raw, {
        get: (traget, key) => {
            return unRef(Reflect.get(traget, key))
        },
        set: (traget, key, value) => {
            if (isRef(traget[key]) && !isRef(value)) {
                return (traget[key].value = value)
            } else {
                return Reflect.set(traget, key, value)
            }

        }
    })
}