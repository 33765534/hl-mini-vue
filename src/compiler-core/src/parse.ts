import { NodeTypes } from "./ast";

const enum TagType {
    Start,
    End
}

export function baseParse(content: string) {
    const context = createParserContext(content)

    return createRoot(parseChildren(context, []))
}

function parseChildren(context, ancestors) {
    const nodes: any = [];
    while (!isEnd(context, ancestors)) {
        let node;
        const s = context.source;
        // startsWith() 方法用于检测字符串是否以指定的子字符串开始
        if (s.startsWith("{{")) {
            // parseChildren中 调用parseInterpolation创建node节点 然后push到nodes中并返回
            node = parseInterpolation(context);
        } else if (s[0] === "<") {
            // 判断字符串的第一个是不是<  再判断字符串第二个是不是a-z的字母正则/i 不区分大小写，如果是就是element类型
            if (/[a-z]/i.test(s[1])) {
                node = parseElement(context, ancestors)
            }
        }

        if (!node) {
            node = parseText(context)
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
                return true
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
            endIndex = index
        }
    }

    const content = parseTextData(context, endIndex);
    return {
        type: NodeTypes.TEXT,
        content
    }
}

function parseTextData(context, length) {
    const content = context.source.slice(0, length)

    // 删除处理完的内容
    advanceBy(context, length)
    return content;
}
function parseElement(context, ancestors) {
    const element: any = parseTag(context, TagType.Start);
    // 在解析children之前 收集 ancestors ，在parseChildren 处理完之后 弹出栈也就是 pop 
    ancestors.push(element);
    element.children = parseChildren(context, ancestors);
    ancestors.pop();

    if (startsWithEndTagOpen(context.source, element.tag)) {
        parseTag(context, TagType.End);
    } else {
        throw new Error(`缺少结束标签：${element.tag}`)
    }


    return element;
}

function parseTag(context: any, type: TagType) {
    // 1.解析 tag
    const match: any = /^<\/?([a-z]*)/i.exec(context.source)

    // 获取到标签值 如： div 
    const tag = match[1]
    // 2. 删除处理完的代码
    advanceBy(context, match[0].length);// <div 或者是</div
    advanceBy(context, 1);// 再把 > 删除

    if (type === TagType.End) return
    return {
        type: NodeTypes.ELEMENT,
        tag
    }
}

function parseInterpolation(context) {
    const openDelimiter = "{{";
    const closeDelimiter = "}}";

    const closeIndex = context.source.indexOf(
        closeDelimiter,
        openDelimiter.length
    )

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
        type: NodeTypes.INTERPOLATION,
        content: {
            type: NodeTypes.SIMPLE_EXPRESSION,
            content: content,
        }
    }
}

function advanceBy(context: any, length: number) {
    context.source = context.source.slice(length)
}

function createRoot(children) {
    // createRoot函数 返回children
    return {
        children,
        type: NodeTypes.ROOT
    }
}

function createParserContext(content) {
    // 返回一个对象source,后续都通过source来进行处理对象
    return {
        source: content
    }
}