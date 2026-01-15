// pages/index/index.js
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    monthIncome: '0.00',
    monthExpense: '0.00',
    monthBalance: '0.00',
    incomeTrend: 0,
    expenseTrend: 0,
    budgetProgress: 0,
    topCategories: [],
    recentBills: []
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadMonthData()
    this.loadTopCategories()
    this.loadRecentBills()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {
    // 刷新数据
    this.loadMonthData()
    this.loadRecentBills()
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

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.loadMonthData()
    this.loadTopCategories()
    this.loadRecentBills()
    setTimeout(() => {
      wx.stopPullDownRefresh()
    }, 1000)
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    return {
      title: '我的财务助手',
      path: '/pages/index/index'
    }
  },

  /**
   * 加载月度数据
   */
  loadMonthData() {
    const that = this
    const db = wx.cloud.database()
    const _ = db.command

    const startDate = new Date(this.data.currentYear, this.data.currentMonth - 1, 1)
    const endDate = new Date(this.data.currentYear, this.data.currentMonth, 0, 23, 59, 59)

    console.log('加载月度数据，日期范围：', startDate, '至', endDate)

    // 查询本月收入
    db.collection('bills').where({
      type: 'income',
      date: _.gte(startDate).and(_.lte(endDate))
    }).get({
      success: res => {
        console.log('本月收入查询结果：', res)
        let totalIncome = 0
        res.data.forEach(bill => {
          totalIncome += parseFloat(bill.amount)
        })
        that.setData({
          monthIncome: totalIncome.toFixed(2)
        })

        // 计算收入趋势
        that.calculateIncomeTrend(totalIncome)
      },
      fail: err => {
        console.error('加载本月收入失败：', err)
      }
    })

    // 查询本月支出
    db.collection('bills').where({
      type: 'expense',
      date: _.gte(startDate).and(_.lte(endDate))
    }).get({
      success: res => {
        console.log('本月支出查询结果：', res)
        let totalExpense = 0
        res.data.forEach(bill => {
          totalExpense += parseFloat(bill.amount)
        })
        const totalIncome = parseFloat(that.data.monthIncome)
        that.setData({
          monthExpense: totalExpense.toFixed(2),
          monthBalance: (totalIncome - totalExpense).toFixed(2)
        })

        // 计算支出趋势
        that.calculateExpenseTrend(totalExpense)

        // 计算预算进度
        that.calculateBudgetProgress(totalExpense)
      },
      fail: err => {
        console.error('加载本月支出失败：', err)
      }
    })
  },
  
  /**
   * 计算收入趋势
   */
  calculateIncomeTrend(currentIncome) {
    const that = this
    const db = wx.cloud.database()
    const _ = db.command
    
    // 计算上月日期
    const prevMonth = this.data.currentMonth === 1 ? 12 : this.data.currentMonth - 1
    const prevYear = this.data.currentMonth === 1 ? this.data.currentYear - 1 : this.data.currentYear
    
    const startDate = new Date(prevYear, prevMonth - 1, 1)
    const endDate = new Date(prevYear, prevMonth, 0, 23, 59, 59)
    
    db.collection('bills').where({
      type: 'income',
      date: _.gte(startDate).and(_.lte(endDate))
    }).get({
      success: res => {
        let prevIncome = 0
        res.data.forEach(bill => {
          prevIncome += parseFloat(bill.amount)
        })
        
        if (prevIncome > 0) {
          const trend = ((currentIncome - prevIncome) / prevIncome * 100).toFixed(1)
          that.setData({
            incomeTrend: parseFloat(trend)
          })
        }
      }
    })
  },
  
  /**
   * 计算支出趋势
   */
  calculateExpenseTrend(currentExpense) {
    const that = this
    const db = wx.cloud.database()
    const _ = db.command
    
    // 计算上月日期
    const prevMonth = this.data.currentMonth === 1 ? 12 : this.data.currentMonth - 1
    const prevYear = this.data.currentMonth === 1 ? this.data.currentYear - 1 : this.data.currentYear
    
    const startDate = new Date(prevYear, prevMonth - 1, 1)
    const endDate = new Date(prevYear, prevMonth, 0, 23, 59, 59)
    
    db.collection('bills').where({
      type: 'expense',
      date: _.gte(startDate).and(_.lte(endDate))
    }).get({
      success: res => {
        let prevExpense = 0
        res.data.forEach(bill => {
          prevExpense += parseFloat(bill.amount)
        })
        
        if (prevExpense > 0) {
          const trend = ((currentExpense - prevExpense) / prevExpense * 100).toFixed(1)
          that.setData({
            expenseTrend: parseFloat(trend)
          })
        }
      }
    })
  },
  
  /**
   * 计算预算进度
   */
  calculateBudgetProgress(currentExpense) {
    const that = this
    const db = wx.cloud.database()
    
    // 查询预算设置
    db.collection('budget').where({
      year: this.data.currentYear,
      month: this.data.currentMonth
    }).get({
      success: res => {
        if (res.data.length > 0) {
          const budget = res.data[0].amount
          const progress = Math.min((currentExpense / budget * 100), 100).toFixed(0)
          that.setData({
            budgetProgress: parseFloat(progress)
          })
        }
      }
    })
  },
  
  /**
   * 加载支出排行
   */
  loadTopCategories() {
    const that = this
    const db = wx.cloud.database()
    const _ = db.command
    
    const startDate = new Date(this.data.currentYear, this.data.currentMonth - 1, 1)
    const endDate = new Date(this.data.currentYear, this.data.currentMonth, 0, 23, 59, 59)
    
    db.collection('bills').where({
      type: 'expense',
      date: _.gte(startDate).and(_.lte(endDate))
    }).get({
      success: res => {
        const categoryMap = {}
        res.data.forEach(bill => {
          const categoryName = bill.category.name
          if (!categoryMap[categoryName]) {
            categoryMap[categoryName] = {
              name: categoryName,
              icon: bill.category.icon,
              color: bill.category.color,
              amount: 0
            }
          }
          categoryMap[categoryName].amount += parseFloat(bill.amount)
        })
        
        // 转为数组并排序
        const categories = Object.values(categoryMap)
          .sort((a, b) => b.amount - a.amount)
          .slice(0, 5)
        
        // 计算百分比
        const totalExpense = categories.reduce((sum, item) => sum + item.amount, 0)
        categories.forEach(item => {
          item.percent = totalExpense > 0 ? ((item.amount / totalExpense) * 100).toFixed(1) : 0
          item.amount = item.amount.toFixed(2)
        })
        
        that.setData({
          topCategories: categories
        })
      }
    })
  },
  
  /**
   * 加载最近账单
   */
  loadRecentBills() {
    const that = this
    const db = wx.cloud.database()
    
    db.collection('bills')
      .orderBy('date', 'desc')
      .limit(5)
      .get({
        success: res => {
          const bills = res.data.map(bill => {
            return {
              id: bill._id,
              amount: bill.amount,
              type: bill.type,
              date: that.formatDate(bill.date),
              category: bill.category
            }
          })
          that.setData({
            recentBills: bills
          })
        }
      })
  },
  
  /**
   * 格式化日期
   */
  formatDate(date) {
    const d = new Date(date)
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    const hour = d.getHours().toString().padStart(2, '0')
    const minute = d.getMinutes().toString().padStart(2, '0')
    return `${month}-${day} ${hour}:${minute}`
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
    
    this.loadMonthData()
    this.loadTopCategories()
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
    
    this.loadMonthData()
    this.loadTopCategories()
  },
  
  /**
   * 跳转到记账页
   */
  goToAdd() {
    wx.navigateTo({
      url: '/pages/add/add'
    })
  },
  
  /**
   * 跳转到账单页
   */
  goToBills() {
    wx.switchTab({
      url: '/pages/bills/bills'
    })
  },
  
  /**
   * 查看账单详情
   */
  goToBillDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/bills/detail?id=${id}`
    })
  }
})
