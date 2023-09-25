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
                tag: "div"
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
    })
})