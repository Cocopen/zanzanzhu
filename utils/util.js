// utils/util.js

/**
 * 格式化日期
 */
function formatTime(date) {
  const year = date.getFullYear()
  const month = (date.getMonth() + 1).toString().padStart(2, '0')
  const day = date.getDate().toString().padStart(2, '0')
  const hour = date.getHours().toString().padStart(2, '0')
  const minute = date.getMinutes().toString().padStart(2, '0')
  const second = date.getSeconds().toString().padStart(2, '0')

  return `${year}-${month}-${day} ${hour}:${minute}:${second}`
}

/**
 * 格式化日期（短格式）
 */
function formatDateShort(date) {
  const d = new Date(date)
  const year = d.getFullYear()
  const month = (d.getMonth() + 1).toString().padStart(2, '0')
  const day = d.getDate().toString().padStart(2, '0')
  return `${year}-${month}-${day}`
}

/**
 * 格式化金额
 */
function formatMoney(amount) {
  return parseFloat(amount).toFixed(2)
}

/**
 * 格式化数字（添加千位分隔符）
 */
function formatNumber(num) {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',')
}

/**
 * 计算两个日期之间的天数
 */
function getDaysBetween(date1, date2) {
  const oneDay = 24 * 60 * 60 * 1000
  const firstDate = new Date(date1)
  const secondDate = new Date(date2)
  return Math.round(Math.abs((firstDate - secondDate) / oneDay))
}

/**
 * 获取月份的第一天
 */
function getFirstDayOfMonth(date) {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

/**
 * 获取月份的最后一天
 */
function getLastDayOfMonth(date) {
  const d = new Date(date)
  return new Date(d.getFullYear(), d.getMonth() + 1, 0)
}

/**
 * 获取本周的开始日期
 */
function getStartOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay() || 7
  if (day !== 1) d.setHours(-24 * (day - 1))
  return d
}

/**
 * 获取本周的结束日期
 */
function getEndOfWeek(date) {
  const d = new Date(date)
  const day = d.getDay() || 7
  if (day !== 7) d.setHours(24 * (7 - day))
  return d
}

/**
 * 防抖函数
 */
function debounce(func, wait) {
  let timeout
  return function (...args) {
    clearTimeout(timeout)
    timeout = setTimeout(() => {
      func.apply(this, args)
    }, wait)
  }
}

/**
 * 节流函数
 */
function throttle(func, wait) {
  let timeout
  return function (...args) {
    if (!timeout) {
      timeout = setTimeout(() => {
        timeout = null
        func.apply(this, args)
      }, wait)
    }
  }
}

/**
 * 深拷贝
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj)
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  
  const clonedObj = {}
  for (let key in obj) {
    if (obj.hasOwnProperty(key)) {
      clonedObj[key] = deepClone(obj[key])
    }
  }
  return clonedObj
}

/**
 * 生成唯一ID
 */
function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2)
}

/**
 * 检查是否为空对象
 */
function isEmpty(obj) {
  return Object.keys(obj).length === 0
}

/**
 * 检查是否为空值
 */
function isNull(value) {
  return value === null || value === undefined || value === ''
}

module.exports = {
  formatTime,
  formatDateShort,
  formatMoney,
  formatNumber,
  getDaysBetween,
  getFirstDayOfMonth,
  getLastDayOfMonth,
  getStartOfWeek,
  getEndOfWeek,
  debounce,
  throttle,
  deepClone,
  generateId,
  isEmpty,
  isNull
}
