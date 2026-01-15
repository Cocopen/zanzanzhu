// 数据库初始化脚本
// 在小程序云开发控制台 -> 云函数中创建 initDB 云函数并运行此脚本

const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()

// 预设分类数据
const categories = [
  // 支出分类
  {
    type: 'expense',
    name: '餐饮',
    icon: '🍔',
    color: '#ff3b30',
    sort: 1
  },
  {
    type: 'expense',
    name: '交通',
    icon: '🚗',
    color: '#ff9500',
    sort: 2
  },
  {
    type: 'expense',
    name: '购物',
    icon: '🛒',
    color: '#ff2d55',
    sort: 3
  },
  {
    type: 'expense',
    name: '娱乐',
    icon: '🎮',
    color: '#af52de',
    sort: 4
  },
  {
    type: 'expense',
    name: '医疗',
    icon: '💊',
    color: '#ff375f',
    sort: 5
  },
  {
    type: 'expense',
    name: '教育',
    icon: '📚',
    color: '#5ac8fa',
    sort: 6
  },
  {
    type: 'expense',
    name: '居住',
    icon: '🏠',
    color: '#007aff',
    sort: 7
  },
  {
    type: 'expense',
    name: '通讯',
    icon: '📱',
    color: '#5856d6',
    sort: 8
  },
  {
    type: 'expense',
    name: '其他',
    icon: '📦',
    color: '#8e8e93',
    sort: 9
  },
  // 收入分类
  {
    type: 'income',
    name: '工资',
    icon: '💰',
    color: '#34c759',
    sort: 1
  },
  {
    type: 'income',
    name: '奖金',
    icon: '🎁',
    color: '#30d158',
    sort: 2
  },
  {
    type: 'income',
    name: '投资',
    icon: '📈',
    color: '#32d74b',
    sort: 3
  },
  {
    type: 'income',
    name: '兼职',
    icon: '💼',
    color: '#30b0c7',
    sort: 4
  },
  {
    type: 'income',
    name: '其他',
    icon: '💵',
    color: '#28cd41',
    sort: 5
  }
]

// 预设账户数据
const accounts = [
  {
    name: '现金',
    icon: '💵',
    color: '#34c759',
    sort: 1,
    balance: 0
  },
  {
    name: '微信',
    icon: '💬',
    color: '#07c160',
    sort: 2,
    balance: 0
  },
  {
    name: '支付宝',
    icon: '🔵',
    color: '#1677ff',
    sort: 3,
    balance: 0
  },
  {
    name: '银行卡',
    icon: '💳',
    color: '#ff9500',
    sort: 4,
    balance: 0
  }
]

// 初始化数据库
exports.main = async (event, context) => {
  try {
    // 初始化分类数据
    for (const category of categories) {
      const existing = await db.collection('categories').where({
        name: category.name,
        type: category.type
      }).get()
      
      if (existing.data.length === 0) {
        await db.collection('categories').add({
          data: {
            ...category,
            createTime: db.serverDate()
          }
        })
        console.log(`添加分类: ${category.name}`)
      }
    }
    
    // 初始化账户数据
    for (const account of accounts) {
      const existing = await db.collection('accounts').where({
        name: account.name
      }).get()
      
      if (existing.data.length === 0) {
        await db.collection('accounts').add({
          data: {
            ...account,
            createTime: db.serverDate()
          }
        })
        console.log(`添加账户: ${account.name}`)
      }
    }
    
    return {
      success: true,
      message: '数据库初始化成功'
    }
  } catch (err) {
    console.error('初始化数据库失败', err)
    return {
      success: false,
      error: err.message
    }
  }
}
