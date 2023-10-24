import { App } from "./App.js";
import { createRenderer } from "../../lib/guide-mini-vue.esm.js";

const game = new PIXI.Application({
  width: 500,
  height: 500,
});
document.body.append(game.view);

const renderer = createRenderer({
  createElement(type) {
    if (type === "rect") {
      // new PIXI.Graphics()创建一个矩形
      const rect = new PIXI.Graphics();
      rect.beginFill(0xff0000); // 颜色
      rect.drawRect(0, 0, 100, 100); // 绘制
      rect.endFill();
      return rect;
    }
  },
  patchProp(el, key, val) {
    el[key] = val;
  },
  insert(el, parent) {
    parent.addChild(el);
  },
});

// game.stage 可获取到跟容器
renderer.createApp(App).mount(game.stage);
