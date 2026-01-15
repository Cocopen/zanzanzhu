// pages/profile/profile.js
const app = getApp()

Page({
  /**
   * 页面的初始数据
   */
  data: {
    userInfo: {},
    totalBills: 0,
    stats: {
      totalIncome: '0.00',
      totalExpense: '0.00',
      totalBalance: '0.00'
    },
    isDarkMode: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getUserInfo()
    this.loadTotalStats()
    this.loadTheme()
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
    this.loadTotalStats()
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
   * 获取用户信息
   */
  getUserInfo() {
    const userInfo = app.globalData.userInfo || {}
    this.setData({
      userInfo
    })
  },

  /**
   * 显示用户信息编辑
   */
  showUserModal() {
    wx.getUserProfile({
      desc: '用于完善用户资料',
      success: res => {
        app.globalData.userInfo = res.userInfo
        this.setData({
          userInfo: res.userInfo
        })
        
        // 保存到云数据库
        const db = wx.cloud.database()
        db.collection('users').where({
          _openid: '{openid}'
        }).get({
          success: result => {
            if (result.data.length === 0) {
              db.collection('users').add({
                data: {
                  nickName: res.userInfo.nickName,
                  avatarUrl: res.userInfo.avatarUrl,
                  createTime: db.serverDate(),
                  updateTime: db.serverDate()
                }
              })
            } else {
              db.collection('users').doc(result.data[0]._id).update({
                data: {
                  nickName: res.userInfo.nickName,
                  avatarUrl: res.userInfo.avatarUrl,
                  updateTime: db.serverDate()
                }
              })
            }
          }
        })
      }
    })
  },

  /**
   * 加载总统计数据
   */
  loadTotalStats() {
    const that = this
    const db = wx.cloud.database()
    
    // 查询总账单数
    db.collection('bills').count({
      success: res => {
        that.setData({
          totalBills: res.total
        })
      }
    })
    
    // 查询总收入
    db.collection('bills').where({
      type: 'income'
    }).get({
      success: res => {
        let totalIncome = 0
        res.data.forEach(bill => {
          totalIncome += parseFloat(bill.amount)
        })
        
        // 查询总支出
        db.collection('bills').where({
          type: 'expense'
        }).get({
          success: res2 => {
            let totalExpense = 0
            res2.data.forEach(bill => {
              totalExpense += parseFloat(bill.amount)
            })
            
            that.setData({
              stats: {
                totalIncome: totalIncome.toFixed(2),
                totalExpense: totalExpense.toFixed(2),
                totalBalance: (totalIncome - totalExpense).toFixed(2)
              }
            })
          }
        })
      }
    })
  },

  /**
   * 加载主题设置
   */
  loadTheme() {
    const theme = wx.getStorageSync('theme') || 'light'
    this.setData({
      isDarkMode: theme === 'dark'
    })
  },

  /**
   * 分类管理
   */
  manageCategories() {
    wx.showToast({
      title: '分类管理功能开发中',
      icon: 'none'
    })
  },

  /**
   * 账户管理
   */
  manageAccounts() {
    wx.showToast({
      title: '账户管理功能开发中',
      icon: 'none'
    })
  },

  /**
   * 预算设置
   */
  setBudget() {
    wx.showToast({
      title: '预算设置功能开发中',
      icon: 'none'
    })
  },

  /**
   * 数据导出
   */
  exportData() {
    wx.showLoading({
      title: '导出中...'
    })
    
    // 调用云函数导出数据
    wx.cloud.callFunction({
      name: 'exportData',
      data: {},
      success: res => {
        wx.hideLoading()
        wx.showToast({
          title: '导出成功',
          icon: 'success'
        })
      },
      fail: err => {
        wx.hideLoading()
        wx.showToast({
          title: '导出失败',
          icon: 'none'
        })
      }
    })
  },

  /**
   * 切换主题
   */
  toggleTheme() {
    const theme = this.data.isDarkMode ? 'light' : 'dark'
    this.setData({
      isDarkMode: !this.data.isDarkMode
    })
    
    wx.setStorageSync('theme', theme)
    
    // 设置主题
    if (theme === 'dark') {
      wx.setNavigationBarColor({
        frontColor: '#ffffff',
        backgroundColor: '#000000'
      })
    } else {
      wx.setNavigationBarColor({
        frontColor: '#000000',
        backgroundColor: '#fafdff'
      })
    }
  },

  /**
   * 主题改变
   */
  onThemeChange(e) {
    this.toggleTheme()
  },

  /**
   * 关于我们
   */
  showAbout() {
    wx.showModal({
      title: '关于我们',
      content: '个人记账小程序 v1.0.0\n\n这是一个简洁、美观的个人记账工具，帮助你轻松管理财务。',
      showCancel: false,
      confirmText: '知道了'
    })
  },

  /**
   * 意见反馈
   */
  showFeedback() {
    wx.showModal({
      title: '意见反馈',
      content: '请通过以下方式联系我们：\n\n邮箱：feedback@example.com',
      showCancel: false,
      confirmText: '知道了'
    })
  }
})
