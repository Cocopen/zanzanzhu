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
    
    // 获取用户信息
    this.getUserInfo()
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
  
  // 获取用户信息
  getUserInfo() {
    const that = this
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          wx.getUserInfo({
            success: res => {
              that.globalData.userInfo = res.userInfo
              // 存储用户信息到云数据库
              that.saveUserInfo(res.userInfo)
            }
          })
        }
      }
    })
  },
  
  // 保存用户信息到云数据库
  saveUserInfo(userInfo) {
    const db = wx.cloud.database()
    const _ = db.command
    
    db.collection('users').where({
      _openid: '{openid}'
    }).get({
      success: res => {
        if (res.data.length === 0) {
          // 新用户
          db.collection('users').add({
            data: {
              nickName: userInfo.nickName,
              avatarUrl: userInfo.avatarUrl,
              createTime: db.serverDate(),
              updateTime: db.serverDate()
            }
          })
        } else {
          // 更新用户信息
          db.collection('users').doc(res.data[0]._id).update({
            data: {
              nickName: userInfo.nickName,
              avatarUrl: userInfo.avatarUrl,
              updateTime: db.serverDate()
            }
          })
        }
      }
    })
  }
})
