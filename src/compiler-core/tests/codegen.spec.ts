import { transform } from "../src/transform";
import { baseParse } from "../src/parse";
import { generate } from "../src/codegen";
import { transformExpression } from "../src/transforms/transformExpression";
import { transformElement } from "../src/transforms/transformElement";
import { transformText } from "../src/transforms/transformText";

describe("codegen", () => {
    test("string", () => {
        const ast = baseParse("hi");

        transform(ast);
        const { code } = generate(ast);

        // 快照  1. 抓bug 2.有意的
        // 使用快照测试，相当于 给我们的 code 拍个照片，后续我们就会对比两个照片是否相同
        expect(code).toMatchSnapshot();
    });
    test("interpolation", () => {
        const ast = baseParse("{{message}}");

        transform(ast, {
            nodeTransforms: [transformExpression]
        });
        const { code } = generate(ast);

        expect(code).toMatchSnapshot();
    });

    test("element", () => {
        const ast = baseParse("<div>hi,{{message}}</div>");

        transform(ast, {
            nodeTransforms: [transformExpression, transformElement, transformText]
        });
        const { code } = generate(ast);

        expect(code).toMatchSnapshot();
    });
});