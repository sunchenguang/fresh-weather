import Promise from './bluebird'
import { handlerData, airBackgroundColor } from './weather-utils'

const QQ_MAP_KEY = 'GHZBZ-KAFKK-NHEJQ-AWVEU-VO4EE-23FKU'

// 和风天气API v7 配置
// 请前往 https://console.qweather.com/ 获取你的API Host和API KEY
// 1. 登录控制台，在"设置"中查看你的API Host（格式如：abc1234xyz.def.qweatherapi.com）
// 2. 在"项目管理"中创建凭据，选择API KEY方式，获取你的API KEY
// 3. 将下面的配置替换为你的实际值
// 注意：需要在微信公众平台配置 request 合法域名：你的API Host域名
const QWEATHER_API_HOST = 'n444txw66r.re.qweatherapi.com' // 请替换为你的API Host
const QWEATHER_API_KEY = 'd9c64249ed7846429266edb41a9807d3' // 请替换为你的API KEY

// API路径
const QWEATHER_API_BASE = `https://${QWEATHER_API_HOST}/v7`
const WEATHER_NOW_API = `${QWEATHER_API_BASE}/weather/now` // 实时天气
const WEATHER_7D_API = `${QWEATHER_API_BASE}/weather/7d` // 7天预报
const WEATHER_24H_API = `${QWEATHER_API_BASE}/weather/24h` // 24小时预报
const AIR_NOW_API = `${QWEATHER_API_BASE}/air/now` // 实时空气质量

wx.cloud.init({
  // env: 'demo1-c42c54'
  env: 'bingbingweather-6g24fj06657b614a'
})

const db = wx.cloud.database()

/**
 * 当前选中的月份的心情
 * @param openid
 * @param year
 * @param month
 * @returns {*}
 */
export const getEmotionByOpenidAndDate = (openid, year, month) => {
  const _ = db.command
  year = parseInt(year)
  month = parseInt(month)
  const now = new Date()
  const curMonth = now.getMonth()
  const curYear = now.getFullYear()
  const curDay = now.getDate()
  let start = new Date(year, month - 1, 1).getTime()
  let end = new Date(year, month, 1).getTime()
  if (month - 1 === curMonth && curDay <= 20 && year === curYear) {
    // 如果是当前月份并且天数少于20，那么就一次取出
    return db
      .collection('diary')
      .where({
        openid,
        tsModified: _.gte(start).and(_.lt(end))
      })
      .get()
  }

  // 这里因为限制 limit20，所以查询两次，一共31条（最多31天）记录
  return new Promise((resolve, reject) => {
    Promise.all([
      db
        .collection('diary')
        .where({
          openid,
          tsModified: _.gte(start).and(_.lt(end))
        })
        .orderBy('tsModified', 'desc')
        .limit(15)
        .get(),
      db
        .collection('diary')
        .where({
          openid,
          tsModified: _.gte(start).and(_.lt(end))
        })
        .orderBy('tsModified', 'asc')
        .limit(16)
        .get()
    ])
      .then((data) => {
        //去重
        let [data1, data2] = data
        let set = new Set()
        data1 = data1.data || []
        data2 = data2.data || []
        data = data1.concat(data2).filter((v) => {
          if (set.has(v._id)) {
            return false
          }
          set.add(v._id)
          return true
        })
        resolve({data})
      })
      .catch((e) => {
        reject(e)
      })
  })
}

/**
 * 新增一个心情
 * @param openid
 * @param emotion
 * @returns {*}
 */
export const addEmotion = (openid, emotion) => {
  return db.collection('diary').add({
    data: {
      openid,
      emotion,
      tsModified: Date.now()
    }
  })
}

/**
 *  逆经纬度查询
 * @param {*} lat
 * @param {*} lon
 * @param success
 * @param fail
 */
export const geocoder = (lat, lon, success = () => {}, fail = () => {}) => {
  return wx.request({
    url: 'https://apis.map.qq.com/ws/geocoder/v1/',
    data: {
      location: `${lat},${lon}`,
      key: QQ_MAP_KEY,
      get_poi: 0
    },
    success,
    fail
  })
}
/**
 * 调用微信接口获取openid
 * @param {*} code
 */
export const jscode2session = (code) => {
  return wx.cloud.callFunction({
    name: 'jscode2session',
    data: {
      code
    }
  })
}
/**
 * 获取心情
 */
export const getMood = (province, city, county, success = () => {}) => {
  return wx.request({
    url: 'https://wis.qq.com/weather/common',
    data: {
      source: 'wxa',
      weather_type: 'tips',
      province,
      city,
      county
    },
    success
  })
}
/**
 * 获取和风天气（合并实时天气、7天预报、24小时预报）
 * @param {*} lat 纬度
 * @param {*} lon 经度
 */
export const getWeather = (lat, lon) => {
  return new Promise((resolve, reject) => {
    // 验证参数
    if (!lat || !lon || isNaN(lat) || isNaN(lon)) {
      reject(new Error('经纬度参数无效'))
      return
    }
    
    // 和风天气API要求格式：经度,纬度（lon,lat）
    const location = `${lon},${lat}`
    
    // 并行请求三个接口
    Promise.all([
      // 实时天气
      requestWeatherAPI(WEATHER_NOW_API, location),
      // 7天预报
      requestWeatherAPI(WEATHER_7D_API, location),
      // 24小时预报
      requestWeatherAPI(WEATHER_24H_API, location)
    ]).then(([nowRes, dailyRes, hourlyRes]) => {
      // 检查每个请求是否成功
      if (nowRes.code !== '200' || dailyRes.code !== '200' || hourlyRes.code !== '200') {
        // 输出详细错误信息
        const errors = []
        if (nowRes.code !== '200') errors.push(`实时天气: ${nowRes.code}`)
        if (dailyRes.code !== '200') errors.push(`7天预报: ${dailyRes.code}`)
        if (hourlyRes.code !== '200') errors.push(`24小时预报: ${hourlyRes.code}`)
        reject(new Error(`部分API请求失败: ${errors.join(', ')}`))
        return
      }
      
      // 合并数据并处理
      const mergedData = {
        now: nowRes.now,
        daily: dailyRes.daily || [],
        hourly: hourlyRes.hourly || []
      }
      
      const result = handlerData(mergedData)
      resolve({ result })
    }).catch(reject)
  })
}

/**
 * 请求天气API的通用方法
 */
function requestWeatherAPI(apiUrl, location) {
  return new Promise((resolve, reject) => {
    // 验证location参数
    if (!location || location.trim() === '') {
      reject(new Error('location参数不能为空'))
      return
    }
    
    // 使用URL参数方式传递key（推荐），或者使用Header方式，不要同时使用两种
    const query = `location=${encodeURIComponent(location)}&key=${QWEATHER_API_KEY}`
    const url = `${apiUrl}?${query}`
    
    wx.request({
      url: url,
      method: 'GET',
      // 注意：不要同时使用Header和URL参数两种认证方式
      // 如果使用Header方式，注释掉URL中的key参数
      // header: {
      //   'X-QW-Api-Key': QWEATHER_API_KEY
      // },
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
            
            // 处理API返回的错误
            if (data.code === '200') {
              resolve(data)
            } else {
              // 输出详细错误信息
              const errorMsg = data.error ? 
                `${data.error.title}: ${data.error.detail}` : 
                `API返回错误: ${data.code}`
              reject(new Error(errorMsg))
            }
          } catch (e) {
            reject(new Error(`数据解析失败: ${e.message}`))
          }
        } else {
          reject(new Error(`请求失败，状态码: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(new Error(`网络请求失败: ${err.errMsg || err.message || '未知错误'}`))
      }
    })
  })
}
/**
 * 获取和风空气质量
 * @param {*} location 可以是城市名称或经纬度坐标（格式：经度,纬度，如：116.41,39.92）
 */
export const getAir = (location) => {
  return new Promise((resolve, reject) => {
    // 验证location参数
    if (!location || location.trim() === '') {
      reject(new Error('location参数不能为空'))
      return
    }
    
    const query = `location=${encodeURIComponent(location)}&key=${QWEATHER_API_KEY}`
    const url = `${AIR_NOW_API}?${query}`
    
    wx.request({
      url: url,
      method: 'GET',
      // 注意：不要同时使用Header和URL参数两种认证方式
      // header: {
      //   'X-QW-Api-Key': QWEATHER_API_KEY
      // },
      success: (res) => {
        if (res.statusCode === 200) {
          try {
            const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
            
            if (data.code === '200' && data.now) {
              const { aqi, category } = data.now
              resolve({
                result: {
                  status: 0,
                  aqi: parseInt(aqi) || 0,
                  color: airBackgroundColor(parseInt(aqi) || 0),
                  name: category || '未知'
                }
              })
            } else {
              // 处理API错误
              const errorMsg = data.error ? 
                `${data.error.title}: ${data.error.detail}` : 
                `API返回错误: ${data.code}`
              resolve({
                result: {
                  status: 500,
                  msg: errorMsg
                }
              })
            }
          } catch (e) {
            reject(new Error(`数据解析失败: ${e.message}`))
          }
        } else {
          reject(new Error(`请求失败，状态码: ${res.statusCode}`))
        }
      },
      fail: (err) => {
        reject(new Error(`网络请求失败: ${err.errMsg || err.message || '未知错误'}`))
      }
    })
  })
}
