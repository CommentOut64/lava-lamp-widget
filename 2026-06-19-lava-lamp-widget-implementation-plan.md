# Lava Lamp Widget Implementation Plan

> **For agentic workers:** REQUIRED: Use superpowers:subagent-driven-development (if subagents available) or superpowers:executing-plans to implement this plan. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 构建一个可嵌入任意网页位置、运行时零依赖、纯 JavaScript 的熔岩灯小组件，支持逼真的热驱动 blob 流动、融合分裂、背景自适应、拖动惯性和移动端稳定显示。

**Architecture:** 采用“热驱动粒子场 + 空间哈希近邻查询 + Marching Squares 等值面 + Canvas 2D 分层渲染”的混合方案。运行时同时提供 imperative mount API 和自定义元素入口，核心模拟与渲染完全复用同一套内核，避免框架耦合和重复状态管理。

**Tech Stack:** Vanilla JavaScript (ES2022), Canvas 2D, Web Components, Pointer Events, ResizeObserver, Page Visibility API, Node.js 20+（构建脚本与单元测试）, Playwright（仅开发期 E2E 测试，运行时不进入产物）

---

## 1. 范围与硬约束

- 运行时代码必须零第三方依赖，最终交付物至少包含 `dist/lava-lamp-widget.js` 一个可直接通过 `<script>` 引入的文件。
- 组件必须可在普通 HTML、React、Vue、Svelte、Angular、CMS 富文本挂件等任意 Web 宿主中嵌入。
- 视觉目标是“像真熔岩灯”，不是科研级真实流体求解；物理语义允许近似，但观感必须稳定可信。
- 必须支持：
  - imperative API 挂载
  - `<lava-lamp-widget>` 自定义元素
  - 运行时改色、改热度、改质量档位
  - 自动背景模式和手动主题模式
  - 内建拖拽和外部注入容器运动
  - 移动端显示与交互
- 本计划默认开发环境为 Windows。
- 本计划不包含自动 commit 步骤；代码提交由 wgh 手动执行。

## 2. 非目标

- 不实现严格 SPH/Navier-Stokes 全场流体求解。
- 不依赖 WebGL 作为主渲染路径。
- 不对任意视频/图片背景做像素级真实折射采样。
- 不做无限可配置的容器形状系统，首版只支持竖向 capsule 灯腔。
- 不提供逐帧高频事件总线，避免业务误用导致主线程过载。

## 3. 交付物

- `dist/lava-lamp-widget.js`
  - IIFE 格式
  - 暴露 `window.LavaLampWidget`
  - 自动提供 `defineCustomElement()`
- `dist/lava-lamp-widget.esm.js`
  - ESM 格式
  - 导出 `mount`, `defineCustomElement`, `defaults`
- 示例页面
  - imperative 挂载示例
  - custom element 示例
  - 移动端尺寸与主题示例
- 自动化测试
  - Node 单元测试
  - Playwright 浏览器集成测试
- 开发文档
  - README
  - API 说明
  - 调参说明

## 4. 技术决策

### 4.1 为什么不选重流体

- 严格流体求解在“纯 JS + 零运行时依赖 + 小体积 + 移动端稳定”的约束下 ROI 过低。
- 熔岩灯的“真实感”主要来自以下几个现象，而不是完整流体方程：
  - 底部受热后逐渐鼓包并脱离
  - 上升 blob 在顶部冷却后减速、收缩、回落
  - blob 之间自然融合分裂
  - 拖动灯体时内部物质表现出滞后、撞壁和余振
- 以上现象更适合用近似物理 + 等值面渲染高性价比实现。

### 4.2 核心物理模型

- 粒子数：
  - 桌面默认 `48`
  - 移动端默认 `32`
  - 高质量档上限 `72`
- 每个粒子状态：
  - `x`, `y`
  - `vx`, `vy`
  - `radius`
  - `mass`
  - `temperature`
  - `viscosityFactor`
  - `phase`
- 每帧物理效应：
  - 重力
  - 热浮力
  - 局部热扩散
  - 粘度阻尼
  - 近邻短程排斥
  - 近邻中程吸引
  - 边界碰撞
  - 容器运动反向惯性

### 4.3 渲染模型

- 使用 Canvas 2D。
- 先在低分辨率采样网格生成标量场，再用 Marching Squares 提取等值面。
- 分四层渲染：
  - 液体背景层
  - blob 主体层
  - 玻璃高光层
  - 接触阴影层
- 默认容器形状为竖向 capsule，便于碰撞检测和视觉稳定。

## 5. 默认 API 合同

```js
const instance = LavaLampWidget.mount(container, {
  width: 260,
  height: 520,
  palette: {
    wax: ['#ff7a18', '#ffb347'],
    liquid: ['#13293d', '#1f4e5f'],
  },
  physics: {
    heat: 0.72,
    gravity: 0.26,
    buoyancy: 0.58,
    viscosity: 0.46,
  },
  quality: 'auto',
  backgroundMode: 'auto',
  draggable: true,
});

instance.pause();
instance.resume();
instance.setOptions({ quality: 'high' });
instance.setPalette({ wax: ['#47c7ff', '#a2f5ff'] });
instance.setHeat(0.85);
instance.shake({ x: 18, y: -6, strength: 1.2 });
instance.setContainerMotion({ x: 120, y: 60, vx: 300, vy: -80, ax: 800, ay: 0 });
instance.destroy();
```

```html
<lava-lamp-widget
  width="260"
  height="520"
  quality="auto"
  background-mode="auto"
  draggable
></lava-lamp-widget>
```

## 6. 文件结构与职责

```text
F:\lava-lamp\
  package.json
  README.md
  scripts\
    build.mjs
    serve.mjs
    verify-dist.mjs
  src\
    index.js
    defaults.js
    core\
      math.js
      thermal-field.js
      spatial-hash.js
      container-motion.js
      particle-system.js
      reservoir.js
    render\
      scalar-field.js
      marching-squares.js
      palette.js
      canvas-renderer.js
    widget\
      lava-lamp-instance.js
      custom-element.js
      drag-controller.js
      dom.js
  dist\
  examples\
    imperative.html
    custom-element.html
    mobile.html
  tests\
    unit\
      public-api.test.mjs
      thermal-field.test.mjs
      spatial-hash.test.mjs
      particle-system.test.mjs
      reservoir.test.mjs
      scalar-field.test.mjs
      marching-squares.test.mjs
      palette.test.mjs
    e2e\
      imperative.spec.ts
      custom-element.spec.ts
      drag-motion.spec.ts
```

### 6.1 文件边界说明

- `src/index.js`
  - 公开 API 聚合入口
  - 导出 `mount`, `defineCustomElement`, `defaults`
- `src/defaults.js`
  - 默认参数与质量档映射
- `src/core/*`
  - 纯计算逻辑
  - 不允许直接访问 DOM 或 Canvas
- `src/render/*`
  - 标量场、等值面、主题计算和 Canvas 绘制
- `src/widget/*`
  - DOM 挂载、生命周期、拖拽控制、自定义元素桥接
- `scripts/build.mjs`
  - 生成 `dist/lava-lamp-widget.js` 与 `dist/lava-lamp-widget.esm.js`
- `scripts/serve.mjs`
  - 本地静态服务器，供示例页和 Playwright 使用
- `tests/unit/*`
  - 纯模块单测，使用 Node 内置 `node:test`
- `tests/e2e/*`
  - 浏览器集成测试，验证挂载、主题、拖拽和销毁

## 7. 默认参数建议

| 参数 | 默认值 | 说明 |
|---|---:|---|
| `width` | `260` | 默认宽度 |
| `height` | `520` | 默认高度 |
| `physics.heat` | `0.72` | 底部加热强度 |
| `physics.gravity` | `0.26` | 全局重力 |
| `physics.buoyancy` | `0.58` | 温度转浮力系数 |
| `physics.viscosity` | `0.46` | 基础粘度 |
| `physics.wallBounce` | `0.34` | 撞壁回弹系数 |
| `physics.dragImpulse` | `1.0` | 容器拖动惯性强度 |
| `quality` | `auto` | 自动按设备档位降级 |
| `backgroundMode` | `auto` | 自动亮暗背景识别 |
| `draggable` | `true` | 默认允许拖动 |
| `particleCount` | 设备自适应 | 桌面 48 / 移动端 32 |
| `fieldCellSize` | 设备自适应 | low 10 / medium 8 / high 6 |

## Chunk 1: 基础骨架与公共合同

### Task 1: 建立项目骨架与公开 API 合同

**Files:**
- Create: `F:\lava-lamp\package.json`
- Create: `F:\lava-lamp\src\index.js`
- Create: `F:\lava-lamp\src\defaults.js`
- Create: `F:\lava-lamp\src\widget\lava-lamp-instance.js`
- Test: `F:\lava-lamp\tests\unit\public-api.test.mjs`

- [ ] **Step 1: 先写公开 API 失败测试**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { mount, defineCustomElement, defaults } from '../../src/index.js';

test('public api exports stable entry points', () => {
  assert.equal(typeof mount, 'function');
  assert.equal(typeof defineCustomElement, 'function');
  assert.equal(typeof defaults, 'object');
  assert.equal(defaults.quality, 'auto');
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/unit/public-api.test.mjs`
Expected: FAIL，提示 `Cannot find module '../../src/index.js'` 或导出缺失。

- [ ] **Step 3: 用最小代码补齐导出**

```js
// src/index.js
import { defaults } from './defaults.js';
import { LavaLampInstance } from './widget/lava-lamp-instance.js';

export { defaults };

export function mount(container, options = {}) {
  const instance = new LavaLampInstance(container, options);
  instance.mount();
  return instance;
}

export function defineCustomElement(tagName = 'lava-lamp-widget') {
  // 先返回 tagName，后续任务再补完整实现
  return tagName;
}
```

- [ ] **Step 4: 再跑测试确认通过**

Run: `node --test tests/unit/public-api.test.mjs`
Expected: PASS

- [ ] **Step 5: 整理变更，等待 wgh 手动提交**

### Task 2: 建立构建与本地预览通道

**Files:**
- Create: `F:\lava-lamp\scripts\build.mjs`
- Create: `F:\lava-lamp\scripts\serve.mjs`
- Create: `F:\lava-lamp\scripts\verify-dist.mjs`
- Create: `F:\lava-lamp\examples\imperative.html`
- Modify: `F:\lava-lamp\package.json`
- Test: `F:\lava-lamp\tests\unit\public-api.test.mjs`

- [ ] **Step 1: 写构建产物存在性测试**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('dist bundle exposes global entry', async () => {
  const code = await readFile(new URL('../../dist/lava-lamp-widget.js', import.meta.url), 'utf8');
  assert.match(code, /window\.LavaLampWidget/);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/unit/public-api.test.mjs`
Expected: FAIL，提示 `dist/lava-lamp-widget.js` 不存在。

- [ ] **Step 3: 实现最小构建脚本和本地静态服务器**

```js
// scripts/build.mjs
import { mkdir, readFile, writeFile } from 'node:fs/promises';

const entry = await readFile(new URL('../src/index.js', import.meta.url), 'utf8');
await mkdir(new URL('../dist/', import.meta.url), { recursive: true });
await writeFile(new URL('../dist/lava-lamp-widget.esm.js', import.meta.url), entry);
await writeFile(
  new URL('../dist/lava-lamp-widget.js', import.meta.url),
  `window.LavaLampWidget=(function(){${entry}\nreturn { mount, defineCustomElement, defaults };})();`
);
```

- [ ] **Step 4: 执行构建并重跑测试**

Run: `node scripts/build.mjs`
Expected: 生成 `dist/lava-lamp-widget.js` 和 `dist/lava-lamp-widget.esm.js`

Run: `node --test tests/unit/public-api.test.mjs`
Expected: PASS

- [ ] **Step 5: 启动本地静态服务验证示例页能打开**

Run: `node scripts/serve.mjs`
Expected: 控制台输出 `http://127.0.0.1:4173`

- [ ] **Step 6: 整理变更，等待 wgh 手动提交**

## Chunk 2: 纯计算内核

### Task 3: 实现热场与背景温差模型

**Files:**
- Create: `F:\lava-lamp\src\core\thermal-field.js`
- Test: `F:\lava-lamp\tests\unit\thermal-field.test.mjs`

- [ ] **Step 1: 先写热场失败测试**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { sampleTemperature } from '../../src/core/thermal-field.js';

test('bottom area is hotter than top area', () => {
  const bottom = sampleTemperature({ x: 100, y: 460 }, { width: 260, height: 520, heat: 0.72 });
  const top = sampleTemperature({ x: 100, y: 40 }, { width: 260, height: 520, heat: 0.72 });
  assert.ok(bottom > top);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `node --test tests/unit/thermal-field.test.mjs`
Expected: FAIL，模块不存在。

- [ ] **Step 3: 写最小实现**

```js
export function sampleTemperature(point, config) {
  const vertical = 1 - point.y / config.height;
  const heatBand = Math.max(0, 1 - point.y / (config.height * 0.22));
  const coolBand = Math.max(0, (point.y - config.height * 0.78) / (config.height * 0.22));
  return config.heat * 0.75 + heatBand * 0.55 - coolBand * 0.35 - vertical * 0.1;
}
```

- [ ] **Step 4: 跑测试确认通过**

Run: `node --test tests/unit/thermal-field.test.mjs`
Expected: PASS

- [ ] **Step 5: 补第二个测试，验证中心区温度平滑变化**

```js
test('temperature changes smoothly in vertical direction', () => {
  const a = sampleTemperature({ x: 130, y: 260 }, { width: 260, height: 520, heat: 0.72 });
  const b = sampleTemperature({ x: 130, y: 270 }, { width: 260, height: 520, heat: 0.72 });
  assert.ok(Math.abs(a - b) < 0.05);
});
```

- [ ] **Step 6: 整理变更，等待 wgh 手动提交**

### Task 4: 实现空间哈希与近邻查询

**Files:**
- Create: `F:\lava-lamp\src\core\spatial-hash.js`
- Test: `F:\lava-lamp\tests\unit\spatial-hash.test.mjs`

- [ ] **Step 1: 先写失败测试**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { SpatialHash } from '../../src/core/spatial-hash.js';

test('neighbor query returns local particles only', () => {
  const hash = new SpatialHash(32);
  hash.insert({ id: 'a', x: 10, y: 10 });
  hash.insert({ id: 'b', x: 18, y: 12 });
  hash.insert({ id: 'c', x: 140, y: 140 });
  const neighbors = hash.query({ x: 12, y: 10 }, 24).map((item) => item.id).sort();
  assert.deepEqual(neighbors, ['a', 'b']);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tests/unit/spatial-hash.test.mjs`
Expected: FAIL

- [ ] **Step 3: 实现空间哈希**

```js
export class SpatialHash {
  constructor(cellSize) {
    this.cellSize = cellSize;
    this.cells = new Map();
  }

  key(x, y) {
    return `${Math.floor(x / this.cellSize)},${Math.floor(y / this.cellSize)}`;
  }

  insert(item) {
    const key = this.key(item.x, item.y);
    const bucket = this.cells.get(key) ?? [];
    bucket.push(item);
    this.cells.set(key, bucket);
  }

  query(point, radius) {
    const hits = [];
    // 后续任务再补完整邻域遍历；先满足测试
    return hits;
  }
}
```

- [ ] **Step 4: 补完邻域遍历并让测试通过**

Run: `node --test tests/unit/spatial-hash.test.mjs`
Expected: PASS

- [ ] **Step 5: 再加一个测试，验证边界 cell 不漏粒子**

Run: `node --test tests/unit/spatial-hash.test.mjs`
Expected: PASS

- [ ] **Step 6: 整理变更，等待 wgh 手动提交**

### Task 5: 实现容器运动映射与粒子积分器

**Files:**
- Create: `F:\lava-lamp\src\core\container-motion.js`
- Create: `F:\lava-lamp\src\core\particle-system.js`
- Test: `F:\lava-lamp\tests\unit\particle-system.test.mjs`

- [ ] **Step 1: 先写失败测试，锁定拖拽惯性合同**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { deriveInertialImpulse } from '../../src/core/container-motion.js';

test('container acceleration produces opposite inertial impulse', () => {
  const impulse = deriveInertialImpulse({ ax: 600, ay: -120 }, { dragImpulse: 1.0 });
  assert.ok(impulse.x < 0);
  assert.ok(impulse.y > 0);
});
```

- [ ] **Step 2: 增加失败测试，锁定粒子撞壁后不出界**

```js
import { stepParticles } from '../../src/core/particle-system.js';

test('particles stay inside capsule boundary after step', () => {
  const particles = [{ x: 245, y: 60, vx: 120, vy: -20, radius: 18, temperature: 0.8, mass: 1 }];
  const next = stepParticles(particles, {
    dt: 1 / 60,
    width: 260,
    height: 520,
    gravity: 0.26,
    buoyancy: 0.58,
    viscosity: 0.46,
    wallBounce: 0.34,
    inertialImpulse: { x: 0, y: 0 },
  });
  assert.ok(next[0].x <= 242);
});
```

- [ ] **Step 3: 跑测试确认失败**

Run: `node --test tests/unit/particle-system.test.mjs`
Expected: FAIL

- [ ] **Step 4: 先补容器惯性映射**

```js
export function deriveInertialImpulse(motion, physics) {
  return {
    x: -motion.ax * physics.dragImpulse * 0.0015,
    y: -motion.ay * physics.dragImpulse * 0.0015,
  };
}
```

- [ ] **Step 5: 再补最小粒子积分器**

实现要求：
- 固定时间步长
- 先加速度，后速度，后位置
- 温度影响 `vy`
- 粘度影响速度衰减
- 统一在 capsule 边界内做位置投影和反弹

- [ ] **Step 6: 跑测试直到通过**

Run: `node --test tests/unit/particle-system.test.mjs`
Expected: PASS

- [ ] **Step 7: 新增测试，验证热粒子比冷粒子更容易上浮**

Run: `node --test tests/unit/particle-system.test.mjs`
Expected: PASS

- [ ] **Step 8: 整理变更，等待 wgh 手动提交**

### Task 6: 实现底部储蜡区与脱落机制

**Files:**
- Create: `F:\lava-lamp\src\core\reservoir.js`
- Modify: `F:\lava-lamp\src\core\particle-system.js`
- Test: `F:\lava-lamp\tests\unit\reservoir.test.mjs`

- [ ] **Step 1: 写失败测试，锁定“底部有蜡池”行为**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnReservoirParticles, shouldDetachBlob } from '../../src/core/reservoir.js';

test('reservoir particles start near lamp bottom', () => {
  const particles = spawnReservoirParticles({ width: 260, height: 520, count: 8 });
  assert.ok(particles.every((p) => p.y > 520 * 0.72));
});

test('hot reservoir section can detach', () => {
  assert.equal(
    shouldDetachBlob({ averageTemperature: 0.82, upwardPressure: 0.68, viscosity: 0.22 }),
    true
  );
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tests/unit/reservoir.test.mjs`
Expected: FAIL

- [ ] **Step 3: 实现最小储蜡区模型**

实现要求：
- 初始粒子大部分落在底部 28% 区间
- 允许局部鼓包脱离
- 已下落回底部的冷 blob 可以重新并入储蜡区

- [ ] **Step 4: 跑测试直到通过**

Run: `node --test tests/unit/reservoir.test.mjs`
Expected: PASS

- [ ] **Step 5: 在 `particle-system.js` 接入储蜡区逻辑**

Run: `node --test tests/unit/particle-system.test.mjs tests/unit/reservoir.test.mjs`
Expected: PASS

- [ ] **Step 6: 整理变更，等待 wgh 手动提交**

## Chunk 3: 渲染与主题系统

### Task 7: 实现标量场采样与 blob 场强累积

**Files:**
- Create: `F:\lava-lamp\src\render\scalar-field.js`
- Test: `F:\lava-lamp\tests\unit\scalar-field.test.mjs`

- [ ] **Step 1: 写失败测试**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { buildScalarField } from '../../src/render/scalar-field.js';

test('nearby particles build stronger field than distant cells', () => {
  const field = buildScalarField(
    [{ x: 100, y: 100, radius: 24 }, { x: 120, y: 110, radius: 22 }],
    { width: 260, height: 520, cellSize: 10 }
  );
  assert.ok(field.sample(110, 110) > field.sample(220, 220));
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tests/unit/scalar-field.test.mjs`
Expected: FAIL

- [ ] **Step 3: 实现最小场构建函数**

实现要求：
- 网格采样
- 粒子 radius 影响场强衰减
- 支持阈值配置

- [ ] **Step 4: 跑测试直到通过**

Run: `node --test tests/unit/scalar-field.test.mjs`
Expected: PASS

- [ ] **Step 5: 再加测试，验证更大的粒子产生更宽的势场**

Run: `node --test tests/unit/scalar-field.test.mjs`
Expected: PASS

- [ ] **Step 6: 整理变更，等待 wgh 手动提交**

### Task 8: 实现 Marching Squares 等值面

**Files:**
- Create: `F:\lava-lamp\src\render\marching-squares.js`
- Test: `F:\lava-lamp\tests\unit\marching-squares.test.mjs`

- [ ] **Step 1: 写失败测试，锁定融合轮廓**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { extractContours } from '../../src/render/marching-squares.js';

test('two overlapping blobs create at least one contour', () => {
  const contours = extractContours({
    width: 4,
    height: 4,
    threshold: 1,
    values: [
      0, 0.4, 0.6, 0,
      0.2, 1.2, 1.4, 0.3,
      0.1, 1.1, 1.3, 0.2,
      0, 0.2, 0.3, 0,
    ],
  });
  assert.ok(contours.length >= 1);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tests/unit/marching-squares.test.mjs`
Expected: FAIL

- [ ] **Step 3: 实现等值面提取**

实现要求：
- 支持 16 种 cell case
- 输出闭合轮廓点列
- 避免重复 segment

- [ ] **Step 4: 跑测试直到通过**

Run: `node --test tests/unit/marching-squares.test.mjs`
Expected: PASS

- [ ] **Step 5: 新增测试，验证边界 case 不崩溃**

Run: `node --test tests/unit/marching-squares.test.mjs`
Expected: PASS

- [ ] **Step 6: 整理变更，等待 wgh 手动提交**

### Task 9: 实现调色板、亮暗背景适配与 Canvas 分层渲染

**Files:**
- Create: `F:\lava-lamp\src\render\palette.js`
- Create: `F:\lava-lamp\src\render\canvas-renderer.js`
- Test: `F:\lava-lamp\tests\unit\palette.test.mjs`
- Modify: `F:\lava-lamp\examples\imperative.html`

- [ ] **Step 1: 写失败测试，锁定自动主题行为**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { resolveTheme } from '../../src/render/palette.js';

test('dark background yields stronger glass highlight contrast', () => {
  const dark = resolveTheme({ backgroundMode: 'auto', backgroundColor: '#101820' });
  const light = resolveTheme({ backgroundMode: 'auto', backgroundColor: '#f4efe8' });
  assert.ok(dark.glassEdgeAlpha > light.glassEdgeAlpha);
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `node --test tests/unit/palette.test.mjs`
Expected: FAIL

- [ ] **Step 3: 先实现 `resolveTheme()`**

实现要求：
- 计算背景亮度
- 输出 blob、液体、玻璃高光、投影透明度
- 支持 `auto | light | dark | custom`

- [ ] **Step 4: 再实现 CanvasRenderer**

实现要求：
- 渲染顺序固定为：液体背景 -> blob -> 高光 -> 阴影
- 支持 DPR 钳制
- 支持 quality 档位切换

- [ ] **Step 5: 跑测试直到通过**

Run: `node --test tests/unit/palette.test.mjs`
Expected: PASS

- [ ] **Step 6: 手工打开示例页观察**

Run: `node scripts/serve.mjs`
Expected: 在 `examples/imperative.html` 中能看到有玻璃高光和 blob 主体，但交互可以暂时未完成。

- [ ] **Step 7: 整理变更，等待 wgh 手动提交**

## Chunk 4: 组件壳层与交互

### Task 10: 组装 `LavaLampInstance` 生命周期

**Files:**
- Modify: `F:\lava-lamp\src\widget\lava-lamp-instance.js`
- Create: `F:\lava-lamp\src\widget\dom.js`
- Modify: `F:\lava-lamp\src\index.js`
- Test: `F:\lava-lamp\tests\e2e\imperative.spec.ts`

- [ ] **Step 1: 写 E2E 失败测试，锁定 imperative mount**

```ts
import { test, expect } from '@playwright/test';

test('imperative mount renders a canvas into host container', async ({ page }) => {
  await page.goto('/examples/imperative.html');
  await expect(page.locator('[data-test-id="lava-host"] canvas')).toHaveCount(1);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx playwright test tests/e2e/imperative.spec.ts`
Expected: FAIL，找不到 canvas。

- [ ] **Step 3: 实现实例生命周期**

实现要求：
- `mount()`
- `pause()`
- `resume()`
- `setOptions()`
- `destroy()`
- `getMetrics()`
- 内部用 `requestAnimationFrame`
- 页面隐藏时降频或暂停

- [ ] **Step 4: 跑 E2E 直到通过**

Run: `npx playwright test tests/e2e/imperative.spec.ts`
Expected: PASS

- [ ] **Step 5: 整理变更，等待 wgh 手动提交**

### Task 11: 实现自定义元素桥接

**Files:**
- Create: `F:\lava-lamp\src\widget\custom-element.js`
- Modify: `F:\lava-lamp\src\index.js`
- Create: `F:\lava-lamp\examples\custom-element.html`
- Test: `F:\lava-lamp\tests\e2e\custom-element.spec.ts`

- [ ] **Step 1: 写失败测试**

```ts
import { test, expect } from '@playwright/test';

test('custom element auto boots and renders canvas', async ({ page }) => {
  await page.goto('/examples/custom-element.html');
  await expect(page.locator('lava-lamp-widget canvas')).toHaveCount(1);
});
```

- [ ] **Step 2: 运行测试确认失败**

Run: `npx playwright test tests/e2e/custom-element.spec.ts`
Expected: FAIL

- [ ] **Step 3: 实现 custom element**

实现要求：
- `connectedCallback()` 自动 mount
- `disconnectedCallback()` 自动 destroy
- 属性映射到配置项
- 避免重复定义同名 custom element

- [ ] **Step 4: 跑测试直到通过**

Run: `npx playwright test tests/e2e/custom-element.spec.ts`
Expected: PASS

- [ ] **Step 5: 整理变更，等待 wgh 手动提交**

### Task 12: 实现拖拽控制与内部惯性反馈

**Files:**
- Create: `F:\lava-lamp\src\widget\drag-controller.js`
- Modify: `F:\lava-lamp\src\widget\lava-lamp-instance.js`
- Create: `F:\lava-lamp\examples\mobile.html`
- Test: `F:\lava-lamp\tests\e2e\drag-motion.spec.ts`

- [ ] **Step 1: 写失败测试，锁定拖动后容器位移**

```ts
import { test, expect } from '@playwright/test';

test('dragging widget changes host transform and updates motion metrics', async ({ page }) => {
  await page.goto('/examples/imperative.html');
  const host = page.locator('[data-test-id="lava-host"]');
  const box = await host.boundingBox();
  if (!box) throw new Error('host not found');
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.mouse.down();
  await page.mouse.move(box.x + box.width / 2 + 80, box.y + box.height / 2 + 20);
  await page.mouse.up();
  await expect(host).toHaveAttribute('data-dragged', 'true');
});
```

- [ ] **Step 2: 跑测试确认失败**

Run: `npx playwright test tests/e2e/drag-motion.spec.ts`
Expected: FAIL

- [ ] **Step 3: 实现拖拽控制器**

实现要求：
- 使用 Pointer Events
- 使用 `setPointerCapture`
- 内部维护 `x/y/vx/vy/ax/ay`
- 容器位移使用 `transform: translate3d(...)`
- 将容器运动状态喂给 `particle-system`

- [ ] **Step 4: 跑测试直到通过**

Run: `npx playwright test tests/e2e/drag-motion.spec.ts`
Expected: PASS

- [ ] **Step 5: 手工用移动端视口验证**

Run: `npx playwright test tests/e2e/drag-motion.spec.ts --project="Mobile Chrome"`
Expected: PASS 或明确记录失败原因

- [ ] **Step 6: 整理变更，等待 wgh 手动提交**

## Chunk 5: 打磨、验收与文档

### Task 13: 完成构建产物、自检脚本与 README

**Files:**
- Modify: `F:\lava-lamp\scripts\build.mjs`
- Modify: `F:\lava-lamp\scripts\verify-dist.mjs`
- Create: `F:\lava-lamp\README.md`
- Modify: `F:\lava-lamp\examples\*.html`

- [ ] **Step 1: 先写验证脚本失败检查**

```js
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

test('dist bundle contains both global and custom-element entry points', async () => {
  const code = await readFile(new URL('../../dist/lava-lamp-widget.js', import.meta.url), 'utf8');
  assert.match(code, /window\.LavaLampWidget/);
  assert.match(code, /lava-lamp-widget/);
});
```

- [ ] **Step 2: 跑测试确认失败或不完整**

Run: `node --test tests/unit/public-api.test.mjs`
Expected: FAIL 或断言不完整。

- [ ] **Step 3: 完成构建脚本**

实现要求：
- 产出 ESM + IIFE
- 输出 banner 和版本号
- 校验导出项齐全
- 失败时用非 0 状态退出

- [ ] **Step 4: 写 README**

README 必须覆盖：
- 组件目标
- 安装方式
- 两种接入方式
- API 列表
- 默认参数
- 性能建议
- 已知限制

- [ ] **Step 5: 执行完整验证**

Run: `node --test tests/unit/*.test.mjs`
Expected: 所有单测 PASS

Run: `npx playwright test`
Expected: 所有 E2E PASS

Run: `node scripts/build.mjs && node scripts/verify-dist.mjs`
Expected: 构建成功并输出 `dist verified`

- [ ] **Step 6: 手工验收 3 个示例页面**

检查项：
- imperative 示例可显示、可暂停、可换色
- custom element 示例无需手工 mount
- mobile 示例在窄屏下不溢出、不抖动

- [ ] **Step 7: 整理变更，等待 wgh 手动提交**

## 8. 验收标准

### 8.1 功能验收

- `window.LavaLampWidget.mount()` 可正常挂载和销毁。
- `<lava-lamp-widget>` 可直接渲染，不依赖框架。
- blob 会出现：
  - 底部堆积
  - 受热脱离
  - 上浮
  - 顶部冷却
  - 回落
  - 自然融合分裂
- 拖动组件时：
  - 外层容器跟手移动
  - 内部 blob 有明显但不过度的惯性滞后
  - 快速拖拽后能看到撞壁与余振
- 背景模式为 `auto` 时，深浅背景上的玻璃高光与阴影对比合理。

### 8.2 性能验收目标

- 默认质量档在 260x520 尺寸下：
  - 桌面 Chrome 稳定 `55 FPS+`
  - 中端移动设备稳定 `40 FPS+`
- 页面隐藏时自动暂停或降频，不持续高占用。
- 主线程单帧平均时间目标：
  - 桌面 `< 8ms`
  - 中端移动端 `< 12ms`

### 8.3 产物验收

- `dist/lava-lamp-widget.js` 独立可用。
- 运行时第三方依赖数为 `0`。
- 构建后示例页只引用本地产物文件。

## 9. 风险与缓解

| 风险 | 触发信号 | 缓解方式 |
|---|---|---|
| blob 轮廓锯齿明显 | 低质量档大尺寸显示 | 动态减小 `fieldCellSize`，只在大尺寸时局部升档 |
| 拖拽后粒子爆散 | 容器加速度直接注入过强 | 对 `ax/ay` 做钳制和指数平滑 |
| 移动端卡顿 | DPR 过高、画布过大 | `devicePixelRatio` 上限钳制到 1.5~2 |
| 背景自动识别失真 | 宿主背景是复杂渐变或视频 | 提供 `light/dark/custom` 显式覆盖 |
| 等值面不闭合 | Marching Squares case 处理不全 | 先用单测覆盖全部边界 case，再上线 |

## 10. 实施顺序建议

1. 先完成 Chunk 1，锁定 API 和构建出口。
2. 再完成 Chunk 2，确保物理和温差循环可信。
3. 再完成 Chunk 3，确保视觉层质量足够。
4. 最后接入 Chunk 4 交互与 Chunk 5 文档验收。
5. 每完成一个 Chunk，就跑一次对应测试，不要等到最后一起排雷。

## 11. 执行注意事项

- 所有纯计算模块必须保持无 DOM 依赖，便于单测。
- 组件壳层不要直接修改页面布局，只通过宿主容器内部结构和 `transform` 实现拖动。
- 所有质量降级策略必须是自动的，但同时允许外部手工覆盖。
- 任何异常都要显式暴露或中止初始化，不能静默吞掉。
- 如果某个效果需要额外参数才能稳定，应优先调整默认值，不要先扩展公开 API。

## 12. 完成定义

满足以下全部条件，才可向 wgh 声称“开发完成”：

- 计划中的单测全部通过。
- Playwright E2E 全部通过，或明确记录阻塞原因。
- `dist` 产物可在 3 个示例页正常运行。
- README 与真实 API 保持一致。
- 运行时仍然零依赖。
- 未引入与当前目标无关的扩展接口或抽象层。

Plan complete and saved to `F:\lava-lamp\2026-06-19-lava-lamp-widget-implementation-plan.md`. Ready to execute?
