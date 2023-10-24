import { baseParse } from "./parse";
import { transformExpression } from "./transforms/transformExpression";
import { transformElement } from "./transforms/transformElement";
import { transformText } from "./transforms/transformText";
import { generate } from "./codegen";
import { transform } from "./transform";

export function baseCompile(template) {
    const ast: any = baseParse(template);
    transform(ast, {
        nodeTransforms: [transformExpression, transformElement, transformText]
    });
    return generate(ast);
}