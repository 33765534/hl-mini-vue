import { NodeTypes } from "../ast";
import { isText } from "../utils";

export function transformText(node) {
    if (node.type === NodeTypes.ELEMENT) {
        const { children } = node;
        // 处理复合类型
        let currentContainer;// 创建容器
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
                                type: NodeTypes.COMPOUND_EXPRESSION,
                                children: [child]
                            }
                        }
                        currentContainer.children.push("+");// 拼接 + 以及相邻的后面的节点
                        currentContainer.children.push(next);
                        children.splice(j, 1);// 删除拼接过的数据
                        j--;// 删除后索引要减一
                    } else {
                        // 相邻的不是isText 则容器清空 进入下一个外层循环
                        currentContainer = undefined;
                        break;
                    }
                }
            }
        }

    }
}