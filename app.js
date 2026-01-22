// app.js
App({
  onLaunch() {
    // 初始化云开发
    if (wx.cloud) {
      wx.cloud.init({
        env: 'cloud1-8gh7bqxm76b78540',
        traceUser: true
      })
    }
    
    // 获取系统信息
    wx.getSystemInfo({
      success: res => {
        this.globalData.systemInfo = res
      }
    })
    
    // 检查是否首次使用
    this.checkFirstUse()
  },
  
  onShow() {
    // 小程序显示
  },
  
  onHide() {
    // 小程序隐藏
  },
  
  globalData: {
    userInfo: null,
    systemInfo: null,
    currentMonth: new Date().getMonth() + 1,
    currentYear: new Date().getFullYear()
  },
  
  // 检查是否首次使用
  checkFirstUse() {
    const hasUsed = wx.getStorageSync('hasUsed')
    if (!hasUsed) {
      // 首次使用，设置标志
      wx.setStorageSync('hasUsed', true)
      // 显示欢迎提示
      setTimeout(() => {
        wx.showModal({
          title: '欢迎使用记账小程序',
          content: '点击"我的"页面可以设置您的头像和昵称',
          showCancel: false,
          confirmText: '知道了'
        })
      }, 1000)
    }
  },
  
  // 保存用户信息到云数据库
  saveUserInfo(userInfo) {
    if (!userInfo) return
    
    const db = wx.cloud.database()
    
    db.collection('users').where({
      _openid: '{openid}'
    }).get({
      success: res => {
        if (res.data.length === 0) {
          // 新用户
          db.collection('users').add({
            data: {
              nickName: userInfo.nickName || '新用户',
              avatarUrl: userInfo.avatarUrl || '',
              createTime: db.serverDate(),
              updateTime: db.serverDate()
            }
          })
        } else {
          // 更新用户信息
          db.collection('users').doc(res.data[0]._id).update({
            data: {
              nickName: userInfo.nickName || '新用户',
              avatarUrl: userInfo.avatarUrl || '',
              updateTime: db.serverDate()
            }
          })
        }
      }
    })
  }
})
