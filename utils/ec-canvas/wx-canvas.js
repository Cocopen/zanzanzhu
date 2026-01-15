class WxCanvas {
  constructor(ctx, canvasId, isNew, canvasNode) {
    this.canvasId = canvasId;
    this.chart = null;
    this.isNew = isNew
    this.canvasNode = canvasNode

    if (isNew) {
      // 新版 Canvas 2D
      this.canvasNode = ctx; // 这里的 ctx 实际上是 canvasNode
      // 获取 2D 上下文
      this.ctx = this.canvasNode.getContext('2d');
    } else {
      // 旧版 Canvas
      this.ctx = ctx;
    }

    // 确保 ctx 有所有必要的方法（ECharts 需要）
    this._initCanvasContext(this.ctx);

    if (!isNew) {
      // 只有旧版 Canvas 需要调用 _initStyle
      this._initStyle(this.ctx);
    }

    this._initEvent();
    this._proxyMethods();
  }

  getContext(contextType) {
    if (contextType === '2d') {
      return this.ctx;
    }
  }

  // 初始化 Canvas 上下文，确保所有方法都存在
  _initCanvasContext(ctx) {
    if (!ctx) return; // 如果 ctx 不存在，直接返回
    
    // 确保有 measureText 方法
    if (!ctx.measureText) {
      ctx.measureText = (text) => {
        const fontSize = parseFloat(ctx.fontSize) || 12;
        const charWidth = fontSize * 0.6;
        return {
          width: text.length * charWidth,
          height: fontSize
        };
      };
    }
  }

  // 代理 Canvas 上下文的所有方法到 WxCanvas 实例
  _proxyMethods() {
    if (!this.ctx) return; // 如果 ctx 不存在，直接返回
    
    const canvasMethods = [
      'fillText',
      'strokeText',
      'save',
      'restore',
      'scale',
      'rotate',
      'translate',
      'transform',
      'setTransform',
      'createLinearGradient',
      'createRadialGradient',
      'createPattern',
      'clearRect',
      'fillRect',
      'strokeRect',
      'beginPath',
      'closePath',
      'moveTo',
      'lineTo',
      'quadraticCurveTo',
      'bezierCurveTo',
      'arcTo',
      'arc',
      'rect',
      'fill',
      'stroke',
      'clip',
      'isPointInPath',
      'drawImage',
      'putImageData',
      'getImageData',
      'createImageData',
      'setLineDash',
      'getLineDash',
      'setLineDashOffset',
      'getLineDashOffset'
    ];

    canvasMethods.forEach(method => {
      if (this.ctx[method]) {
        this[method] = (...args) => {
          return this.ctx[method].apply(this.ctx, args);
        };
      }
    });

    // 特殊处理 measureText，因为旧版 Canvas 可能不支持
    this.measureText = (text) => {
      if (this.ctx.measureText) {
        return this.ctx.measureText(text);
      }
      // 降级方案：估算文本宽度
      const fontSize = parseFloat(this.ctx.fontSize) || 12;
      const charWidth = fontSize * 0.6; // 粗略估算每个字符的宽度
      return {
        width: text.length * charWidth,
        height: fontSize
      };
    };
  }

  // 添加事件监听
  _initEvent() {
    if (!this.ctx) return; // 如果 ctx 不存在，直接返回
    
    const eventNames = [
      {
        wxName: 'touchStart',
        ecName: 'mousedown'
      },
      {
        wxName: 'touchMove',
        ecName: 'mousemove'
      },
      {
        wxName: 'touchEnd',
        ecName: 'mouseup'
      },
      {
        wxName: 'touchEnd',
        ecName: 'click'
      }
    ]

    eventNames.forEach(name => {
      this.ctx[name] && (this.ctx[name] = (e) => {
        const touch = e.touches[0];
        const x = touch.x;
        const y = touch.y;

        if (this.chart && !this.chart.isDisposed()) {
          this.chart.getZr().handler.dispatch(name.ecName, {
            zrX: x,
            zrY: y
          });
        }
      });
    });
  }

  _initStyle(ctx) {
    if (!ctx) return; // 如果 ctx 不存在，直接返回
    
    var styles = ['fillStyle', 'strokeStyle', 'globalAlpha',
      'shadowBlur', 'shadowColor', 'shadowOffsetX', 'shadowOffsetY',
      'lineWidth', 'lineCap', 'lineJoin', 'fontSize', 'font',
      'textAlign', 'textBaseline', 'globalCompositeOperation'
    ];

    styles.forEach(style => {
      Object.defineProperty(this, style, {
        get: function () {
          return this.ctx[style];
        },
        set: function (value) {
          this.ctx[style] = value;
        }
      });
    });
  }

  setChart(chart) {
    this.chart = chart;
  }

  addEventListener() {}

  removeEventListener() {}

  createCircularGradient(x0, y0, r0, x1, y1, r1) {
    if (!this.canvasNode) return null; // 如果 canvasNode 不存在，返回 null
    
    const canvas = this.isNew ? this.canvasNode : this.canvas;
    if (!canvas) return null; // 如果 canvas 不存在，返回 null
    
    const ctx = canvas.getContext('2d');
    if (!ctx) return null; // 如果 ctx 不存在，返回 null
    
    const gradient = ctx.createRadialGradient(x0, y0, r0, x1, y1, r1);
    return gradient;
  }

  draw() {
    if (this.isNew) {
      // 新版 Canvas 不需要手动 draw
    } else {
      this.ctx.draw();
    }
  }
}

module.exports = WxCanvas;
