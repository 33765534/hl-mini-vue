import { NodeTypes } from "../src/ast";
import { baseParse } from "../src/parse";

describe("Parse", () => {
    describe("interpolation", () => {
        test("simple interpolation", () => {
            const ast = baseParse("{{message}}");

            // toStrictEqual希望它的结构是这样的
            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.INTERPOLATION,
                content: {
                    type: NodeTypes.SIMPLE_EXPRESSION,
                    content: "message",
                }
            })
        })
    })

    describe("element", () => {
        test("simple element div", () => {
            const ast = baseParse("<div></div>");

            // toStrictEqual希望它的结构是这样的
            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.ELEMENT,
                tag: "div",
                children: []
            })
        })
    })
    describe("text", () => {
        test("simple text", () => {
            const ast = baseParse("some text");

            // toStrictEqual希望它的结构是这样的
            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.TEXT,
                content: "some text"
            })
        })

        test("hello world", () => {
            const ast = baseParse("<p>hi,{{message}}</p>");

            // toStrictEqual希望它的结构是这样的
            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.ELEMENT,
                tag: "p",
                children: [
                    {
                        type: NodeTypes.TEXT,
                        content: "hi,"
                    },
                    {
                        type: NodeTypes.INTERPOLATION,
                        content: {
                            type: NodeTypes.SIMPLE_EXPRESSION,
                            content: "message",
                        }
                    }
                ]
            })
        })

        test("Nested element", () => {
            const ast = baseParse("<div><p>hi</p>{{message}}</div>");

            // 嵌套标签结构
            expect(ast.children[0]).toStrictEqual({
                type: NodeTypes.ELEMENT,
                tag: "div",
                children: [
                    {
                        type: NodeTypes.ELEMENT,
                        tag: "p",
                        children: [
                            {
                                type: NodeTypes.TEXT,
                                content: "hi"
                            },
                        ]
                    },
                    {
                        type: NodeTypes.INTERPOLATION,
                        content: {
                            type: NodeTypes.SIMPLE_EXPRESSION,
                            content: "message",
                        }
                    }
                ]
            })
        })

        test("should throw error when lack end tag", () => {
            expect(() => {
                baseParse("<div><span></div>")
            }).toThrow("缺少结束标签：span")
        })
    })
})