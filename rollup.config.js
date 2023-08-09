// import pkg from "./package.json";
import typescript from "@rollup/plugin-typescript";

export default {
  input: "./src/index.ts", // 入口文件
  output: [
    // 打包出两个模块规范
    // 1.cjs->commonjs   file: pkg.main,
    // 2.esm  file: pkg.module,
    {
      format: "cjs",
      file: "lib/guide-mini-vue.cjs.js",
    },
    {
      format: "es",
      file: "lib/guide-mini-vue.esm.js",
    },
  ],
  // 如果用ts写的就需要配置一下plugins,
  // 编译的时候需要用到的插件 npm i @rollup/plugin-typescript
  plugins: [typescript()],
};
