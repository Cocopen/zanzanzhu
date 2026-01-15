// pages/bills/bills.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    filterType: 'all', // all, income, expense
    currentYear: new Date().getFullYear(),
    currentMonth: new Date().getMonth() + 1,
    groupedBills: [],
    monthStats: {
      income: '0.00',
      expense: '0.00',
      balance: '0.00',
      count: 0
    }
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.loadBills()
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
    this.loadBills()
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
    this.loadBills()
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
      title: '我的账单',
      path: '/pages/bills/bills'
    }
  },

  /**
   * 加载账单数据
   */
  loadBills() {
    const that = this
    const db = wx.cloud.database()
    const _ = db.command
    
    const startDate = new Date(this.data.currentYear, this.data.currentMonth - 1, 1)
    const endDate = new Date(this.data.currentYear, this.data.currentMonth, 0, 23, 59, 59)
    
    let whereCondition = {
      date: _.gte(startDate).and(_.lte(endDate))
    }
    
    if (this.data.filterType !== 'all') {
      whereCondition.type = this.data.filterType
    }
    
    db.collection('bills')
      .where(whereCondition)
      .orderBy('date', 'desc')
      .get({
        success: res => {
          const bills = res.data.map(bill => {
            return {
              id: bill._id,
              amount: bill.amount,
              type: bill.type,
              date: bill.date,
              category: bill.category,
              account: bill.account,
              remark: bill.remark,
              time: that.formatTime(bill.date)
            }
          })
          
          that.groupBillsByDate(bills)
          that.calculateMonthStats(bills)
        }
      })
  },

  /**
   * 按日期分组账单
   */
  groupBillsByDate(bills) {
    const groups = {}
    
    bills.forEach(bill => {
      const dateStr = this.formatDate(bill.date)
      if (!groups[dateStr]) {
        groups[dateStr] = {
          date: dateStr,
          income: '0.00',
          expense: '0.00',
          bills: []
        }
      }
      
      groups[dateStr].bills.push(bill)
      
      if (bill.type === 'income') {
        groups[dateStr].income = (parseFloat(groups[dateStr].income) + parseFloat(bill.amount)).toFixed(2)
      } else {
        groups[dateStr].expense = (parseFloat(groups[dateStr].expense) + parseFloat(bill.amount)).toFixed(2)
      }
    })
    
    // 转为数组并按日期排序
    const groupedBills = Object.values(groups).sort((a, b) => {
      return new Date(b.date) - new Date(a.date)
    })
    
    this.setData({
      groupedBills
    })
  },

  /**
   * 计算月度统计
   */
  calculateMonthStats(bills) {
    let income = 0
    let expense = 0
    
    bills.forEach(bill => {
      if (bill.type === 'income') {
        income += parseFloat(bill.amount)
      } else {
        expense += parseFloat(bill.amount)
      }
    })
    
    this.setData({
      monthStats: {
        income: income.toFixed(2),
        expense: expense.toFixed(2),
        balance: (income - expense).toFixed(2),
        count: bills.length
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
    const weekdays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六']
    const weekday = weekdays[d.getDay()]
    
    if (this.isToday(d)) {
      return '今天'
    } else if (this.isYesterday(d)) {
      return '昨天'
    } else {
      return `${month}-${day} ${weekday}`
    }
  },

  /**
   * 格式化时间
   */
  formatTime(date) {
    const d = new Date(date)
    const hour = d.getHours().toString().padStart(2, '0')
    const minute = d.getMinutes().toString().padStart(2, '0')
    return `${hour}:${minute}`
  },

  /**
   * 判断是否是今天
   */
  isToday(date) {
    const today = new Date()
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear()
  },

  /**
   * 判断是否是昨天
   */
  isYesterday(date) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    return date.getDate() === yesterday.getDate() &&
           date.getMonth() === yesterday.getMonth() &&
           date.getFullYear() === yesterday.getFullYear()
  },

  /**
   * 切换筛选类型
   */
  switchFilter(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      filterType: type
    })
    this.loadBills()
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
    this.loadBills()
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
    this.loadBills()
  },

  /**
   * 查看账单详情
   */
  goToDetail(e) {
    const id = e.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/bills/detail?id=${id}`
    })
  },

  /**
   * 跳转到记账页
   */
  goToAdd() {
    wx.navigateTo({
      url: '/pages/add/add'
    })
  }
})
