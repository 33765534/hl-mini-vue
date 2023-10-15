export * from './runtime-dom'
import { baseCompile } from './compiler-core/src'
import * as runtimeDom from './runtime-dom';
import { registerRuntimeCompiler } from './runtime-dom';


function compileToFunction(template) {
    const { code } = baseCompile(template);
    // function render(_ctx,_cache){ return _createElementVNode('div',null,'hi,'+_toDisplayString(_ctx.message))}
    const render = new Function("Vue", code)(runtimeDom);
    return render;
}

// 把函数注入到 component.ts 中
registerRuntimeCompiler(compileToFunction);