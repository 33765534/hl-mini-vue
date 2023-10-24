const Fragment = Symbol("Fragment");
const Text = Symbol("Text");
function createVNode(type, props, children) {
    const vnode = {
        type,
        props,
        children,
        component: null,
        key: props && props.key,
        shapeFlag: getShapeFlag(type),
        el: null
    };
    // children
    if (typeof children === 'string') {
        vnode.shapeFlag |= 4 /* ShapeFlags.TEXT_CHILDREN */;
    }
    else if (Array.isArray(children)) {
        vnode.shapeFlag |= 8 /* ShapeFlags.ARRAY_CHILDREN */;
    }
    // 是组件类型的并且有children 且是object类型的
    if (vnode.shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
        if (typeof children === 'object') {
            vnode.shapeFlag |= 16 /* ShapeFlags.SLOT_CHILDREN */;
        }
    }
    return vnode;
}
function createTextVNode(text) {
    return createVNode(Text, {}, text);
}
function getShapeFlag(type) {
    return typeof type === 'string' ? 1 /* ShapeFlags.ELEMENT */ : 2 /* ShapeFlags.STATEFUL_COMPONENT */;
}

function h(type, props, children) {
    return createVNode(type, props, children);
}

function renderSlots(slots, name, props) {
    const slot = slots[name];
    if (slot) {
        if (typeof slot === 'function') {
            return createVNode(Fragment, {}, slot(props));
        }
    }
}

function toDisplayString(value) {
    return String(value);
}

const extend = Object.assign;
const isObject = (val) => {
    return val !== null && typeof val === 'object';
};
const isString = (val) => typeof val === 'string';
const hasChanged = (val, newValue) => {
    return !Object.is(val, newValue);
};
const hasOwn = (val, key) => Object.prototype.hasOwnProperty.call(val, key);
// 烤肉串的方式
const camelize = (str) => {
    return str.replace(/-(\w)/g, (_, c) => {
        return c ? c.toUpperCase() : '';
    });
};
// 首字母大写
const capitalize = (str) => {
    return str.charAt(0).toUpperCase() + str.slice(1);
};
const EMPTY_OBJ = {};

let activeEffect;
let shouldTrack;
class ReactiveEffect {
    constructor(fn, scheduler) {
        this.deps = [];
        // 当清空过一次之后把active设置成false，这样就可以确保每次只删除一次
        this.active = true;
        this._fn = fn;
    }
    run() {
        // 已 stop
        if (!this.active) {
            return this._fn();
        }
        shouldTrack = true;
        activeEffect = this;
        const res = this._fn();
        shouldTrack = false;
        return res;
    }
    stop() {
        if (this.active) {
            // 调用 stop方法时 清除 deps中所有dep
            cleanupEffect(this);
            if (this.onStop) {
                this.onStop();
            }
            this.active = false;
        }
    }
}
// 重构stop代码, 抽离delete函数
function cleanupEffect(effect) {
    effect.deps.forEach((dep) => {
        dep.delete(effect);
    });
    effect.deps.length = 0;
}
const targetMap = new Map();
// 收集依赖
function track(target, key) {
    let depsMap = targetMap.get(target);
    if (!depsMap) {
        depsMap = new Map();
        targetMap.set(target, depsMap);
    }
    let dep = depsMap.get(key);
    if (!dep) {
        dep = new Set();
        depsMap.set(key, dep);
    }
    trackEffects(dep);
}
function trackEffects(dep) {
    if (!isTracking())
        return;
    dep.add(activeEffect);
    // activeEffect存放dep 便于删除时操作
    activeEffect.deps.push(dep);
}
// 判断shouldTrack 或者 activeEffect存在
function isTracking() {
    return shouldTrack && activeEffect !== undefined;
}
// 触发依赖
function trigger(target, key) {
    let depsMap = targetMap.get(target);
    let dep = depsMap.get(key);
    triggerEffects(dep);
}
function triggerEffects(dep) {
    dep.forEach(element => {
        if (element.scheduler) {
            element.scheduler();
        }
        else {
            element.run();
        }
    });
}
function effect(fn, options = {}) {
    const _effect = new ReactiveEffect(fn, options.scheduler);
    // 接收用户传入进来的onStop
    extend(_effect, options);
    _effect.onStop = options.onStop;
    _effect.run();
    const ruuner = _effect.run.bind(_effect);
    // 先给runner赋值一个 effect ，便于stop方法调用
    ruuner.effect = _effect;
    return ruuner;
}

function createGetter(isReadonly = false, shallow = false) {
    return function get(target, key) {
        const res = Reflect.get(target, key);
        if (key === "_v_isReactive" /* ReactiveFlags.IS_REACTIVE */) {
            return !isReadonly;
        }
        else if (key === "_v_isReadonly" /* ReactiveFlags.IS_READONLY */) {
            return isReadonly;
        }
        if (shallow)
            return res;
        // 实现 reactive 和 readonly 嵌套对象转换功能
        if (isObject(res)) {
            return isReadonly ? readonly(res) : reactive(res);
        }
        if (!isReadonly) {
            track(target, key);
        }
        return res;
    };
}
function createSetter() {
    return function set(target, key, value) {
        const res = Reflect.set(target, key, value);
        trigger(target, key);
        return res;
    };
}
const get = createGetter();
const set = createSetter();
const readonlyGet = createGetter(true);
const shallowReadonlyGet = createGetter(true, true);
const mutableHandlers = {
    get,
    set
};
const readonlyHandlers = {
    get: readonlyGet,
    set(target, key, value) {
        console.warn(`key:${key} set 失败`);
        return true;
    }
};
const shallowReadonlyHandlers = extend({}, readonlyHandlers, {
    get: shallowReadonlyGet
});

function reactive(obj) {
    return createActiveObject(obj, mutableHandlers);
}
function readonly(obj) {
    return createActiveObject(obj, readonlyHandlers);
}
function shallowReadonly(raw) {
    return createActiveObject(raw, shallowReadonlyHandlers);
}
function isProxy(value) {
    return isReactive(value) || isReadonly(value);
}
function createActiveObject(target, baseHandlers) {
    if (!isObject(target)) {
        console.warn(`target ${target} 必须是一个对象`);
        return target;
    }
    return new Proxy(target, baseHandlers);
}
function isReactive(value) {
    return !!value["_v_isReactive" /* ReactiveFlags.IS_REACTIVE */];
}
function isReadonly(value) {
    return !!value["_v_isReadonly" /* ReactiveFlags.IS_READONLY */];
}

class RefImpl {
    constructor(value) {
        this.__v_isRef = true;
        this._rawValue = value;
        this._value = convert(value);
        this.dep = new Set();
    }
    get value() {
        trackRefValue(this);
        return this._value;
    }
    set value(newValue) {
        // 判断值有没有修改
        if (hasChanged(newValue, this._rawValue)) {
            // 一定先去修改 value 再调用触发依赖
            this._rawValue = newValue;
            this._value = convert(newValue);
            triggerEffects(this.dep);
        }
    }
}
function convert(value) {
    // 判断是不是object类型 如果是对象就用reactive包裹
    return isObject(value) ? reactive(value) : value;
}
function trackRefValue(ref) {
    if (isTracking()) {
        // 依赖收集
        trackEffects(ref.dep);
    }
}
function ref(raw) {
    return new RefImpl(raw);
}
function isRef(ref) {
    // 当有值时候直接返回true, 没有值的时候 把undefined 转成Boolean -> !! 
    return !!ref.__v_isRef;
}
function unRef(ref) {
    // 判断一下是不是ref ，如果是ref则返回ref.value ,否则直接返回ref
    return isRef(ref) ? ref.value : ref;
}
function proxyRefs(raw) {
    return new Proxy(raw, {
        get: (traget, key) => {
            return unRef(Reflect.get(traget, key));
        },
        set: (traget, key, value) => {
            if (isRef(traget[key]) && !isRef(value)) {
                return (traget[key].value = value);
            }
            else {
                return Reflect.set(traget, key, value);
            }
        }
    });
}

const emit = (instance, event, ...args) => {
    const { props } = instance;
    const toHandlerKey = (str) => {
        return str ? "on" + capitalize(str) : "";
    };
    const handlerName = toHandlerKey(camelize(event));
    const handler = props[handlerName];
    handler && handler(...args);
};

function initProps(instance, rawProps) {
    instance.props = rawProps || {};
}

const publicPropertiesMap = {
    $el: (i) => i.vnode.el,
    $slots: (i) => i.slots,
    $props: (i) => i.props,
};
const PublicInstanceProxyHandlers = {
    get({ _: instance }, key) {
        // setupState
        const { setupState, props } = instance;
        if (hasOwn(setupState, key)) {
            return setupState[key];
        }
        else if (hasOwn(props, key)) {
            return props[key];
        }
        // map对象来获取对应的值，后续只需要判断 key是不是在map中，如果在直接执行
        const publicGetter = publicPropertiesMap[key];
        if (publicGetter) {
            return publicGetter(instance);
        }
    }
};

function initSlots(instance, children) {
    const { vnode } = instance;
    // 判断 当前虚拟节点是不是 SLOT_CHILDREN 类型，如果是在进行处理slots
    if (vnode.shapeFlag & 16 /* ShapeFlags.SLOT_CHILDREN */) {
        normalizeObjectSlots(children, instance.slots);
    }
}
function normalizeSlotValue(value) {
    return Array.isArray(value) ? value : [value];
}
function normalizeObjectSlots(children, slots) {
    for (const key in children) {
        const value = children[key];
        // 还需要使用函数 所以我们把这个变成一个函数
        slots[key] = (props) => normalizeSlotValue(value(props));
    }
}

// mountComponent 函数首先先通过虚拟节点创建一个组件实例对象 instance,因为组件本身有很多属性，所以可以抽离出一个组件实例instance
function createComponentInstance(vnode, parent) {
    const component = {
        vnode,
        // 本来type应该在虚拟节点内，为了方便可以在创建组件的时候创建个type
        type: vnode.type,
        setupState: {},
        props: {},
        next: null,
        el: null,
        emit: () => { },
        provides: parent ? parent.provides : {},
        parent,
        isMounted: false,
        subTree: {},
        slots: {}
    };
    component.emit = emit.bind(null, component);
    return component;
}
// setupStatefulComponent(instance)处理调用setup并且拿到setup的返回值
function setupComponent(instance) {
    initProps(instance, instance.vnode.props);
    initSlots(instance, instance.vnode.children);
    setupStatefulComponent(instance);
}
// 通过虚拟节点的type就可以获取到了component对象了，那么我们就能结构出setup了然后判断一下，用户有没有写setup,如果传了就调用一下，拿到result可以返回function或object
function setupStatefulComponent(instance) {
    const Component = instance.type;
    // 创建一个代理对象 一般我们称为 ctx 
    instance.proxy = new Proxy({ _: instance }, PublicInstanceProxyHandlers);
    const { setup } = Component;
    if (setup) {
        setCurrentInstance(instance);
        // 拿到result可以返回function或object
        const setupResult = setup(shallowReadonly(instance.props), {
            emit: instance.emit
        });
        setCurrentInstance(null);
        handleSetupResult(instance, setupResult);
    }
}
// 如果返回的是函数，就会认为是组件的render函数
// 如果返回的是object，就会把对象注入到组件的上下文中
function handleSetupResult(instance, setupResult) {
    if (typeof setupResult === 'object') {
        instance.setupState = proxyRefs(setupResult);
    }
    // 保证我们组件的render必须是有值的
    finishComponentSetup(instance);
}
function finishComponentSetup(instance) {
    const Component = instance.type;
    if (!Component.render && compiler) {
        if (Component.template) {
            instance.render = compiler(Component.template);
        }
    }
    // 赋值到组件实例上
    if (Component.render)
        instance.render = Component.render;
}
let compiler;
function registerRuntimeCompiler(_compiler) {
    compiler = _compiler;
}
let currentInstance = null;
function getCurrentInstance() {
    return currentInstance;
}
function setCurrentInstance(instance) {
    currentInstance = instance;
}

function provide(key, value) {
    // 存
    // 获取到组件实例对象
    const currentInstance = getCurrentInstance();
    // 先判断组件实例是否存在，存在之后取出 provides 然后给它赋值，通过provides[key]和value
    if (currentInstance) {
        let { provides } = currentInstance;
        // 先获取到父类的 provides
        const parentProvides = currentInstance.parent.provides;
        // 初始化时我们给当前的 priovides赋值了父类的，那么我们只需要判断当前的priovides是不是等于父类的，从而达到只赋值创建一次原型
        if (provides === parentProvides) {
            // 通过Object.create 创建父类原型
            provides = currentInstance.provides = Object.create(parentProvides);
        }
        provides[key] = value;
    }
}
function inject(key, defaultValue) {
    // 取  
    // 获取到组件实例对象
    const currentInstance = getCurrentInstance();
    // 通过parent的provides 来获取值
    if (currentInstance) {
        const parentProvides = currentInstance.parent.provides;
        if (key in parentProvides) {
            return parentProvides[key];
        }
        else if (defaultValue) {
            if (typeof defaultValue === "function") {
                return defaultValue();
            }
            return defaultValue;
        }
    }
}

// 用于判断组件是否需要更新，是否修改了props
function shouldUpdateComponent(prevVNode, nextVNode) {
    const { props: prevProps } = prevVNode;
    const { props: nextProps } = nextVNode;
    for (const key in nextProps) {
        if (nextProps[key] !== prevProps[key]) {
            return true;
        }
    }
    return false;
}

function createAppAPI(render) {
    return function createApp(rootComponent) {
        return {
            mount(rootContainer) {
                // 先转换成vnode（虚拟节点）也就先接收一个component（组件）然后转换成vnode，然后所有的逻辑操作都会基于 vnode做处理
                const vnode = createVNode(rootComponent);
                // render函数主要是调用patch方法，方便我们递归调用
                render(vnode, rootContainer);
            }
        };
    };
}

let queue = [];
let isFlushPending = false;
const p = Promise.resolve();
function nextTick(fn) {
    return fn ? p.then(fn) : p;
}
function queueJobs(job) {
    if (!queue.includes(job)) {
        //  先判断队列中是否存在，不存在就添加job
        queue.push(job);
    }
    queueFlush();
}
function queueFlush() {
    if (isFlushPending)
        return;
    isFlushPending = true;
    // 把要执行的函数抽离成flushJobs  传入nextTick
    nextTick(flushJobs);
}
function flushJobs() {
    isFlushPending = false;
    let job;
    // shift()从数组中删除第一个元素并返回该数组的值
    // 赋值给job 并 执行
    while ((job = queue.shift())) {
        job && job();
    }
}

// 创建完vnode之后，我们创建render函数，接收一个vnode以及一个容器container
function createRenderer(options) {
    const { createElement: hostCreateElement, patchProp: hostPatchProp, insert: hostInsert, remove: hostRemove, setElementText: hostSetElementText } = options;
    // render函数主要是调用patch方法，方便我们递归调用
    function render(vnode, container) {
        patch(null, vnode, container, null, null);
    }
    // 调用 patch函数， patch函数 去处理组件 processComponent(vnode,container) 给它虚拟节点以及容器 
    function patch(n1, n2, container, parentComponent, anchor) {
        // 判断vnode 是不是一个element 
        // 如果是 element 那么应该处理element
        // processElement()
        const { type, shapeFlag } = n2;
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & 1 /* ShapeFlags.ELEMENT */) {
                    processElement(n1, n2, container, parentComponent, anchor);
                }
                else if (shapeFlag & 2 /* ShapeFlags.STATEFUL_COMPONENT */) {
                    // 去处理组件
                    processComponent(n1, n2, container, parentComponent, anchor);
                }
                break;
        }
    }
    function processText(n1, n2, container) {
        const textVnode = (n2.el = document.createTextNode(n2.children));
        container.append(textVnode);
    }
    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor);
    }
    function processElement(n1, n2, container, parentComponent, anchor) {
        // 当 n1 不存在时则是初始化 ，否则是更新
        if (!n1) {
            // 初始化 mountElement
            mountElement(n2, container, parentComponent, anchor);
        }
        else {
            patchElement(n1, n2, container, parentComponent, anchor);
        }
    }
    function patchElement(n1, n2, container, parentComponent, anchor) {
        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;
        const el = (n2.el = n1.el);
        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps);
    }
    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const prevShapeFlage = n1.shapeFlag;
        const c1 = n1.children;
        const { shapeFlag } = n2;
        const c2 = n2.children;
        // 先判断 新的 shapeFlag 是不是text类型  TEXT_CHILDREN
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            if (prevShapeFlage & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
                // 把老的 children 清空
                unmountChildren(n1.children);
            }
            if (c1 != c2) {
                hostSetElementText(container, c2);
            }
        }
        else {
            // 新的是 Array
            if (prevShapeFlage & 4 /* ShapeFlags.TEXT_CHILDREN */) {
                // 老的是 text
                // 先清空text
                hostSetElementText(container, "");
                // mountChildren
                mountChildren(c2, container, parentComponent, anchor);
            }
            else {
                // 老的也是 Array
                patchKeyedChildren(c1, c2, container, parentComponent, anchor);
            }
        }
    }
    function patchKeyedChildren(c1, c2, container, parentComponent, anchor) {
        let i = 0;
        let l2 = c2.length;
        let e1 = c1.length - 1;
        let e2 = l2 - 1;
        // 左边对比
        while (i <= e1 && i <= e2) {
            const n1 = c1[i];
            const n2 = c2[i];
            // 调用isSomeVNodeType 对比n1和n2是否相同
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, anchor);
            }
            else {
                break; // 不相等就退出循环
            }
            i++;
        }
        // 右侧对比
        // i会定死在索引0，e1和e2对比，相同的话索引进行左移，直到两个节点不同
        while (i <= e1 && i <= e2) {
            const n1 = c1[e1];
            const n2 = c2[e2];
            // 调用isSomeVNodeType 对比n1和n2是否相同
            if (isSomeVNodeType(n1, n2)) {
                patch(n1, n2, container, parentComponent, anchor);
            }
            else {
                break; // 不相等就退出循环
            }
            e1--;
            e2--;
        }
        // 新的比老的多  创建
        // 当i>e1的时候，并且i<=e2 调用patch 创建c2[i] 节点
        if (i > e1) {
            if (i <= e2) {
                // (nextPos=i+1)  nextPos如果大于右侧c2.length 则锚点为null 否则根据nextPos 获取c2的el // c2[nextPos].el
                const nextPos = e2 + 1;
                // nextPos小于c2.length 则 返回指定描点 否则返回null
                const anchor = nextPos < l2 ? c2[nextPos].el : null;
                while (i <= e2) {
                    patch(null, c2[i], container, parentComponent, anchor);
                    i++;
                }
            }
        }
        else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++;
            }
        }
        else {
            // 中间对比
            let s1 = i; // 老的不同处起始位置
            let s2 = i; // 新的不同处起始位置
            const toBePatched = e2 - s2 + 1; // 新节点不同处的长度 
            let patched = 0; // 当前处理的数量
            const keyToNewIndexMap = new Map(); // key的映射表
            // 新的索引和老的索引的映射表      定长性能更好点
            const newIndexToOldIndexMap = new Array(toBePatched);
            let moved = false; // 标记是否需要调用递增子序列函数
            let maxNewIndexSoFar = 0;
            for (let i = 0; i < toBePatched; i++)
                newIndexToOldIndexMap[i] = 0; // 初始化 还没有建立映射关系
            // 循环遍历新的
            for (let i = s2; i <= e2; i++) {
                // 获取到当前节点
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i);
            }
            // 循环遍历老的
            let newIndex;
            for (let i = s1; i <= e1; i++) {
                // 获取到当前节点
                const prevChild = c1[i];
                // 处理的大于新的总数量
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el); // 删除
                    continue;
                }
                if (prevChild.key != null) {
                    // 通过key 获取到索引
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                }
                else {
                    // 如果没有写key
                    for (let j = s2; j <= e2; j++) {
                        // 判断老节点是否在新节点中存在
                        if (isSomeVNodeType(prevChild, c2[j])) {
                            newIndex = j;
                            break;
                        }
                    }
                }
                if (newIndex === undefined) {
                    // 在新的里如果没有查找到就删除老的节点
                    hostRemove(prevChild.el);
                }
                else {
                    if (newIndex >= maxNewIndexSoFar) {
                        // 记录的点如果小于newIndex 则赋值
                        maxNewIndexSoFar = newIndex;
                    }
                    else {
                        moved = true; // 需要移动
                    }
                    // newIndex - s2 我们让索引从0开始
                    // i 有可能是0 0代表没有映射 所以我们+1
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    // 在新的里存在
                    patch(prevChild, c2[newIndex], container, processComponent, null);
                    patched++; // 处理完一个新的就加1
                }
            }
            // 得出最长递增子序列
            const increasingNewIndexSequence = moved ? getSequence(newIndexToOldIndexMap) : [];
            // 作为最长递增子序列的指针
            let j = increasingNewIndexSequence.length;
            // 通过倒序进行往前判断插入
            for (let i = toBePatched - 1; i >= 0; i--) {
                // 算出新节点不同处的最后一个位置的索引
                const nextIndex = i + s2;
                const nextChild = c2[nextIndex]; // 获取最后一个对象
                // 获取锚点
                const anchor = nextIndex + 1 < l2 ? c2[nextIndex + 1].el : null;
                // newIndexToOldIndexMap 是 newIndex - s2 我们让索引从0开始
                // i 有可能是0 0代表没有映射
                if (newIndexToOldIndexMap[i] === 0) {
                    // 如果等于0 那么在老的里面是不存在的  就创建
                    patch(null, nextChild, container, parentComponent, anchor);
                }
                else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        // 不在最长子序列中 则移动位置
                        hostInsert(nextChild.el, container, anchor);
                    }
                    else {
                        j--;
                    }
                }
            }
        }
    }
    //  求出最长子序列[4,2,3,1,5] 的到索引[1,2,4]
    function getSequence(arr) {
        const p = arr.slice();
        const result = [0];
        let i, j, u, v, c;
        const len = arr.length;
        for (i = 0; i < len; i++) {
            const arrI = arr[i];
            if (arrI !== 0) {
                j = result[result.length - 1];
                if (arr[j] < arrI) {
                    p[i] = j;
                    result.push(i);
                    continue;
                }
                u = 0;
                v = result.length - 1;
                while (u < v) {
                    c = (u + v) >> 1;
                    if (arr[result[c]] < arrI) {
                        u = c + 1;
                    }
                    else {
                        v = c;
                    }
                }
                if (arrI < arr[result[u]]) {
                    if (u > 0) {
                        p[i] = result[u - 1];
                    }
                    result[u] = i;
                }
            }
        }
        u = result.length;
        v = result[u - 1];
        while (u-- > 0) {
            result[u] = v;
            v = p[v];
        }
        return result;
    }
    // 对比n1和n2是否相同
    function isSomeVNodeType(n1, n2) {
        return n1.type === n2.type && n1.key === n2.key;
    }
    // children 清空
    function unmountChildren(children) {
        for (let i = 0; i < children.length; i++) {
            const el = children[i].el;
            // remove
            hostRemove(el);
        }
    }
    function patchProps(el, oldProps, newProps) {
        // 老的props 不等于新的props的时候 才需要进行判断对比
        if (oldProps !== newProps) {
            // 新的props和老的props 遍历对比如果有不一样的就调用hostPatchProp更新
            for (const key in newProps) {
                const prevProp = oldProps[key];
                const nextProp = newProps[key];
                if (prevProp !== nextProp) {
                    hostPatchProp(el, key, prevProp, nextProp);
                }
            }
            if (oldProps !== EMPTY_OBJ) {
                // 循环一下老的 props, 判断一下 key是不是在新的props里面
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        // 如果不在则调用hostPatchProp 传入当前新值是null 删除掉
                        hostPatchProp(el, key, oldProps[key], null);
                    }
                }
            }
        }
    }
    function mountElement(vnode, container, parentComponent, anchor) {
        // 节点是通过document.createElement创建的，需要把el存起来
        // node中有 type,props,children
        const el = (vnode.el = hostCreateElement(vnode.type));
        // 在创建children时我们会碰到两种类型 string和array
        const { children, shapeFlag } = vnode;
        if (shapeFlag & 4 /* ShapeFlags.TEXT_CHILDREN */) {
            el.textContent = children;
        }
        else if (shapeFlag & 8 /* ShapeFlags.ARRAY_CHILDREN */) {
            // 如果是数组则遍历数组，然后调用patch重新判断，参数为vnode以及容器，此时容器是我们的父类节点 el
            mountChildren(vnode.children, el, parentComponent, anchor);
        }
        // props
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];
            hostPatchProp(el, key, null, val);
        }
        // container.append(el)
        hostInsert(el, container, anchor);
    }
    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent, anchor);
        });
    }
    function processComponent(n1, n2, container, parentComponent, anchor) {
        if (!n1) {
            mountComponent(n2, container, parentComponent, anchor);
        }
        else {
            updateComponent(n1, n2);
        }
    }
    function updateComponent(n1, n2) {
        const instance = (n2.component = n1.component);
        if (shouldUpdateComponent(n1, n2)) {
            instance.next = n2; //获取到新的vnode初始化的时候也加上 next  代表下次要更新的时候的虚拟节点
            instance.update();
        }
        else {
            n2.el = n1.el;
            instance.vnode = n2;
        }
    }
    // mountComponent 函数首先先通过虚拟节点创建一个组件实例对象 instance,因为组件本身有很多属性，所以可以抽离出一个组件实例instance
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        const instance = (initialVNode.component = createComponentInstance(initialVNode, parentComponent));
        // setupComponent(instance)去处理 props、slots、以及调用setup返回的一些值
        setupComponent(instance);
        setupRenderEffect(instance, initialVNode, container, anchor);
    }
    // setupRenderEffect(instance) 函数，调用render函数得到虚拟节点tree
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        instance.update = effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance;
                // 绑定一下代理对象 当我们调用render的时候 把我们的代理对象绑定到 render函数的this上
                const subTree = (instance.subTree = instance.render.call(proxy, proxy));
                // vnode => patch
                // vnode => element => mountElement
                /**
                 * 得到虚拟节点之后再进一步调用 patch
                    我们现在虚拟节点是一种element类型然后下一步就是挂载 mountElement
                    调用patch时 我们需要传入容器
                 */
                patch(null, subTree, container, instance, anchor);
                // 所有的element都实例化处理完之后取el 
                initialVNode.el = subTree.el;
                instance.isMounted = true;
            }
            else {
                const { next, vnode } = instance;
                if (next) {
                    // next更新的vnode 如果存在就走
                    next.el = vnode.el;
                    updateComponentPreRender(instance, next);
                }
                const { proxy } = instance;
                const subTree = instance.render.call(proxy, proxy);
                const prevSubTree = instance.subTree;
                // 获取到之前的subTree后 要把当前的赋值给  instance.subTree 这样下次进来就能获取到当前的vnode了
                instance.subTree = subTree;
                patch(prevSubTree, subTree, container, instance, anchor);
            }
        }, {
            scheduler() {
                // 收集job
                queueJobs(instance.update);
            }
        });
    }
    function updateComponentPreRender(instance, nextVNode) {
        // 更新 props
        instance.vnode = nextVNode;
        instance.next = null;
        instance.props = nextVNode.props;
    }
    return {
        createApp: createAppAPI(render)
    };
}

function createElement(type) {
    return document.createElement(type);
}
function patchProp(el, key, prevVal, nextVal) {
    const isOn = (key) => /^on[A-Z]/.test(key);
    if (isOn(key)) {
        const event = key.slice(2).toLowerCase();
        el.addEventListener(event, nextVal);
    }
    else {
        if (nextVal === undefined || nextVal === null) {
            el.removeAttribute(key);
        }
        else {
            el.setAttribute(key, nextVal);
        }
    }
}
function insert(child, parent, anchor) {
    parent.insertBefore(child, anchor || null);
}
// child.parentNode获取到父类节点，判断是否存在，然后调用分类节点的removeChild(child) 删除掉子类
function remove(child) {
    const parent = child.parentNode;
    if (parent) {
        parent.removeChild(child);
    }
}
function setElementText(el, text) {
    el.textContent = text;
}
const renderer = createRenderer({
    createElement,
    patchProp,
    insert,
    remove,
    setElementText
});
function createApp(...args) {
    return renderer.createApp(...args);
}

var runtimeDom = /*#__PURE__*/Object.freeze({
    __proto__: null,
    createApp: createApp,
    createElementVNode: createVNode,
    createRenderer: createRenderer,
    createTextVNode: createTextVNode,
    effect: effect,
    getCurrentInstance: getCurrentInstance,
    h: h,
    inject: inject,
    isProxy: isProxy,
    isReactive: isReactive,
    isReadonly: isReadonly,
    isRef: isRef,
    nextTick: nextTick,
    provide: provide,
    proxyRefs: proxyRefs,
    reactive: reactive,
    readonly: readonly,
    ref: ref,
    registerRuntimeCompiler: registerRuntimeCompiler,
    renderSlots: renderSlots,
    shallowReadonly: shallowReadonly,
    toDisplayString: toDisplayString,
    unRef: unRef
});

function baseParse(content) {
    const context = createParserContext(content);
    return createRoot(parseChildren(context, []));
}
function parseChildren(context, ancestors) {
    const nodes = [];
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        // startsWith() 方法用于检测字符串是否以指定的子字符串开始
        if (s.startsWith("{{")) {
            // parseChildren中 调用parseInterpolation创建node节点 然后push到nodes中并返回
            node = parseInterpolation(context);
        }
        else if (s[0] === "<") {
            // 判断字符串的第一个是不是<  再判断字符串第二个是不是a-z的字母正则/i 不区分大小写，如果是就是element类型
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors);
            }
        }
        if (!node) {
            node = parseText(context);
        }
        nodes.push(node);
    }
    return nodes;
}
function startsWithEndTagOpen(source, tag) {
    return source.startsWith("</") && source.slice(2, 2 + tag.length).toLowerCase() === tag.toLowerCase();
}
function isEnd(context, ancestors) {
    // 2.遇见结束标签的时候 停止循环
    const s = context.source;
    // 当遇到结束标签 </ 的时候，看看之前有没有开始标签，如果有就直接结束了，没有就报异常
    if (s.startsWith('</')) {
        for (let i = ancestors.length - 1; i >= 0; i--) {
            const tag = ancestors[i].tag;
            if (startsWithEndTagOpen(s, tag)) {
                return true;
            }
        }
    }
    // if (s.startsWith(`</${parentTag}>`)) {
    //     return true
    // }
    // 1.当 source 有值的情况下就一直循环
    return !s;
}
function parseText(context) {
    let endIndex = context.source.length;
    let endTokens = ["<", "{{"];
    for (let i = 0; i < endTokens.length; i++) {
        const index = context.source.indexOf(endTokens[i]);
        if (index !== -1 && endIndex > index) {
            endIndex = index;
        }
    }
    const content = parseTextData(context, endIndex);
    return {
        type: 3 /* NodeTypes.TEXT */,
        content
    };
}
function parseTextData(context, length) {
    const content = context.source.slice(0, length);
    // 删除处理完的内容
    advanceBy(context, length);
    return content;
}
function parseElement(context, ancestors) {
    const element = parseTag(context, 0 /* TagType.Start */);
    // 在解析children之前 收集 ancestors ，在parseChildren 处理完之后 弹出栈也就是 pop 
    ancestors.push(element);
    element.children = parseChildren(context, ancestors);
    ancestors.pop();
    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, 1 /* TagType.End */);
    }
    else {
        throw new Error(`缺少结束标签：${element.tag}`);
    }
    return element;
}
function parseTag(context, type) {
    // 1.解析 tag
    const match = /^<\/?([a-z]*)/i.exec(context.source);
    // 获取到标签值 如： div 
    const tag = match[1];
    // 2. 删除处理完的代码
    advanceBy(context, match[0].length); // <div 或者是</div
    advanceBy(context, 1); // 再把 > 删除
    if (type === 1 /* TagType.End */)
        return;
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag
    };
}
function parseInterpolation(context) {
    const openDelimiter = "{{";
    const closeDelimiter = "}}";
    const closeIndex = context.source.indexOf(closeDelimiter, openDelimiter.length);
    // 截取掉前面的{{
    advanceBy(context, openDelimiter.length);
    // 获取到结尾的}} 再减去2(前面{{的长度) 
    const rawContentLength = closeIndex - openDelimiter.length;
    // 获取到{{}} 之间的变量名
    const rawContent = parseTextData(context, rawContentLength);
    const content = rawContent.trim();
    // 清空处理完的字符
    advanceBy(context, closeDelimiter.length);
    return {
        type: 0 /* NodeTypes.INTERPOLATION */,
        content: {
            type: 1 /* NodeTypes.SIMPLE_EXPRESSION */,
            content: content,
        }
    };
}
function advanceBy(context, length) {
    context.source = context.source.slice(length);
}
function createRoot(children) {
    // createRoot函数 返回children
    return {
        children,
        type: 4 /* NodeTypes.ROOT */
    };
}
function createParserContext(content) {
    // 返回一个对象source,后续都通过source来进行处理对象
    return {
        source: content
    };
}

// 处理插值的逻辑
function transformExpression(node) {
    if (node.type === 0 /* NodeTypes.INTERPOLATION */) {
        node.content = processExpression(node.content);
    }
}
function processExpression(node) {
    node.content = `_ctx.${node.content}`;
    return node;
}

const TO_DISPLAY_STRING = Symbol("toDisplayString");
const CREATE_ELEMENT_VNODE = Symbol("createElementVNode");
const helperMapName = {
    [TO_DISPLAY_STRING]: "toDisplayString",
    [CREATE_ELEMENT_VNODE]: "createElementVNode",
};

function createVNodeCall(context, tag, props, children) {
    // 如果是element类型 则导入 createElementVNode 
    context.helper(CREATE_ELEMENT_VNODE);
    return {
        type: 2 /* NodeTypes.ELEMENT */,
        tag,
        props,
        children
    };
}

function transformElement(node, context) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            // 中间层处理
            // tag
            const vnodeTag = `'${node.tag}'`;
            // props
            let vnodeProps;
            // children
            const children = node.children;
            let vnodeChildren = children[0];
            node.codegenNode = createVNodeCall(context, vnodeTag, vnodeProps, vnodeChildren);
        };
    }
}

function isText(node) {
    // 判断类型是不是 text 或者插值
    return (node.type === 3 /* NodeTypes.TEXT */ || node.type === 0 /* NodeTypes.INTERPOLATION */);
}

function transformText(node) {
    if (node.type === 2 /* NodeTypes.ELEMENT */) {
        return () => {
            const { children } = node;
            // 处理复合类型
            let currentContainer; // 创建容器
            for (let i = 0; i < children.length; i++) {
                const child = children[i];
                // 判断是不是text 或者插值
                if (isText(child)) {
                    // 再次循环children 找出相邻的所以用i+1
                    for (let j = i + 1; j < children.length; j++) {
                        const next = children[j];
                        // 相邻的是text 或者插值 那么就是 复合类型
                        if (isText(next)) {
                            if (!currentContainer) {
                                // 初始化容器 赋值-复合类型并把children[i]替换成复合类型
                                currentContainer = children[i] = {
                                    type: 5 /* NodeTypes.COMPOUND_EXPRESSION */,
                                    children: [child]
                                };
                            }
                            currentContainer.children.push("+"); // 拼接 + 以及相邻的后面的节点
                            currentContainer.children.push(next);
                            children.splice(j, 1); // 删除拼接过的数据
                            j--; // 删除后索引要减一
                        }
                        else {
                            // 相邻的不是isText 则容器清空 进入下一个外层循环
                            currentContainer = undefined;
                            break;
                        }
                    }
                }
            }
        };
    }
}

function generate(ast) {
    const context = createCodegenContext();
    const { push } = context;
    genFunctionPreamble(ast, context);
    const functionName = "render";
    const args = ["_ctx", "_cache"];
    const signature = args.join(",");
    push(`function ${functionName}(${signature}){`);
    push(" return ");
    genNode(ast.codegenNode, context);
    push("}");
    return {
        code: context.code
    };
}
function genFunctionPreamble(ast, context) {
    const { push } = context;
    const VueBinging = "Vue";
    const aliasHelper = (s) => `${helperMapName[s]}:_${helperMapName[s]}`;
    if (ast.helpers.length > 0) {
        push(`const { ${ast.helpers.map(aliasHelper).join(",")} } = ${VueBinging}`);
    }
    push("\n");
    push("return ");
}
function createCodegenContext() {
    //  函数封装个上下文对象 context  
    // code 属性，以及 push 方法
    const context = {
        code: '',
        push(source) {
            context.code += source;
        },
        helper(key) {
            return `_${helperMapName[key]}`;
        }
    };
    return context;
}
function genNode(node, context) {
    switch (node.type) {
        case 3 /* NodeTypes.TEXT */:
            genText(node, context);
            break;
        case 0 /* NodeTypes.INTERPOLATION */:
            // 插值
            genInterpolation(node, context);
            break;
        case 1 /* NodeTypes.SIMPLE_EXPRESSION */:
            // 表达式
            genExpression(node, context);
            break;
        case 2 /* NodeTypes.ELEMENT */:
            genElement(node, context);
            break;
        case 5 /* NodeTypes.COMPOUND_EXPRESSION */:
            genCompoundExpression(node, context);
            break;
    }
}
// 处理复合类型
function genCompoundExpression(node, context) {
    const { push } = context;
    const children = node.children;
    for (let i = 0; i < children.length; i++) {
        const child = children[i];
        if (isString(child)) {
            push(child);
        }
        else {
            genNode(child, context);
        }
    }
}
function genElement(node, context) {
    const { push, helper } = context;
    const { tag, children, props } = node;
    push(`${helper(CREATE_ELEMENT_VNODE)}(`);
    genNodeList(genNullable([tag, props, children]), context);
    push(')');
}
function genNodeList(nodes, context) {
    const { push } = context;
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (isString(node)) {
            push(node);
        }
        else {
            genNode(node, context);
        }
        if (i < nodes.length - 1) {
            push(",");
        }
    }
}
// map 判断如果没值返回 null
function genNullable(args) {
    return args.map(arg => arg || "null");
}
function genText(node, context) {
    const { push } = context;
    push(`'${node.content}'`);
}
function genInterpolation(node, context) {
    const { push, helper } = context;
    push(`${helper(TO_DISPLAY_STRING)}(`);
    genNode(node.content, context);
    push(`)`);
}
function genExpression(node, context) {
    const { push } = context;
    push(`${node.content}`);
}

function transform(root, options = {}) {
    const context = createTransformContext(root, options);
    // 1. 遍历 - 深度优先搜索
    // 2. 修改 text content
    traverseNode(root, context);
    // codegenNode 来存放 children[0]
    createRootCodegen(root);
    // 把 helpers 赋值给根节点,这样在 codegen.ts 中就能直接ast.helpers取值了
    root.helpers = [...context.helpers.keys()];
}
function createRootCodegen(root) {
    const child = root.children[0];
    if (child.type === 2 /* NodeTypes.ELEMENT */) {
        root.codegenNode = child.codegenNode;
    }
    else {
        root.codegenNode = root.children[0];
    }
}
function createTransformContext(root, options) {
    const context = {
        root,
        nodeTransforms: options.nodeTransforms || [],
        helpers: new Map(),
        helper(key) {
            context.helpers.set(key, 1);
        }
    };
    return context;
}
// 遍历--深度优先搜索 -通过 traverseNode 函数递归来实现
function traverseNode(node, context) {
    console.log(node);
    // 1. element
    const nodeTransforms = context.nodeTransforms;
    // 收集退出函数
    const exitFns = [];
    // 循环遍历传入进来的函数
    for (let i = 0; i < nodeTransforms.length; i++) {
        const transform = nodeTransforms[i];
        const onExit = transform(node, context);
        if (onExit)
            exitFns.push(onExit);
    }
    switch (node.type) {
        case 0 /* NodeTypes.INTERPOLATION */:
            // 判断每个节点的类型，插值的时候就添加一下 toDisplayString
            context.helper(TO_DISPLAY_STRING);
            break;
        case 2 /* NodeTypes.ELEMENT */:
        case 4 /* NodeTypes.ROOT */:
            traverseChildren(node, context);
            break;
    }
    let i = exitFns.length;
    while (i--) {
        // 倒序循环执行退出函数
        exitFns[i]();
    }
}
function traverseChildren(node, context) {
    const children = node.children;
    if (children) {
        for (let i = 0; i < children.length; i++) {
            const node = children[i];
            traverseNode(node, context);
        }
    }
}

function baseCompile(template) {
    const ast = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText]
    });
    return generate(ast);
}

function compileToFunction(template) {
    const { code } = baseCompile(template);
    // function render(_ctx,_cache){ return _createElementVNode('div',null,'hi,'+_toDisplayString(_ctx.message))}
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}
// 把函数注入到 component.ts 中
registerRuntimeCompiler(compileToFunction);

export { createApp, createVNode as createElementVNode, createRenderer, createTextVNode, effect, getCurrentInstance, h, inject, isProxy, isReactive, isReadonly, isRef, nextTick, provide, proxyRefs, reactive, readonly, ref, registerRuntimeCompiler, renderSlots, shallowReadonly, toDisplayString, unRef };
