# Apple 风格个人记账小程序

一款极简、美观的微信小程序，采用 Apple 官网设计风格，帮助用户轻松管理个人财务。

## 项目特点

### 设计风格
- 🎨 **极简留白**: 大面积留白，突出核心内容
- 🌟 **毛玻璃效果**: 半透明模糊背景，现代感十足
- 🎯 **圆角卡片**: 所有模块采用大圆角设计
- 🌈 **渐变配色**: Apple 标准蓝色渐变，视觉舒适
- ✨ **细腻动画**: 平滑过渡，提升用户体验

### 核心功能
- 💰 **快速记账**: 极简流程，3秒完成记账
- 📊 **数据统计**: 饼图、折线图展示消费趋势
- 📋 **账单管理**: 按日期分组，查看明细
- 📈 **预算控制**: 设置月度预算，合理规划支出
- 📤 **数据导出**: 支持导出所有账单数据

## 技术栈

- **框架**: 微信小程序原生开发
- **云服务**: 微信云开发（数据库、云函数、云存储）
- **UI框架**: 原生组件 + 自定义样式
- **图表库**: ECharts 小程序版
- **动画**: WXSS 动画 + 小程序内置动画 API

## 项目结构

```
.
├── pages/                  # 页面目录
│   ├── index/             # 首页
│   ├── add/               # 记账页
│   ├── stats/             # 统计页
│   ├── bills/             # 账单页
│   └── profile/           # 我的页
├── utils/                 # 工具类
│   ├── ec-canvas/         # ECharts 适配器
│   └── util.js            # 通用工具函数
├── cloudfunctions/        # 云函数
│   ├── initDB/            # 初始化数据库
│   ├── getStats/          # 获取统计数据
│   └── exportData/        # 导出数据
├── db/                    # 数据库相关
│   └── README.md          # 数据库说明
├── assets/                # 资源文件
│   └── icons/             # 图标资源
├── app.js                 # 小程序入口
├── app.json               # 小程序配置
├── app.wxss               # 全局样式
├── theme.wxss             # 主题样式
├── animation.wxss         # 动画样式
└── README.md              # 项目说明
```

## 快速开始

### 1. 克隆项目

```bash
git clone <repository-url>
cd apple-style-finance
```

### 2. 安装依赖

```bash
# 安装 ECharts
cd utils/ec-canvas
npm install

# 安装云函数依赖
cd ../../cloudfunctions/initDB
npm install

cd ../getStats
npm install

cd ../exportData
npm install
```

### 3. 配置云开发

1. 在微信开发者工具中打开项目
2. 点击"云开发"按钮，创建云环境
3. 在 `app.js` 中配置云环境ID：

```javascript
wx.cloud.init({
  env: 'your-env-id' // 替换为你的云环境ID
})
```

### 4. 初始化数据库

1. 上传云函数 `initDB`
2. 在云函数控制台测试运行 `initDB`
3. 创建数据库集合（参考 `db/README.md`）

### 5. 运行项目

点击微信开发者工具的"编译"按钮即可运行项目。

## 功能使用

### 记账流程

1. 点击首页右下角的 "+" 按钮
2. 选择收支类型（收入/支出）
3. 输入金额
4. 选择分类
5. 选择账户、日期、备注（可选）
6. 点击"完成"保存

### 查看统计

1. 点击底部 Tab "统计"
2. 切换月度/年度视图
3. 查看支出饼图和收支趋势图
4. 查看数据卡片和消费建议

### 账单管理

1. 点击底部 Tab "账单"
2. 选择月份查看账单
3. 筛选全部/收入/支出
4. 点击账单查看详情

### 个人中心

1. 点击底部 Tab "我的"
2. 查看总收支统计
3. 管理分类和账户
4. 设置预算和导出数据

## 样式规范

### 颜色变量

```css
--apple-blue: #0071e3;           /* Apple 标准蓝 */
--apple-light-blue: #2997ff;     /* Apple 浅蓝 */
--apple-gray: #86868b;           /* 灰色 */
--apple-black: #1d1d1f;          /* 黑色 */
--bg-light: #fafdff;             /* 浅色背景 */
--bg-gradient: linear-gradient(135deg, #fafdff 0%, #e3f0ff 100%); /* 渐变背景 */
```

### 圆角规范

```css
--radius-sm: 12rpx;   /* 小圆角 */
--radius-md: 24rpx;   /* 中圆角 */
--radius-lg: 32rpx;   /* 大圆角 */
--radius-xl: 48rpx;   /* 超大圆角 */
--radius-full: 999rpx; /* 完全圆角 */
```

### 阴影规范

```css
--shadow-sm: 0 2px 8px rgba(0, 113, 227, 0.08);   /* 小阴影 */
--shadow-md: 0 4px 16px rgba(0, 113, 227, 0.1);    /* 中阴影 */
--shadow-lg: 0 8px 32px rgba(0, 113, 227, 0.12);   /* 大阴影 */
--shadow-xl: 0 16px 64px rgba(0, 113, 227, 0.15);  /* 超大阴影 */
```

## 云函数说明

### initDB

初始化数据库，创建默认分类和账户。

```javascript
wx.cloud.callFunction({
  name: 'initDB'
})
```

### getStats

获取统计数据。

```javascript
wx.cloud.callFunction({
  name: 'getStats',
  data: {
    year: 2024,
    month: 1,
    type: 'month' // 或 'year'
  }
})
```

### exportData

导出所有账单数据。

```javascript
wx.cloud.callFunction({
  name: 'exportData'
})
```

## 性能优化

1. **云函数优化**: 使用云函数进行复杂计算，减少前端压力
2. **数据库索引**: 为常用查询字段创建索引
3. **图片懒加载**: 使用小程序的 lazy-load 属性
4. **分包加载**: 将非核心功能分包加载

## 注意事项

1. 云开发环境需要配置正确的权限
2. 首次使用需要运行 `initDB` 云函数
3. ECharts 图表需要等待组件初始化完成后再渲染
4. 日期选择建议使用小程序原生 picker 组件

## 更新日志

### v1.0.0 (2024-01-01)

- ✨ 初始版本发布
- 🎨 Apple 风格 UI 设计
- 💰 基础记账功能
- 📊 数据统计图表
- 📋 账单管理

## 贡献指南

欢迎提交 Issue 和 Pull Request！

## 开源协议

MIT License

## 联系方式

- 邮箱: feedback@example.com
- 微信: [您的微信号]

---

Made with ❤️ by Coze Coding
