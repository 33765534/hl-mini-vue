// 创建完vnode之后，我们创建render函数，接收一个vnode以及一个容器container

import { effect } from "../reactivity/effect"
import { EMPTY_OBJ, isObject } from "../shared"
import { ShapeFlags } from "./ShapeFlags"
import { createComponentInstance, setupComponent } from "./component"
import { createAppAPI } from "./createApp"
import { Fragment, Text } from "./vnode"

export function createRenderer(options) {
    const {
        createElement: hostCreateElement,
        patchProp: hostPatchProp,
        insert: hostInsert,
        remove: hostRemove,
        setElementText: hostSetElementText
    } = options

    // render函数主要是调用patch方法，方便我们递归调用
    function render(vnode, container) {
        patch(null, vnode, container, null, null)
    }

    // 调用 patch函数， patch函数 去处理组件 processComponent(vnode,container) 给它虚拟节点以及容器 
    function patch(n1: any, n2: any, container, parentComponent, anchor) {
        // 判断vnode 是不是一个element 
        // 如果是 element 那么应该处理element
        // processElement()
        const { type, shapeFlag } = n2
        switch (type) {
            case Fragment:
                processFragment(n1, n2, container, parentComponent, anchor);
                break;
            case Text:
                processText(n1, n2, container);
                break;
            default:
                if (shapeFlag & ShapeFlags.ELEMENT) {
                    processElement(n1, n2, container, parentComponent, anchor)
                } else if (shapeFlag & ShapeFlags.STATEFUL_COMPONENT) {
                    // 去处理组件
                    processComponent(n1, n2, container, parentComponent, anchor)
                }
                break;
        }

    }
    function processText(n1, n2, container) {
        const textVnode = (n2.el = document.createTextNode(n2.children))
        container.append(textVnode)
    }

    function processFragment(n1, n2, container, parentComponent, anchor) {
        mountChildren(n2.children, container, parentComponent, anchor)
    }

    function processElement(n1, n2, container, parentComponent, anchor) {
        // 当 n1 不存在时则是初始化 ，否则是更新
        if (!n1) {
            // 初始化 mountElement
            mountElement(n2, container, parentComponent, anchor)
        } else {

            patchElement(n1, n2, container, parentComponent, anchor)
        }
    }

    function patchElement(n1, n2, container, parentComponent, anchor) {

        const oldProps = n1.props || EMPTY_OBJ;
        const newProps = n2.props || EMPTY_OBJ;

        const el = (n2.el = n1.el)

        patchChildren(n1, n2, el, parentComponent, anchor);
        patchProps(el, oldProps, newProps)
    }

    function patchChildren(n1, n2, container, parentComponent, anchor) {
        const prevShapeFlage = n1.shapeFlag
        const c1 = n1.children
        const { shapeFlag } = n2
        const c2 = n2.children

        // 先判断 新的 shapeFlag 是不是text类型  TEXT_CHILDREN
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            if (prevShapeFlage & ShapeFlags.ARRAY_CHILDREN) {
                // 把老的 children 清空
                unmountChildren(n1.children)
            }
            if (c1 != c2) {
                hostSetElementText(container, c2)
            }
        } else {
            // 新的是 Array
            if (prevShapeFlage & ShapeFlags.TEXT_CHILDREN) {
                // 老的是 text
                // 先清空text
                hostSetElementText(container, "")
                // mountChildren
                mountChildren(c2, container, parentComponent, anchor)
            } else {
                // 老的也是 Array
                patchKeyedChildren(c1, c2, container, parentComponent, anchor)
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
                patch(n1, n2, container, parentComponent, anchor)
            } else {
                break;// 不相等就退出循环
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
                patch(n1, n2, container, parentComponent, anchor)
            } else {
                break;// 不相等就退出循环
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
                    patch(null, c2[i], container, parentComponent, anchor)
                    i++;
                }
            }
        } else if (i > e2) {
            while (i <= e1) {
                hostRemove(c1[i].el);
                i++
            }
        } else {
            // 中间对比
            let s1 = i;// 老的不同处起始位置
            let s2 = i;// 新的不同处起始位置
            const toBePatched = e2 - s2 + 1;// 新节点不同处的长度 
            let patched = 0;// 当前处理的数量
            const keyToNewIndexMap = new Map();// key的映射表
            // 新的索引和老的索引的映射表      定长性能更好点
            const newIndexToOldIndexMap = new Array(toBePatched);
            let moved = false;// 标记是否需要调用递增子序列函数
            let maxNewIndexSoFar = 0;
            for (let i = 0; i < toBePatched; i++) newIndexToOldIndexMap[i] = 0;// 初始化 还没有建立映射关系

            // 循环遍历新的
            for (let i = s2; i <= e2; i++) {
                // 获取到当前节点
                const nextChild = c2[i];
                keyToNewIndexMap.set(nextChild.key, i)
            }

            // 循环遍历老的
            let newIndex;
            for (let i = s1; i <= e1; i++) {
                // 获取到当前节点
                const prevChild = c1[i];
                // 处理的大于新的总数量
                if (patched >= toBePatched) {
                    hostRemove(prevChild.el);// 删除
                    continue;
                }
                if (prevChild.key != null) {
                    // 通过key 获取到索引
                    newIndex = keyToNewIndexMap.get(prevChild.key);
                } else {
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
                } else {
                    if (newIndex >= maxNewIndexSoFar) {
                        // 记录的点如果小于newIndex 则赋值
                        maxNewIndexSoFar = newIndex
                    } else {
                        moved = true;// 需要移动
                    }
                    // newIndex - s2 我们让索引从0开始
                    // i 有可能是0 0代表没有映射 所以我们+1
                    newIndexToOldIndexMap[newIndex - s2] = i + 1;
                    // 在新的里存在
                    patch(prevChild, c2[newIndex], container, processComponent, null);
                    patched++;// 处理完一个新的就加1
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
                } else if (moved) {
                    if (j < 0 || i !== increasingNewIndexSequence[j]) {
                        // 不在最长子序列中 则移动位置
                        hostInsert(nextChild.el, container, anchor)
                    } else { j--; }
                }

            }
        }
    }

    //  求出最长子序列[4,2,3,1,5] 的到索引[1,2,4]
    function getSequence(arr) {
        const p = arr.slice();
        const result = [0]
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
                    } else {
                        v = c;
                    }
                }
                if (arrI < arr[result[u]]) {
                    if (u > 0) {
                        p[i] = result[u - 1]
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
            const el = children[i].el
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
                    hostPatchProp(el, key, prevProp, nextProp)
                }
            }

            if (oldProps !== EMPTY_OBJ) {
                // 循环一下老的 props, 判断一下 key是不是在新的props里面
                for (const key in oldProps) {
                    if (!(key in newProps)) {
                        // 如果不在则调用hostPatchProp 传入当前新值是null 删除掉
                        hostPatchProp(el, key, oldProps[key], null)
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
        if (shapeFlag & ShapeFlags.TEXT_CHILDREN) {
            el.textContent = children;
        } else if (shapeFlag & ShapeFlags.ARRAY_CHILDREN) {
            // 如果是数组则遍历数组，然后调用patch重新判断，参数为vnode以及容器，此时容器是我们的父类节点 el
            mountChildren(vnode.children, el, parentComponent, anchor)
        }

        // props
        const { props } = vnode;
        for (const key in props) {
            const val = props[key];

            hostPatchProp(el, key, null, val)
        }

        // container.append(el)
        hostInsert(el, container, anchor)
    }

    function mountChildren(children, container, parentComponent, anchor) {
        children.forEach((v) => {
            patch(null, v, container, parentComponent, anchor)
        })
    }

    function processComponent(n1, n2, container, parentComponent, anchor) {
        mountComponent(n2, container, parentComponent, anchor)
    }

    // mountComponent 函数首先先通过虚拟节点创建一个组件实例对象 instance,因为组件本身有很多属性，所以可以抽离出一个组件实例instance
    function mountComponent(initialVNode, container, parentComponent, anchor) {
        const instance = createComponentInstance(initialVNode, parentComponent)

        // setupComponent(instance)去处理 props、slots、以及调用setup返回的一些值
        setupComponent(instance);

        setupRenderEffect(instance, initialVNode, container, anchor)
    }

    // setupRenderEffect(instance) 函数，调用render函数得到虚拟节点tree
    function setupRenderEffect(instance, initialVNode, container, anchor) {
        effect(() => {
            if (!instance.isMounted) {
                const { proxy } = instance
                // 绑定一下代理对象 当我们调用render的时候 把我们的代理对象绑定到 render函数的this上
                const subTree = (instance.subTree = instance.render.call(proxy))

                // vnode => patch
                // vnode => element => mountElement
                /**
                 * 得到虚拟节点之后再进一步调用 patch
                    我们现在虚拟节点是一种element类型然后下一步就是挂载 mountElement
                    调用patch时 我们需要传入容器
                 */
                patch(null, subTree, container, instance, anchor)

                // 所有的element都实例化处理完之后取el 
                initialVNode.el = subTree.el
                instance.isMounted = true
            } else {
                const { proxy } = instance
                const subTree = instance.render.call(proxy)
                const prevSubTree = instance.subTree
                // 获取到之前的subTree后 要把当前的赋值给  instance.subTree 这样下次进来就能获取到当前的vnode了
                instance.subTree = subTree

                patch(prevSubTree, subTree, container, instance, anchor)
            }

        })
    }

    return {
        createApp: createAppAPI(render)
    }
}