# Lava Lamp Widget API 文档

本文档详细说明了 Lava Lamp Widget 提供的所有配置项和实例方法。

## 1. Web Component 属性

如果你使用 `LavaLampWidget.defineCustomElement('lava-lamp-widget')` 注册了原生标签，可以在 HTML 中直接设置以下属性。

| 属性名 | 类型 | 描述 |
| --- | --- | --- |
| `width` | `Number` | 熔岩灯的宽度（像素）。 |
| `height` | `Number` | 熔岩灯的整体高度（像素）。 |
| `background-color` | `String` | 熔岩灯背后的环境背景颜色（例如 `#101820` 或 `black`）。 |

*提示：修改这些 HTML 属性会实时更新组件内部视图，无需刷新。*

---

## 2. JavaScript `mount` 配置对象 (Options)

通过 `LavaLampWidget.mount(container, options)` 挂载时，传入的 `options` 对象支持以下参数。

### 2.1 基础配置

| 参数 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `width` | `Number` | `160` | 熔岩灯的宽度。 |
| `height` | `Number` | *(必需)* | 熔岩灯的整体高度。内部玻璃体的高度会根据此值按特定比例计算。 |
| `quality` | `String` | `'auto'` | 渲染质量。目前默认为自动匹配最佳性能与画质。 |
| `autoplay` | `Boolean` | `true` | 是否在挂载完成后立即自动播放动画。如果设为 `false`，则需要手动调用 `resume()` 方法启动。 |

### 2.2 外观与主题配置

| 参数 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `backgroundMode` | `String` | `'dark'` | 预设的背景模式，可选值为 `'dark'`, `'light'`, `'custom'`。 |
| `backgroundColor`| `String` | `'#101820'`| 熔岩灯背部的背景颜色。 |
| `palette` | `Object` | `undefined`| 仅当 `backgroundMode` 为 `'custom'` 时生效，用于自定义熔岩和液体的颜色。格式：`{ wax: ['#色值'], liquid: ['#色值'] }`。（**注意：必须传入十六进制颜色且包裹在数组中**） |

### 2.3 物理引擎配置

| 参数 | 类型 | 默认值 | 描述 |
| --- | --- | --- | --- |
| `heat` | `Number` | `0.85` | 熔岩的“温度”或活跃度，范围一般在 `0.0` (冷却) 到 `1.0` (沸腾) 之间，影响内部热对流的推力大小。 |
| `draggable` | `Boolean` | `false` | 是否开启拖拽交互。开启后，用户拖拽容器时内部液体会产生真实的惯性晃动。 |
| `dragImpulse` | `Number` | `0.6` | 拖拽响应灵敏度。数值越大，拖拽造成的惯性推力越明显。 |
| `physics` | `Object` | *(见下)* | 物理引擎进阶参数，用于深度调优流体表现。 |

**`physics` 对象的详细属性：**
- `gravity` (Number, 默认 `0.005`): 重力常数，决定粒子冷却后下沉的速度。
- `buoyancy` (Number, 默认 `0.015`): 浮力常数，决定受热后向上漂浮的力量。
- `viscosity` (Number, 默认 `0.8`): 液体粘度，决定粒子移动的阻力，数值越高流体显得越“稠”。
- `wallBounce` (Number, 默认 `0.15`): 粒子撞击容器壁时的能量反弹系数。

### 2.4 其他高级选项

- `initialParticles` (Array): 自定义初始粒子数组。如果未提供，系统会根据容器尺寸自动生成底部的水库粒子群。
- `requestAnimationFrame` (Function): 自定义帧请求函数。默认为全局 `requestAnimationFrame`，可用于离屏渲染或自定义测试环境。
- `cancelAnimationFrame` (Function): 自定义帧取消函数。

---

## 3. 实例方法 (Instance Methods)

使用 `LavaLampWidget.mount` 后会返回一个实例对象。你可以通过该对象在运行时全面控制熔岩灯状态。

### `setOptions(newOpts: Object)`
运行时更新配置。支持传入上述任何 `options` 对象的字段。调用后会自动更新视觉表现，如果涉及尺寸更改则会自动重置画布。

### `setHeat(heat: Number)`
动态改变内部温度。
*   示例：`instance.setHeat(0.99)`
*   场景：你可以将它绑定到页面的滑动条控件上，让用户实时调整熔岩的活跃度。

### `setPalette(palette: Object)`
动态更换自定义配色方案。
```javascript
instance.setPalette({ wax: ['#ff0000'], liquid: ['#000000'] });
```

### `resume()`
恢复或开始播放流体动画。

### `pause()`
暂停动画的渲染与内部物理运算。

### `setContainerMotion(motion: Object)`
手动输入外部容器的运动状态，直接引发液体的物理惯性响应。这非常适合用来对接移动设备的陀螺仪（Gyroscope）数据。
- `motion`: 必须包含 `{ x, y, vx, vy, ax, ay }` 属性的运动矢量对象。

### `getMetrics(): Object`
获取当前熔岩灯内部的运行状态指标。
```javascript
const metrics = instance.getMetrics();
console.log(metrics.particleCount); // 当前粒子数量
console.log(metrics.running);       // 动画是否在运行
console.log(metrics.motion);        // 当前记录的容器运动矢量
```

### `destroy()`
彻底销毁实例。该操作会停止所有动画帧回调，移除所有绑定的事件处理器，并将注入到 DOM 中的元素节点完全移除释放。
