const WxCanvas = require('./wx-canvas');
const echarts = require('./echarts');

let ctx;

// 是否强制使用旧版 canvas（false 表示优先使用新版）
// 使用新版 Canvas 2D，以支持完整的 Canvas API
const forceUseOldCanvas = false;

function compareVersion(v1, v2) {
  // 防御性代码：处理 undefined 或空值
  if (!v1) {
    console.warn('compareVersion: v1 is undefined, returning -1')
    return -1
  }
  if (!v2) {
    console.warn('compareVersion: v2 is undefined, returning 1')
    return 1
  }

  // 确保 v1 和 v2 是字符串
  v1 = String(v1).split('.')
  v2 = String(v2).split('.')

  const len = Math.max(v1.length, v2.length)

  while (v1.length < len) {
    v1.push('0')
  }
  while (v2.length < len) {
    v2.push('0')
  }

  for (let i = 0; i < len; i++) {
    const num1 = parseInt(v1[i] || 0, 10)
    const num2 = parseInt(v2[i] || 0, 10)

    if (num1 > num2) {
      return 1
    } else if (num1 < num2) {
      return -1
    }
  }
  return 0
}

Component({
  properties: {
    canvasId: {
      type: String,
      value: 'ec-canvas'
    },

    ec: {
      type: Object
    }
  },

  data: {
    isUseNewCanvas: false
  },

  ready: function () {
    if (!this.data.ec) {
      console.warn('组件需绑定 ec 变量，例：<ec-canvas id="mychart-dom-bar" canvas-id="mychart-bar" ec="{{ ec }}"></ec-canvas>');
      return;
    }

    if (!this.data.ec.lazyLoad) {
      this.init();
    }
  },

  methods: {
    init: function (callback) {
      // 使用新的 API 替代 wx.getSystemInfoSync()
      // wx.getAppBaseInfo() 包含 SDKVersion
      // wx.getWindowInfo() 包含 pixelRatio
      try {
        const appBaseInfo = wx.getAppBaseInfo ? wx.getAppBaseInfo() : wx.getSystemInfoSync()
        const version = appBaseInfo.SDKVersion

        console.log('SDKVersion:', version)

        const canUseNewCanvas = compareVersion(version, '2.9.0') >= 0;
        const isUseNewCanvas = this.data.isUseNewCanvas;

        console.log('canUseNewCanvas:', canUseNewCanvas, 'isUseNewCanvas:', isUseNewCanvas)

        if (forceUseOldCanvas) {
          // 强制使用旧 canvas, 兼容一些奇怪的情况
          this.initByOldWay(callback);
        } else if (canUseNewCanvas && !isUseNewCanvas) {
          this.setData({ isUseNewCanvas: true });
          this.initByNewWay(callback);
        } else {
          this.initByOldWay(callback);
        }
      } catch (error) {
        console.error('init error:', error)
        // 出错时使用旧版 canvas
        this.initByOldWay(callback);
      }
    },

    initByOldWay(callback) {
      ctx = wx.createCanvasContext(this.data.canvasId, this);
      const canvas = new WxCanvas(ctx, this.data.canvasId, false, this);

      // 使用新的 API 替代 setCanvasCreator（兼容性处理）
      if (echarts.setPlatformAPI) {
        echarts.setPlatformAPI({
          createCanvas: () => canvas
        })
      } else {
        // 旧版本兼容
        echarts.setCanvasCreator(() => canvas)
      }

      var query = wx.createSelectorQuery().in(this);
      query.select('.ec-canvas').boundingClientRect(res => {
        if (typeof callback === 'function') {
          this.chart = callback(canvas, res.width, res.height, echarts);
        }
        else if (this.data.ec && typeof this.data.ec.onInit === 'function') {
          this.chart = this.data.ec.onInit(canvas, res.width, res.height, echarts);
        }
        else {
          this.triggerEvent('init', {
            canvas: canvas,
            width: res.width,
            height: res.height,
            echarts: echarts
          });
        }
      }).exec();
    },

    initByNewWay(callback) {
      const query = wx.createSelectorQuery().in(this)
      query
        .select('.ec-canvas')
        .fields({ node: true, size: true })
        .exec(res => {
          if (!res || !res[0]) {
            console.error('canvas node not found')
            return
          }

          const canvasNode = res[0].node
          // 使用 wx.getWindowInfo() 获取 pixelRatio
          const windowInfo = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
          const dpr = windowInfo.pixelRatio || 1

          // 设置 canvas 的实际像素大小
          const width = res[0].width
          const height = res[0].height
          canvasNode.width = width * dpr
          canvasNode.height = height * dpr

          // 创建 WxCanvas 实例，传递 canvasNode 作为第一个参数
          // WxCanvas 构造函数会在内部获取 2D 上下文
          const canvas = new WxCanvas(canvasNode, this.data.canvasId, true, canvasNode)

          // 使用新的 API 替代 setCanvasCreator（兼容性处理）
          if (echarts.setPlatformAPI) {
            echarts.setPlatformAPI({
              createCanvas: () => canvas
            })
          } else {
            // 旧版本兼容
            echarts.setCanvasCreator(() => canvas)
          }

          if (typeof callback === 'function') {
            this.chart = callback(canvas, width, height, echarts, dpr)
          } else if (this.data.ec && typeof this.data.ec.onInit === 'function') {
            this.chart = this.data.ec.onInit(canvas, width, height, echarts, dpr)
          } else {
            this.triggerEvent('init', {
              canvas: canvas,
              width: width,
              height: height,
              echarts: echarts,
              dpr: dpr
            })
          }
        })
    },

    canvasToTempFilePath(opt) {
      if (this.data.isUseNewCanvas) {
        // 新版
        const query = wx.createSelectorQuery().in(this);
        query
          .select('.ec-canvas')
          .fields({ node: true, size: true })
          .exec(res => {
            const canvasNode = res[0].node;
            opt.canvas = canvasNode;
            wx.canvasToTempFilePath(opt, this);
          })
      } else {
        // 旧版
        if (!opt.canvasId) {
          opt.canvasId = this.data.canvasId;
        }
        ctx.draw(true, () => {
          wx.canvasToTempFilePath(opt, this);
        });
      }
    },

    touchStart(e) {
      if (this.chart && e.touches.length > 0) {
        var touch = e.touches[0];
        var touchHandler = this.chart.getZr().handler;
        touchHandler.dispatch('mousedown', {
          zrX: touch.x,
          zrY: touch.y
        });
        touchHandler.dispatch('mousemove', {
          zrX: touch.x,
          zrY: touch.y
        });
        // 检查 processGesture 方法是否存在
        if (typeof touchHandler.processGesture === 'function') {
          touchHandler.processGesture(wrapTouch(e), 'start');
        }
      }
    },

    touchMove(e) {
      if (this.chart && e.touches.length > 0) {
        var touch = e.touches[0];
        var touchHandler = this.chart.getZr().handler;
        touchHandler.dispatch('mousemove', {
          zrX: touch.x,
          zrY: touch.y
        });
        // 检查 processGesture 方法是否存在
        if (typeof touchHandler.processGesture === 'function') {
          touchHandler.processGesture(wrapTouch(e), 'change');
        }
      }
    },

    touchEnd(e) {
      if (this.chart) {
        var touchHandler = this.chart.getZr().handler;
        touchHandler.dispatch('mouseup', {});
        touchHandler.dispatch('click', {});
        // 检查 processGesture 方法是否存在
        if (typeof touchHandler.processGesture === 'function') {
          touchHandler.processGesture(wrapTouch(e), 'end');
        }
      }
    }
  }
});

function wrapTouch(event) {
  for (let i = 0; i < event.touches.length; ++i) {
    const touch = event.touches[i];
    touch.offsetX = touch.x;
    touch.offsetY = touch.y;
  }
  return event;
}
