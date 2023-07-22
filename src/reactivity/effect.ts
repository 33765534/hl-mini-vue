import { extend } from "../shared";

let activeEffect;
let shouldTrack;
class ReactiveEffect {
    private _fn;
    deps = [];
    // 当清空过一次之后把active设置成false，这样就可以确保每次只删除一次
    active = true
    onStop?: () => void;
    public scheduler: Function | undefined
    constructor(fn, scheduler?: Function) {
        this._fn = fn
    }

    run() {
        // 已 stop
        if (!this.active) {
            return this._fn()
        }

        shouldTrack = true;

        activeEffect = this
        const res = this._fn()
        shouldTrack = false;

        return res
    }

    stop() {
        if (this.active) {
            // 调用 stop方法时 清除 deps中所有dep
            cleanupEffect(this)
            if (this.onStop) {
                this.onStop()
            }
            this.active = false
        }

    }
}

// 重构stop代码, 抽离delete函数
function cleanupEffect(effect) {
    effect.deps.forEach((dep: any) => {
        dep.delete(effect)
    })
    effect.deps.length = 0
}

const targetMap = new Map()
export function track(target, key) {
    if (!isTracking()) return;

    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map()
        targetMap.set(target, depsMap)
    }

    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set()
        depsMap.set(key, dep)
    }

    dep.add(activeEffect);
    // activeEffect存放dep 便于删除时操作
    activeEffect.deps.push(dep);
}

function isTracking() {
    return shouldTrack && activeEffect !== undefined
}

export function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    dep.forEach(element => {
        if (element.scheduler) {
            element.scheduler()
        } else {
            element.run()
        }

    });
}

export function effect(fn, options: any = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler)
    // 接收用户传入进来的onStop
    extend(_effect, options);

    _effect.onStop = options.onStop;
    _effect.run()
    const ruuner: any = _effect.run.bind(_effect)
    // 先给runner赋值一个 effect ，便于stop方法调用
    ruuner.effect = _effect;
    return ruuner
}

export function stop(runner) {
    runner.effect.stop();
}