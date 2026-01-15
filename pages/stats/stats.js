// pages/stats/stats.js

let echarts = null
let pieChart = null
let lineChart = null
let echartsLoaded = false

// 尝试加载 ECharts
try {
  echarts = require('../../utils/ec-canvas/echarts')
  echartsLoaded = !!echarts.init
  if (!echartsLoaded) {
    console.warn('ECharts 库未正确加载，图表将显示为文本模式')
  }
} catch (error) {
  console.error('ECharts 加载失败:', error)
  echartsLoaded = false
  wx.showToast({
    title: '图表库未安装',
    icon: 'none',
    duration: 2000
  })
}

let chartInstance = null // 保存当前页面的实例，用于访问数据

function initPieChart(canvas, width, height, dpr) {
  if (!echartsLoaded) return null
  
  console.log('🎨 initPieChart 被调用，开始初始化饼图')
  
  pieChart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr
  })
  canvas.setChart(pieChart)
  
  console.log('✅ 饼图实例已创建')
  
  // 如果数据已经加载完成，立即渲染
  if (chartInstance && chartInstance.data.pieData && chartInstance.data.pieData.length > 0) {
    console.log('📊 数据已存在，立即渲染饼图')
    chartInstance.renderPieChart()
  }
  
  return pieChart
}

function initLineChart(canvas, width, height, dpr) {
  if (!echartsLoaded) return null
  
  lineChart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr
  })
  canvas.setChart(lineChart)
  return lineChart
}

Page({
  /**
   * 页面的初始数据
   */
  data: {
    periodType: 'month', // month 或 year
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    systemYear: null, // 将在 onLoad 中设置
    systemMonth: null, // 将在 onLoad 中设置
    pieEc: {
      onInit: initPieChart
    },
    lineEc: {
      onInit: initLineChart
    },
    pieData: [],
    lineChartData: null,
    dataCards: [],
    suggestions: [],
    showEChartsError: !echartsLoaded, // 是否显示 ECharts 错误提示
    errorTip: '图表功能需要安装 ECharts 库',
    showTimeWarning: false, // 是否显示时间警告
    useTextChart: !echartsLoaded // 是否使用文本显示代替图表（降级方案）
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    // 在运行时获取真实的系统时间
    const now = new Date()
    const currentYear = now.getFullYear()
    const currentMonth = now.getMonth() + 1
    
    this.setData({
      systemYear: currentYear,
      systemMonth: currentMonth,
      currentYear: currentYear,
      currentMonth: currentMonth
    })
    
    console.log('📅 运行时系统时间:', `${this.data.systemYear}年${this.data.systemMonth}月`)
    console.log('📅 当前查看:', `${this.data.currentYear}年${this.data.currentMonth}月`)

    // 保存页面实例，用于在 initPieChart 中访问
    chartInstance = this

    // 检查时间是否合理（如果不一致，显示警告）
    const yearDiff = this.data.currentYear - this.data.systemYear
    if (Math.abs(yearDiff) > 1) {
      console.warn('⚠️ 系统时间可能不正确，当前查看月份与系统时间相差较大')
      this.setData({
        showTimeWarning: true
      })
    }

    // 暂时禁用折线图，修复后启用
    // this.loadLineChartData()

    this.loadPieChartData()
    this.loadDataCards()
    this.loadSuggestions()

    // 如果 ECharts 未加载，显示提示
    if (!echartsLoaded) {
      wx.showModal({
        title: '提示',
        content: '图表库未安装，请按照 utils/ec-canvas/README.md 中的说明下载 ECharts 库',
        showCancel: false,
        confirmText: '我知道了'
      })
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    if (echartsLoaded) {
      console.log('✅ ECharts 已加载，等待数据加载完成后渲染图表')
      // 数据会在 loadPieChartData 和 loadLineChartData 的回调中渲染
    }
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    if (echartsLoaded) {
      if (pieChart) {
        this.loadPieChartData()
        this.renderPieChart()
      }
      if (lineChart) {
        this.loadLineChartData()
        this.renderLineChart()
      }
    }
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {
    if (pieChart) {
      pieChart.dispose()
      pieChart = null
    }
    if (lineChart) {
      lineChart.dispose()
      lineChart = null
    }
  },

  /**
   * 加载饼图数据
   */
  loadPieChartData() {
    const that = this
    const db = wx.cloud.database()
    const _ = db.command
    
    let startDate, endDate
    if (this.data.periodType === 'month') {
      startDate = new Date(this.data.currentYear, this.data.currentMonth - 1, 1)
      endDate = new Date(this.data.currentYear, this.data.currentMonth, 0, 23, 59, 59)
    } else {
      startDate = new Date(this.data.currentYear, 0, 1)
      endDate = new Date(this.data.currentYear, 11, 31, 23, 59, 59)
    }
    
    console.log('🔍 饼图查询条件：', {
      periodType: this.data.periodType,
      startDate: startDate,
      endDate: endDate,
      currentYear: this.data.currentYear,
      currentMonth: this.data.currentMonth
    })
    
    db.collection('bills').where({
      type: 'expense',
      date: _.gte(startDate).and(_.lte(endDate))
    }).get({
      success: res => {
        console.log('📊 饼图查询结果：', res)
        console.log('📊 查询到的记录数：', res.data.length)
        
        const categoryMap = {}
        res.data.forEach(bill => {
          console.log('💰 处理账单：', bill)
          // 检查 category 字段是否存在
          if (!bill.category || !bill.category.name) {
            console.warn('⚠️ 账单缺少 category 字段：', bill)
            return
          }
          const categoryName = bill.category.name
          if (!categoryMap[categoryName]) {
            categoryMap[categoryName] = {
              name: categoryName,
              value: 0,
              color: bill.category.color
            }
          }
          categoryMap[categoryName].value += parseFloat(bill.amount)
        })
        
        // 转为数组
        const data = Object.values(categoryMap)
        
        // 计算百分比
        const total = data.reduce((sum, item) => sum + item.value, 0)
        data.forEach(item => {
          item.percent = total > 0 ? ((item.value / total) * 100).toFixed(1) : 0
          item.value = item.value.toFixed(2)
        })
        
        // 按金额排序
        data.sort((a, b) => parseFloat(b.value) - parseFloat(a.value))
        
        console.log('🥧 饼图最终数据：', data)
        
        that.setData({
          pieData: data
        }, () => {
          console.log('✅ 饼图数据已设置，准备渲染图表')
          console.log('📊 echartsLoaded:', echartsLoaded)
          console.log('📊 pieChart 是否存在:', !!pieChart)
          
          // 数据加载完成后渲染图表
          if (echartsLoaded && pieChart) {
            console.log('📊 立即渲染饼图')
            that.renderPieChart()
          } else if (echartsLoaded && !pieChart) {
            console.log('📊 数据已加载，等待饼图组件初始化完成...')
            // pieChart 会在 initPieChart 中创建，并在创建后自动渲染
          } else {
            console.warn('⚠️ ECharts 未加载，无法渲染图表')
          }
        })
      },
      fail: err => {
        console.error('❌ 饼图查询失败：', err)
        wx.showToast({
          title: '数据加载失败',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 渲染饼图
   */
  renderPieChart() {
    console.log('🎨 开始渲染饼图')
    console.log('📊 pieChart 是否存在：', !!pieChart)
    console.log('📊 echartsLoaded：', echartsLoaded)
    console.log('📊 pieData：', this.data.pieData)

    if (!echartsLoaded || !pieChart) {
      console.warn('⚠️ 无法渲染饼图：ECharts 未加载或图表实例不存在')
      this.setData({ useTextChart: true })
      return
    }

    if (!this.data.pieData || this.data.pieData.length === 0) {
      console.warn('⚠️ 无法渲染饼图：没有数据')
      wx.showToast({
        title: '本期间无支出数据',
        icon: 'none'
      })
      return
    }

    try {
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}元 ({d}%)'
        },
        legend: {
          show: false
        },
        series: [{
          name: '支出',
          type: 'pie',
          radius: ['35%', '75%'],
          center: ['50%', '45%'],
          avoidLabelOverlap: true,
          itemStyle: {
            borderRadius: 10,
            borderColor: '#fff',
            borderWidth: 2
          },
          label: {
            show: false
          },
          emphasis: {
            label: {
              show: true,
              fontSize: 16,
              fontWeight: 'bold'
            }
          },
          data: this.data.pieData.map(item => ({
            name: item.name,
            value: item.value,
            itemStyle: {
              color: item.color
            }
          }))
        }]
      }

      pieChart.setOption(option)
      console.log('✅ 饼图渲染成功')
      this.setData({ useTextChart: false })
    } catch (error) {
      console.error('❌ 饼图渲染失败：', error)
      console.log('📝 降级为文本显示模式')
      this.setData({ useTextChart: true })
      wx.showModal({
        title: '图表显示失败',
        content: '已切换为文本显示模式，请查看 docs/ECHARTS_INTERNAL_ERROR_FIX.md 了解详情',
        showCancel: false,
        confirmText: '我知道了'
      })
    }
  },

  /**
   * 加载折线图数据
   */
  loadLineChartData() {
    const that = this
    const db = wx.cloud.database()
    const _ = db.command
    
    const months = []
    const incomeData = new Array(12).fill(0)
    const expenseData = new Array(12).fill(0)
    let loadedMonths = 0
    
    console.log('🔍 开始加载折线图数据（最近12个月）')
    
    // 获取最近12个月的数据
    for (let i = 11; i >= 0; i--) {
      const date = new Date()
      date.setMonth(date.getMonth() - i)
      const year = date.getFullYear()
      const month = date.getMonth() + 1
      
      months.push(`${month}月`)
      
      const startDate = new Date(year, month - 1, 1)
      const endDate = new Date(year, month, 0, 23, 59, 59)
      
      console.log(`📅 ${month}月查询范围: ${startDate} - ${endDate}`)
      
      const currentIndex = 11 - i
      
      // 查询该月收入
      db.collection('bills').where({
        type: 'income',
        date: _.gte(startDate).and(_.lte(endDate))
      }).get({
        success: res => {
          let totalIncome = 0
          res.data.forEach(bill => {
            totalIncome += parseFloat(bill.amount)
          })
          incomeData[currentIndex] = totalIncome.toFixed(2)
          loadedMonths++
          console.log(`📈 ${months[currentIndex]} 收入: ¥${totalIncome}`)
          checkAllLoaded()
        },
        fail: err => {
          console.error(`❌ ${months[currentIndex]} 收入查询失败:`, err)
          loadedMonths++
          checkAllLoaded()
        }
      })
      
      // 查询该月支出
      db.collection('bills').where({
        type: 'expense',
        date: _.gte(startDate).and(_.lte(endDate))
      }).get({
        success: res => {
          let totalExpense = 0
          res.data.forEach(bill => {
            totalExpense += parseFloat(bill.amount)
          })
          expenseData[currentIndex] = totalExpense.toFixed(2)
          loadedMonths++
          console.log(`📉 ${months[currentIndex]} 支出: ¥${totalExpense}`)
          checkAllLoaded()
        },
        fail: err => {
          console.error(`❌ ${months[currentIndex]} 支出查询失败:`, err)
          loadedMonths++
          checkAllLoaded()
        }
      })
    }
    
    function checkAllLoaded() {
      if (loadedMonths >= 24) {
        console.log('✅ 折线图数据加载完成')
        console.log('📊 months:', months)
        console.log('📊 incomeData:', incomeData)
        console.log('📊 expenseData:', expenseData)
        
        that.setData({
          lineChartData: { months, incomeData, expenseData }
        }, () => {
          console.log('✅ 折线图数据已设置，准备渲染图表')
          // 数据加载完成后渲染图表
          if (echartsLoaded && lineChart) {
            that.renderLineChart()
          }
        })
      }
    }
  },

  /**
   * 渲染折线图
   */
  renderLineChart() {
    console.log('🎨 开始渲染折线图')
    console.log('📊 lineChart 是否存在：', !!lineChart)
    console.log('📊 echartsLoaded：', echartsLoaded)
    console.log('📊 lineChartData：', this.data.lineChartData)
    
    if (!echartsLoaded || !lineChart || !this.data.lineChartData) {
      console.warn('⚠️ 无法渲染折线图：ECharts 未加载、图表实例不存在或数据未加载')
      return
    }
    
    const { months, incomeData, expenseData } = this.data.lineChartData
    console.log('📊 months:', months)
    console.log('📊 incomeData:', incomeData)
    console.log('📊 expenseData:', expenseData)
    
    const option = {
      tooltip: {
        trigger: 'axis'
      },
      legend: {
        data: ['收入', '支出'],
        top: 0
      },
      grid: {
        left: '10%',
        right: '5%',
        bottom: '10%',
        top: '15%'
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        data: months,
        axisLine: {
          lineStyle: {
            color: '#d2d2d7'
          }
        }
      },
      yAxis: {
        type: 'value',
        axisLine: {
          lineStyle: {
            color: '#d2d2d7'
          }
        }
      },
      series: [{
        name: '收入',
        type: 'line',
        smooth: true,
        data: incomeData,
        itemStyle: {
          color: '#34c759'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: 'rgba(52, 199, 89, 0.3)'
            }, {
              offset: 1,
              color: 'rgba(52, 199, 89, 0)'
            }]
          }
        }
      }, {
        name: '支出',
        type: 'line',
        smooth: true,
        data: expenseData,
        itemStyle: {
          color: '#ff3b30'
        },
        areaStyle: {
          color: {
            type: 'linear',
            x: 0,
            y: 0,
            x2: 0,
            y2: 1,
            colorStops: [{
              offset: 0,
              color: 'rgba(255, 59, 48, 0.3)'
            }, {
              offset: 1,
              color: 'rgba(255, 59, 48, 0)'
            }]
          }
        }
      }]
    }
    
    lineChart.setOption(option)
  },

  /**
   * 加载数据卡片
   */
  loadDataCards() {
    const that = this
    const db = wx.cloud.database()
    const _ = db.command
    
    let startDate, endDate
    if (this.data.periodType === 'month') {
      startDate = new Date(this.data.currentYear, this.data.currentMonth - 1, 1)
      endDate = new Date(this.data.currentYear, this.data.currentMonth, 0, 23, 59, 59)
    } else {
      startDate = new Date(this.data.currentYear, 0, 1)
      endDate = new Date(this.data.currentYear, 11, 31, 23, 59, 59)
    }
    
    // 查询总收入
    db.collection('bills').where({
      type: 'income',
      date: _.gte(startDate).and(_.lte(endDate))
    }).get({
      success: res => {
        let totalIncome = 0
        res.data.forEach(bill => {
          totalIncome += parseFloat(bill.amount)
        })
        
        // 查询总支出
        db.collection('bills').where({
          type: 'expense',
          date: _.gte(startDate).and(_.lte(endDate))
        }).get({
          success: res2 => {
            let totalExpense = 0
            res2.data.forEach(bill => {
              totalExpense += parseFloat(bill.amount)
            })
            
            const days = this.data.periodType === 'month' ? 30 : 365
            
            that.setData({
              dataCards: [
                {
                  title: '总收入',
                  value: `¥${totalIncome.toFixed(2)}`,
                  icon: '↓',
                  color: '#34c759',
                  textClass: 'text-green'
                },
                {
                  title: '总支出',
                  value: `¥${totalExpense.toFixed(2)}`,
                  icon: '↑',
                  color: '#ff3b30',
                  textClass: 'text-red'
                },
                {
                  title: '总笔数',
                  value: `${res.data.length + res2.data.length}`,
                  icon: '📊',
                  color: '#0071e3',
                  textClass: 'text-blue'
                },
                {
                  title: '日均支出',
                  value: `¥${(totalExpense / days).toFixed(2)}`,
                  icon: '💰',
                  color: '#ff9500',
                  textClass: ''
                }
              ]
            })
          }
        })
      }
    })
  },

  /**
   * 加载消费建议
   */
  loadSuggestions() {
    // 根据支出排行生成建议
    const suggestions = []
    
    if (this.data.pieData.length > 0) {
      const maxExpenseCategory = this.data.pieData[0]
      if (parseFloat(maxExpenseCategory.percent) > 40) {
        suggestions.push({
          icon: '⚠️',
          title: '注意控制支出',
          content: `${maxExpenseCategory.name}支出占比过高(${maxExpenseCategory.percent}%)，建议适当控制`
        })
      }
    }
    
    suggestions.push({
      icon: '💡',
      title: '合理规划预算',
      content: '建议每月设定预算目标，并定期查看支出趋势'
    })
    
    suggestions.push({
      icon: '📈',
      title: '增加储蓄',
      content: '尝试每月固定储蓄收入的20%-30%，培养储蓄习惯'
    })
    
    this.setData({
      suggestions
    })
  },

  /**
   * 切换期间类型
   */
  switchPeriod(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      periodType: type
    })
    this.loadPieChartData()
    this.loadLineChartData()
    this.loadDataCards()
    this.loadSuggestions()
    
    if (echartsLoaded) {
      if (pieChart) {
        this.renderPieChart()
      }
      if (lineChart) {
        this.renderLineChart()
      }
    }
  },

  /**
   * 上个月
   */
  prevMonth() {
    let { currentYear, currentMonth } = this.data
    
    if (currentMonth === 1) {
      currentMonth = 12
      currentYear -= 1
    } else {
      currentMonth -= 1
    }
    
    this.setData({
      currentYear,
      currentMonth
    })
    this.loadPieChartData()
    this.loadDataCards()
    this.loadSuggestions()
    
    if (echartsLoaded && pieChart) {
      this.renderPieChart()
    }
  },

  /**
   * 下个月
   */
  nextMonth() {
    let { currentYear, currentMonth } = this.data
    
    if (currentMonth === 12) {
      currentMonth = 1
      currentYear += 1
    } else {
      currentMonth += 1
    }
    
    this.setData({
      currentYear,
      currentMonth
    })
    this.loadPieChartData()
    this.loadDataCards()
    this.loadSuggestions()
    
    if (echartsLoaded && pieChart) {
      this.renderPieChart()
    }
  },

  /**
   * 上一年
   */
  prevYear() {
    this.setData({
      currentYear: this.data.currentYear - 1
    })
    this.loadPieChartData()
    this.loadDataCards()
    this.loadSuggestions()
    
    if (echartsLoaded && pieChart) {
      this.renderPieChart()
    }
  },

  /**
   * 下一年
   */
  nextYear() {
    this.setData({
      currentYear: this.data.currentYear + 1
    })
    this.loadPieChartData()
    this.loadDataCards()
    this.loadSuggestions()
    
    if (echartsLoaded && pieChart) {
      this.renderPieChart()
    }
  },

  /**
   * 回到当前月份
   */
  backToCurrent() {
    this.setData({
      currentYear: this.data.systemYear,
      currentMonth: this.data.systemMonth,
      showTimeWarning: false
    })
    console.log('📅 已切换到当前月份:', `${this.data.currentYear}年${this.data.currentMonth}月`)
    this.loadPieChartData()
    // 暂时禁用折线图，修复后启用
    // this.loadLineChartData()
    this.loadDataCards()
    this.loadSuggestions()

    if (echartsLoaded) {
      if (pieChart) {
        this.renderPieChart()
      }
      if (lineChart) {
        this.renderLineChart()
      }
    }

    wx.showToast({
      title: '已回到当前月份',
      icon: 'success'
    })
  }
})
