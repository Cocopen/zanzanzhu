// pages/add/add.js
Page({
  /**
   * 页面的初始数据
   */
  data: {
    billType: 'expense', // expense 或 income
    amount: '',
    amountFocus: false,
    categories: [],
    selectedCategory: {},
    accounts: [],
    selectedAccount: {},
    selectedDate: '',
    remark: '',
    showRemarkModal: false,
    canSubmit: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.setData({
      billId: options.id // 保存账单 ID，用于编辑
    })
    
    if (options.id) {
      // 如果有 id 参数，加载账单详情
      this.loadBillDetail(options.id)
    } else {
      // 否则，加载分类和账户列表
      this.loadCategories()
      this.loadAccounts()
      this.setDefaultDate()
    }
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {
    // 聚焦金额输入框
    setTimeout(() => {
      this.setData({
        amountFocus: true
      })
    }, 300)
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

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
   * 加载分类列表
   */
  loadCategories() {
    const that = this
    const db = wx.cloud.database()

    console.log(`开始加载分类列表，类型: ${this.data.billType}...`)

    db.collection('categories').where({
      type: this.data.billType
    }).get({
      success: res => {
        console.log('分类数据查询结果:', res)
        console.log(`查询到的 ${this.data.billType} 分类数量:`, res.data.length)

        that.setData({
          categories: res.data,
          selectedCategory: res.data.length > 0 ? res.data[0] : {}
        })
        
        // 加载分类后检查是否可以提交
        that.checkCanSubmit()

        if (res.data.length === 0) {
          console.warn('未找到分类数据，可能原因：')
          console.warn('1. 未运行 initDB 云函数')
          console.warn('2. 数据库权限设置不正确')
        }
      },
      fail: err => {
        console.error('加载分类失败:', err)
        wx.showModal({
          title: '加载失败',
          content: `无法加载分类数据：${err.errMsg || '未知错误'}`,
          showCancel: false,
          confirmText: '我知道了'
        })
      }
    })
  },

  /**
   * 加载账户列表
   */
  loadAccounts() {
    const that = this
    const db = wx.cloud.database()

    console.log('开始加载账户列表...')

    db.collection('accounts').get({
      success: res => {
        console.log('账户数据查询结果:', res)
        console.log('查询到的账户数量:', res.data.length)

        if (res.data.length === 0) {
          // 如果没有账户数据，提示用户
          console.warn('未找到账户数据，可能原因：')
          console.warn('1. 未运行 initDB 云函数')
          console.warn('2. 数据库权限设置不正确')
          console.warn('3. initDB 在无用户态下运行，openid 不匹配')

          that.setData({
            accounts: [],
            selectedAccount: {}
          })

          // 显示详细提示
          wx.showModal({
            title: '暂无账户',
            content: '请先运行 initDB 云函数初始化数据，或检查数据库权限设置（建议设置为"所有用户可读"）',
            showCancel: false,
            confirmText: '我知道了'
          })
        } else {
          console.log('账户列表:', res.data)

          that.setData({
            accounts: res.data,
            selectedAccount: res.data[0]
          })

          wx.showToast({
            title: `已加载 ${res.data.length} 个账户`,
            icon: 'none',
            duration: 1500
          })
        }
      },
      fail: err => {
        console.error('加载账户失败:', err)
        console.error('错误代码:', err.errCode)
        console.error('错误信息:', err.errMsg)

        wx.showModal({
          title: '加载失败',
          content: `无法加载账户数据：${err.errMsg || '未知错误'}`,
          showCancel: false,
          confirmText: '我知道了'
        })
      }
    })
  },

  /**
   * 加载账单详情
   */
  loadBillDetail(id) {
    const that = this
    const db = wx.cloud.database()

    console.log('开始加载账单详情，ID：', id)

    db.collection('bills').doc(id).get({
      success: res => {
        const bill = res.data
        console.log('账单详情加载成功：', bill)

        // 设置页面数据
        that.setData({
          billType: bill.type,
          amount: bill.amount.toString(),
          selectedCategory: bill.category,
          selectedAccount: bill.account,
          remark: bill.remark || '',
          // 格式化日期
          selectedDate: that.formatDateForInput(bill.date)
        })

        // 加载分类和账户列表
        that.loadCategories()
        that.loadAccounts()

        // 检查是否可以提交
        that.checkCanSubmit()
      },
      fail: err => {
        console.error('加载账单详情失败：', err)
        wx.showModal({
          title: '加载失败',
          content: `无法加载账单详情：${err.errMsg || '未知错误'}`,
          showCancel: false,
          confirmText: '我知道了'
        })
      }
    })
  },

  /**
   * 格式化日期为输入框格式
   */
  formatDateForInput(date) {
    const d = new Date(date)
    const year = d.getFullYear()
    const month = (d.getMonth() + 1).toString().padStart(2, '0')
    const day = d.getDate().toString().padStart(2, '0')
    return `${year}-${month}-${day}`
  },

  /**
   * 设置默认日期为今天
   */
  setDefaultDate() {
    const today = new Date()
    const year = today.getFullYear()
    const month = (today.getMonth() + 1).toString().padStart(2, '0')
    const day = today.getDate().toString().padStart(2, '0')
    this.setData({
      selectedDate: `${year}-${month}-${day}`
    })
  },

  /**
   * 切换收支类型
   */
  switchType(e) {
    const type = e.currentTarget.dataset.type
    this.setData({
      billType: type,
      selectedCategory: {},
      amount: '',
      canSubmit: false
    })
    this.loadCategories()
  },

  /**
   * 金额输入
   */
  onAmountInput(e) {
    let value = e.detail.value
    
    // 限制最多两位小数
    if (value.includes('.')) {
      const parts = value.split('.')
      if (parts[1] && parts[1].length > 2) {
        value = `${parts[0]}.${parts[1].substring(0, 2)}`
      }
    }
    
    this.setData({
      amount: value
    })
    
    this.checkCanSubmit()
  },

  /**
   * 选择分类
   */
  selectCategory(e) {
    const category = e.currentTarget.dataset.category
    this.setData({
      selectedCategory: category
    })
    this.checkCanSubmit()
  },

  /**
   * 显示账户选择
   */
  showAccountPicker() {
    const that = this
    
    // 检查账户列表是否为空
    if (!this.data.accounts || this.data.accounts.length === 0) {
      wx.showModal({
        title: '提示',
        content: '暂无账户，请先在「我的」页面创建账户',
        showCancel: false,
        confirmText: '我知道了'
      })
      return
    }
    
    const items = this.data.accounts.map(item => item.name)
    
    wx.showActionSheet({
      itemList: items,
      success(res) {
        that.setData({
          selectedAccount: that.data.accounts[res.tapIndex]
        })
      },
      fail(err) {
        console.error('显示账户选择失败:', err)
      }
    })
  },

  /**
   * 日期改变
   */
  onDateChange(e) {
    this.setData({
      selectedDate: e.detail.value
    })
  },

  /**
   * 显示备注输入
   */
  showRemarkInput() {
    this.setData({
      showRemarkModal: true
    })
  },

  /**
   * 关闭备注弹窗
   */
  closeRemarkModal() {
    this.setData({
      showRemarkModal: false
    })
  },

  /**
   * 备注输入
   */
  onRemarkInput(e) {
    this.setData({
      remark: e.detail.value
    })
  },

  /**
   * 确认备注
   */
  confirmRemark() {
    this.closeRemarkModal()
  },

  /**
   * 阻止冒泡
   */
  stopPropagation() {
    // 阻止事件冒泡
  },

  /**
   * 检查是否可以提交
   */
  checkCanSubmit() {
    const { amount, selectedCategory } = this.data
    const canSubmit = amount && parseFloat(amount) > 0 && selectedCategory._id
    this.setData({
      canSubmit
    })
  },

  /**
   * 提交账单
   */
  submitBill() {
    if (!this.data.canSubmit) return

    const that = this
    const db = wx.cloud.database()

    const bill = {
      type: this.data.billType,
      amount: parseFloat(this.data.amount),
      category: this.data.selectedCategory,
      account: this.data.selectedAccount,
      date: new Date(this.data.selectedDate),
      remark: this.data.remark,
      updateTime: db.serverDate()
    }

    console.log('准备保存账单，数据：', bill)

    wx.showLoading({
      title: this.data.billId ? '更新中...' : '保存中...'
    })

    if (this.data.billId) {
      // 更新现有账单
      db.collection('bills').doc(this.data.billId).update({
        data: bill,
        success: res => {
          console.log('账单更新成功：', res)
          wx.hideLoading()
          wx.showToast({
            title: '更新成功',
            icon: 'success'
          })

          // 延迟返回
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        },
        fail: err => {
          console.error('更新账单失败：', err)
          wx.hideLoading()
          wx.showModal({
            title: '更新失败',
            content: `无法更新账单：${err.errMsg || '未知错误'}`,
            showCancel: false
          })
        }
      })
    } else {
      // 创建新账单
      bill.createTime = db.serverDate()
      
      db.collection('bills').add({
        data: bill,
        success: res => {
          console.log('账单保存成功，_id：', res._id)
          wx.hideLoading()
          wx.showToast({
            title: '记账成功',
            icon: 'success'
          })

          // 延迟返回
          setTimeout(() => {
            wx.navigateBack()
          }, 1500)
        },
        fail: err => {
          console.error('保存账单失败：', err)
          wx.hideLoading()

          let errorMsg = '保存失败'
          if (err.errMsg && err.errMsg.includes('collection not exists')) {
            errorMsg = '数据库集合不存在，请先创建 bills 集合'
          } else if (err.errMsg && err.errMsg.includes('permission')) {
            errorMsg = '数据库权限不足，请检查 bills 集合权限'
          }

          wx.showModal({
            title: '保存失败',
            content: errorMsg,
            showCancel: false
          })
        }
      })
    }
  },

  /**
   * 删除账单
   */
  deleteBill() {
    const that = this
    const billId = this.data.billId
    
    if (!billId) return
    
    wx.showModal({
      title: '删除确认',
      content: '确定要删除这条账单记录吗？此操作不可恢复。',
      cancelText: '取消',
      confirmText: '删除',
      confirmColor: '#ff3b30',
      success: function(res) {
        if (res.confirm) {
          const db = wx.cloud.database()
          
          wx.showLoading({
            title: '删除中...'
          })
          
          db.collection('bills').doc(billId).remove({
            success: function(res) {
              console.log('账单删除成功：', res)
              wx.hideLoading()
              wx.showToast({
                title: '删除成功',
                icon: 'success'
              })
              
              // 延迟返回
              setTimeout(() => {
                wx.navigateBack()
              }, 1500)
            },
            fail: function(err) {
              console.error('删除账单失败：', err)
              wx.hideLoading()
              
              // 处理不同类型的错误
              let errorMsg = '删除失败'
              if (err.errMsg && err.errMsg.includes('permission')) {
                errorMsg = '权限不足，无法删除此账单'
              } else if (err.errMsg && err.errMsg.includes('document not found')) {
                errorMsg = '账单不存在或已被删除'
              } else if (err.errMsg && err.errMsg.includes('collection not exists')) {
                errorMsg = '数据库集合不存在，请先创建 bills 集合'
              }
              
              wx.showModal({
                title: '删除失败',
                content: errorMsg,
                showCancel: false
              })
            }
          })
        }
      }
    })
  }
})
