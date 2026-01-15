# ECharts 小程序版适配器

## 说明

这是一个 ECharts 5.x 的小程序适配器，用于在微信小程序中使用 ECharts 图表库。

## 安装 ECharts

```bash
cd utils/ec-canvas
npm install echarts-for-weixin
```

## 使用方法

### 1. 在页面中引入

```json
{
  "usingComponents": {
    "ec-canvas": "../../utils/ec-canvas/ec-canvas"
  }
}
```

### 2. 在页面中使用

```html
<ec-canvas id="mychart-dom-pie" canvas-id="mychart-pie" ec="{{ pieEc }}"></ec-canvas>
```

```javascript
import * as echarts from '../../utils/ec-canvas/echarts'

function initChart(canvas, width, height, dpr) {
  const chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr
  })

  const option = {
    // ECharts 配置项
  }

  chart.setOption(option)
  return chart
}

Page({
  data: {
    pieEc: {
      onInit: initChart
    }
  }
})
```

## 支持的图表类型

- 柱状图
- 折线图
- 饼图
- 散点图
- 雷达图
- 词云
- 漏斗图
- 仪表盘

## 注意事项

1. 需要下载 echarts-for-weixin 包
2. 新版小程序（SDKVersion >= 2.9.0）使用新版 Canvas
3. 旧版小程序使用旧版 Canvas
4. 图表容器需要设置明确的高度和宽度
5. 大数据量时建议使用数据分片渲染

## 文件说明

- `ec-canvas.js`: 组件主文件
- `ec-canvas.wxml`: 组件模板
- `ec-canvas.wxss`: 组件样式
- `ec-canvas.json`: 组件配置
- `wx-canvas.js`: Canvas 适配器
- `echarts.js`: ECharts 核心库（需单独下载）

## 相关链接

- ECharts 官网: https://echarts.apache.org/zh/
- ECharts 小程序版: https://github.com/ecomfe/echarts-for-weixin
