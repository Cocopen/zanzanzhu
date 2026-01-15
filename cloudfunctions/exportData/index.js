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
  
  try {
    // 获取所有账单数据
    const billsRes = await db.collection('bills')
      .where({
        _openid: openid
      })
      .orderBy('date', 'desc')
      .get()
    
    // 获取用户信息
    const userRes = await db.collection('users')
      .where({
        _openid: openid
      })
      .get()
    
    // 导出数据
    const exportData = {
      user: userRes.data[0] || {},
      bills: billsRes.data,
      exportTime: new Date(),
      totalCount: billsRes.data.length
    }
    
    // 生成文件名
    const date = new Date()
    const filename = `finance_export_${date.getTime()}.json`
    
    // 上传到云存储
    const fileRes = await cloud.uploadFile({
      cloudPath: `exports/${filename}`,
      fileContent: JSON.stringify(exportData, null, 2)
    })
    
    return {
      success: true,
      fileID: fileRes.fileID,
      data: exportData
    }
  } catch (err) {
    console.error('导出数据失败', err)
    return {
      success: false,
      error: err.message
    }
  }
}
