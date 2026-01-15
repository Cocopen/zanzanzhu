// 云函数入口文件
const cloud = require('wx-server-sdk')
cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})
const db = cloud.database()
const _ = db.command

// 云函数入口函数
exports.main = async (event, context) => {
  const wxContext = cloud.getWXContext()
  const openid = wxContext.OPENID
  const { year, month, type } = event
  
  try {
    let startDate, endDate
    
    if (type === 'month') {
      startDate = new Date(year, month - 1, 1)
      endDate = new Date(year, month, 0, 23, 59, 59)
    } else {
      startDate = new Date(year, 0, 1)
      endDate = new Date(year, 11, 31, 23, 59, 59)
    }
    
    // 获取收入统计
    const incomeRes = await db.collection('bills')
      .where({
        _openid: openid,
        type: 'income',
        date: _.gte(startDate).and(_.lte(endDate))
      })
      .get()
    
    let totalIncome = 0
    const incomeByCategory = {}
    incomeRes.data.forEach(bill => {
      totalIncome += parseFloat(bill.amount)
      const categoryName = bill.category.name
      if (!incomeByCategory[categoryName]) {
        incomeByCategory[categoryName] = 0
      }
      incomeByCategory[categoryName] += parseFloat(bill.amount)
    })
    
    // 获取支出统计
    const expenseRes = await db.collection('bills')
      .where({
        _openid: openid,
        type: 'expense',
        date: _.gte(startDate).and(_.lte(endDate))
      })
      .get()
    
    let totalExpense = 0
    const expenseByCategory = {}
    expenseRes.data.forEach(bill => {
      totalExpense += parseFloat(bill.amount)
      const categoryName = bill.category.name
      if (!expenseByCategory[categoryName]) {
        expenseByCategory[categoryName] = 0
      }
      expenseByCategory[categoryName] += parseFloat(bill.amount)
    })
    
    // 计算趋势（对比上月）
    const prevMonth = month === 1 ? 12 : month - 1
    const prevYear = month === 1 ? year - 1 : year
    const prevStartDate = new Date(prevYear, prevMonth - 1, 1)
    const prevEndDate = new Date(prevYear, prevMonth, 0, 23, 59, 59)
    
    const prevIncomeRes = await db.collection('bills')
      .where({
        _openid: openid,
        type: 'income',
        date: _.gte(prevStartDate).and(_.lte(prevEndDate))
      })
      .get()
    
    let prevIncome = 0
    prevIncomeRes.data.forEach(bill => {
      prevIncome += parseFloat(bill.amount)
    })
    
    const prevExpenseRes = await db.collection('bills')
      .where({
        _openid: openid,
        type: 'expense',
        date: _.gte(prevStartDate).and(_.lte(prevEndDate))
      })
      .get()
    
    let prevExpense = 0
    prevExpenseRes.data.forEach(bill => {
      prevExpense += parseFloat(bill.amount)
    })
    
    // 计算趋势百分比
    const incomeTrend = prevIncome > 0 ? ((totalIncome - prevIncome) / prevIncome * 100).toFixed(1) : 0
    const expenseTrend = prevExpense > 0 ? ((totalExpense - prevExpense) / prevExpense * 100).toFixed(1) : 0
    
    return {
      success: true,
      data: {
        totalIncome: totalIncome.toFixed(2),
        totalExpense: totalExpense.toFixed(2),
        totalBalance: (totalIncome - totalExpense).toFixed(2),
        incomeByCategory,
        expenseByCategory,
        incomeTrend: parseFloat(incomeTrend),
        expenseTrend: parseFloat(expenseTrend),
        billCount: incomeRes.data.length + expenseRes.data.length
      }
    }
  } catch (err) {
    console.error('获取统计数据失败', err)
    return {
      success: false,
      error: err.message
    }
  }
}
