import { NodeTypes } from "./ast";

const enum TagType {
    Start,
    End
}

export function baseParse(content: string) {
    const context = createParserContext(content)

    return createRoot(parseChildren(context))
}

function parseChildren(context) {
    const nodes: any = [];
    let node;
    const s = context.source;
    // startsWith() 方法用于检测字符串是否以指定的子字符串开始
    if (s.startsWith("{{")) {
        // parseChildren中 调用parseInterpolation创建node节点 然后push到nodes中并返回
        node = parseInterpolation(context);
    } else if (s[0] === "<") {
        // 判断字符串的第一个是不是<  再判断字符串第二个是不是a-z的字母正则/i 不区分大小写，如果是就是element类型
        if (/[a-z]/i.test(s[1])) {
            node = parseElement(context)
        }
    }

    if (!node) {
        node = parseText(context)
    }

    nodes.push(node);
    return nodes;
}

function parseText(context) {
    const content = parseTextData(context, context.source.length);
    return {
        type: NodeTypes.TEXT,
        content
    }
}

function parseTextData(context, length) {
    const content = context.source.slice(0, length)

    debugger
    // 删除处理完的内容
    advanceBy(context, length)
    return content;
}
function parseElement(context) {
    const element = parseTag(context, TagType.Start);

    parseTag(context, TagType.End);

    return element;
}

function parseTag(context: any, type: TagType) {
    // 1.解析 tag
    const match: any = /^\/?<([a-z]*)/i.exec(context.source)
    // 获取到标签值 如： div 
    const tag = match[1]
    // 2. 删除处理完的代码
    advanceBy(context, match[0].length);// <div 或者是</div
    advanceBy(context, 1);// 再把 > 删除

    if (type === TagType.End) return
    return {
        type: NodeTypes.ELEMENT,
        tag: "div"
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
        children
    }
}

function createParserContext(content) {
    // 返回一个对象source,后续都通过source来进行处理对象
    return {
        source: content
    }
}