# Lava Lamp Widget

一个基于 WebGL 和流体物理引擎的高性能熔岩灯组件。它在浏览器中真实模拟了熔岩灯中液体的加热、上浮、冷却下沉以及融合（Metaballs）的物理过程。

本库无任何复杂的框架依赖（仅底层使用轻量级的 `twgl.js` 辅助 WebGL 渲染），提供开箱即用的单文件版本，并且同时支持原生 **Web Component** 和 **JavaScript API** 两种调用方式。

## ✨ 核心特性

- 🚀 **高性能渲染**：基于 WebGL 的 Metaballs 渲染方案，支持极度平滑的流体融合效果。
- 🧪 **真实的物理模拟**：内置轻量级物理引擎，精准模拟重力、浮力、液体粘度和容器壁反弹。
- ✋ **交互式惯性反馈**：支持拖拽交互！当你拖拽或晃动熔岩灯时，内部的流体会基于惯性产生真实的摇晃与波动。
- 🎨 **高度可定制**：从外观尺寸、背景颜色到熔岩（Wax）与液体（Liquid）的精准配色，再到物理引擎的细微参数（如温度、粘度），均可通过接口轻松配置。
- 📦 **开箱即用**：支持构建为单一的 `.js` 文件，无需繁琐的打包配置，通过 `<script>` 引入后即可在任何网页直接运行。
- 🧩 **框架无关**：原生支持 Web Components，轻松集成到 React, Vue, Angular 或纯静态 HTML 页面中。

## 📦 构建与安装

如果你想从源码构建或进行二次开发，请执行以下命令：

```bash
# 1. 安装依赖
npm install

# 2. 构建单文件（打包到 dist/ 目录）
npm run build
```

构建完成后，你会在 `dist/` 目录下找到：
- `lava-lamp-widget.js` (IIFE 格式，用于浏览器直接 `<script>` 引入，**推荐日常使用**)
- `lava-lamp-widget.esm.js` (ESModule 格式，用于现代工程化构建)

## 🚀 如何使用

只需引入打包好的 `dist/lava-lamp-widget.js` 文件，你就可以通过以下两种方式之一使用它。

### 方式一：作为原生 Web Component 使用（最简单）

这是最简单的使用方式，像写普通的 HTML 标签一样配置熔岩灯。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Lava Lamp Demo</title>
  <!-- 1. 引入单文件脚本 -->
  <script src="path/to/dist/lava-lamp-widget.js"></script>
</head>
<body style="background: #222; padding: 50px;">

  <!-- 2. 在 HTML 中直接使用标签并设置属性 -->
  <lava-lamp-widget 
    width="200" 
    height="500" 
    background-color="#101820">
  </lava-lamp-widget>

  <script>
    // 3. 注册自定义标签
    LavaLampWidget.defineCustomElement('lava-lamp-widget');
  </script>
</body>
</html>
```

### 方式二：使用 JavaScript API（适合动态控制与深度定制）

如果你需要更复杂的配置（如自定义物理引擎参数、拖拽响应等），或者想要在运行时动态控制熔岩灯（如调整温度），请使用此方式。

```html
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <title>Lava Lamp API Demo</title>
  <script src="path/to/dist/lava-lamp-widget.js"></script>
</head>
<body style="background: #222; padding: 50px;">

  <!-- 1. 准备一个占位容器 -->
  <div id="lamp-container"></div>

  <script>
    const container = document.getElementById('lamp-container');
    
    // 2. 挂载并传入高级配置
    const lampInstance = LavaLampWidget.mount(container, {
      width: 180,
      height: 450,
      draggable: true,             // 开启拖拽物理惯性反馈
      heat: 0.85,                  // 设置初始温度
      backgroundMode: 'custom',    // 启用自定义调色板
      palette: {
        wax: ['#ff5722'],            // 熔岩颜色（请使用十六进制并放进数组）
        liquid: ['#03a9f4']          // 液体颜色（请使用十六进制并放进数组）
      },
      physics: {
        gravity: 0.005,            // 重力
        viscosity: 0.8             // 粘度
      }
    });

    // 运行时你可以通过返回的实例动态改变状态：
    // 例如：3秒后让熔岩变热沸腾
    setTimeout(() => {
      lampInstance.setHeat(1.0);
    }, 3000);
  </script>
</body>
</html>
```

---

> 想要查看所有可用的配置项和实例方法，请参阅详细的 [API 文档](./API.md)。
