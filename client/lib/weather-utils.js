// 天气数据处理工具函数
// 从服务器端工具函数移植而来

const STATIC_SERVER_URL = 'https://tianqi-1d3bf9.tcb.qcloud.la'
const BACKGROUND_PERFIXER = `${STATIC_SERVER_URL}/bg`
const WEATHER_IMAGE_PERFIXER = `${STATIC_SERVER_URL}/icon`

// 获取天气名称
const getWeatherName = (code) => {
  code = parseInt(code)
  let result = 'rain'
  if (code === 100 || (code >= 200 && code <= 204)) {
    result = 'clear'
  } else if (code > 100 && code <= 103) {
    result = 'cloud'
  } else if (code === 104 || (code >= 205 && code <= 208)) {
    result = 'overcast'
  } else if (code >= 302 && code <= 304) {
    result = 'thunder'
  } else if (code >= 400 && code < 500) {
    result = 'snow'
  } else if ((code >= 511 && code <= 513) || code === 502) {
    result = 'smog'
  } else if (code === 501 || (code >= 514 && code <= 515) || (code >= 509 && code <= 510)) {
    result = 'smog'
  } else if (code >= 503 && code < 508) {
    result = 'smog'
  } else if (code >= 900) {
    result = 'clear'
  }
  return result
}

// 获取背景图片
const getBackgroundImage = (weather, isNight) => {
  const time = isNight ? 'night' : 'day'
  return `${BACKGROUND_PERFIXER}/${time}/${weather}.jpg`
}

// 获取背景颜色
const getBackgroundColor = (name, night = 'day') => {
  name = `${night}_${name}`
  const map = {
    day_cloud: '62aadc',
    night_cloud: '27446f',
    day_rain: '2f4484',
    night_rain: '284469',
    day_thunder: '3a4482',
    night_thunder: '2a2b5a',
    day_clear: '57b9e2',
    night_clear: '173868',
    day_overcast: '5c7a93',
    night_overcast: '22364d',
    day_snow: '95d1ed',
    night_snow: '7a98bc',
    night_smog: '494d57'
  }
  let color = map[name] ? map[name] : '27446f'
  return `#${color}`
}

// 获取图标名称
const getIconNameByCode = (code, isNight) => {
  const nightMap = {
    '100': 'qingye', '200': 'qingye', '201': 'qingye', '202': 'qingye', '203': 'qingye', '204': 'qingye',
    '101': 'duoyunye', '102': 'duoyunye', '103': 'duoyunye',
    '300': 'zhenyuye', '301': 'zhenyuye', '302': 'zhenyuye', '303': 'zhenyuye', '304': 'zhenyuye',
    '305': 'zhenyuye', '306': 'zhenyuye', '307': 'zhenyuye', '308': 'zhenyuye', '309': 'zhenyuye',
    '310': 'zhenyuye', '311': 'zhenyuye', '312': 'zhenyuye', '313': 'zhenyuye', '314': 'zhenyuye',
    '315': 'zhenyuye', '316': 'zhenyuye', '317': 'zhenyuye', '318': 'zhenyuye', '399': 'zhenyuye',
    '400': 'zhenxueye', '401': 'zhenxueye', '402': 'zhenxueye', '403': 'zhenxueye', '404': 'zhenxueye',
    '405': 'zhenxueye', '406': 'zhenxueye', '407': 'zhenxueye', '408': 'zhenxueye', '409': 'zhenxueye',
    '410': 'zhenxueye', '499': 'zhenxueye'
  }
  const dayMap = {
    '100': 'qingbai', '101': 'duoyunbai', '102': 'duoyunbai', '103': 'duoyunbai', '104': 'yin',
    '201': 'qingye', '202': 'qingye', '203': 'qingye', '204': 'qingye',
    '205': 'fengli', '206': 'fengli', '207': 'fengli', '208': 'fengli',
    '209': 'yin', '210': 'yin', '211': 'yin', '212': 'yin', '213': 'yin',
    '300': 'zhenyubai', '301': 'zhenyubai', '302': 'leizhenyu', '303': 'leizhenyu',
    '304': 'leizhenyuzhuanbingbao', '305': 'xiaoyu', '306': 'zhongyu', '307': 'dayu',
    '308': 'tedabaoyu', '309': 'xiaoyu', '310': 'baoyu', '311': 'dabaoyu', '312': 'tedabaoyu',
    '313': 'dongyu', '314': 'xiaoyu', '315': 'zhongyu', '316': 'dayu', '317': 'baoyu',
    '318': 'dabaoyu', '399': 'xiaoyu',
    '400': 'xiaoxue', '401': 'zhongxue', '402': 'daxue', '403': 'baoxue',
    '404': 'yujiaxue', '405': 'yujiaxue', '406': 'yujiaxue', '407': 'zhenxuebai',
    '408': 'xiaoxue', '409': 'zhongxue', '410': 'daxue', '499': 'xiaoxue',
    '500': 'wu', '501': 'wu', '502': 'wumaibai', '503': 'yangsha', '504': 'yangsha',
    '507': 'shachenbao', '508': 'qiangshachenbao', '509': 'wu', '510': 'wu',
    '511': 'wumaibai', '512': 'wumaibai', '513': 'wumaibai', '514': 'wu', '515': 'wu',
    '900': 'qingbai', '901': 'qingbai', '902': 'yin'
  }
  if (isNight && nightMap[code]) {
    return nightMap[code]
  }
  return dayMap[code] ? dayMap[code] : 'yin'
}

// 获取特效设置
const getEffectSettings = (code) => {
  code = parseInt(code)
  let result = false

  if ((code >= 300 && code <= 304) || code === 309 || code === 313 || code == 399 || code === 406 || code === 404) {
    result = { name: 'rain', amount: 100 }
  } else if (code === 499 || code === 405) {
    result = { name: 'snow', amount: 70 }
  } else if (code >= 305 && code <= 312) {
    let amount = 100 + (code - 305) * 10
    result = { name: 'rain', amount: amount }
  } else if (code >= 314 && code <= 318) {
    let amount = 100 + (code - 314) * 10
    result = { name: 'rain', amount: amount }
  } else if (code >= 400 && code <= 403) {
    let amount = 60 + (code - 400) * 10
    result = { name: 'snow', amount: amount }
  } else if (code >= 407 && code <= 410) {
    let amount = 60 + (code - 407) * 10
    result = { name: 'snow', amount: amount }
  }

  return result
}

// 获取一句话
const getOneWord = (code) => {
  const list = [
    '生活是天气，有阴有晴有风雨',
    '心怀感恩，幸福常在',
    '心累的时候，换个心情看世界',
    '想获得人生的金子，就必须淘尽生活的沙烁',
    '因为有明天，今天永远只是起跑线',
    '只要心情是晴朗的，人生就没有雨天',
    '有你的城市下雨也美丽',
    '雨划过我窗前，玻璃也在流眼泪',
    '天空澄碧，纤云不染',
    '人生，不要被安逸所控制',
    '在受伤的时候，也能浅浅的微笑',
    '不抱怨过去，不迷茫未来，只感恩现在',
    '生活向前，你向阳光',
    '在阳光中我学会欢笑，在阴云中我学会坚强'
  ]
  let index = Math.floor(Math.random() * list.length)
  return list[index] ? list[index] : list[0]
}

// 判断是否夜晚
const _isNight = (now, sunrise, sunset) => {
  if (!sunrise || !sunset) return false
  // 将时间字符串（如 "06:58"）转换为小时数
  const sunriseHour = parseInt(sunrise.split(':')[0])
  const sunsetHour = parseInt(sunset.split(':')[0])
  let isNight = false
  if (now > sunsetHour) {
    isNight = true
  } else if (now < sunriseHour) {
    isNight = true
  }
  return isNight
}

// 处理当前天气数据（API v7格式）
const _now = (nowData, dailyData) => {
  if (!nowData) return null
  
  let { temp, feelsLike, windDir, windScale, windSpeed, humidity, text, icon, obsTime } = nowData
  // 从每日预报中获取日出日落时间
  const firstDaily = dailyData && dailyData.length > 0 ? dailyData[0] : null
  const sunrise = firstDaily ? firstDaily.sunrise : null
  const sunset = firstDaily ? firstDaily.sunset : null
  
  // 获取当前小时
  let hours = new Date().getHours()
  let isNight = _isNight(hours, sunrise, sunset)
  
  // icon是字符串，需要转换为数字
  const iconCode = parseInt(icon) || 100
  let name = getWeatherName(iconCode)
  
  return {
    backgroundImage: getBackgroundImage(name, isNight),
    backgroundColor: getBackgroundColor(name, isNight ? 'night' : 'day'),
    temp: feelsLike || temp, // 使用体感温度，如果没有则用温度
    wind: windDir,
    windLevel: windScale,
    weather: text,
    humidity: humidity,
    icon: getIconNameByCode(iconCode.toString(), isNight),
    ts: obsTime || new Date().toISOString()
  }
}

// 处理小时天气数据（API v7格式）
const _hourly = (hourlyData, dailyData) => {
  if (!hourlyData || !Array.isArray(hourlyData)) return []
  
  let hourly = []
  const firstDaily = dailyData && dailyData.length > 0 ? dailyData[0] : null
  const sunrise = firstDaily ? firstDaily.sunrise : null
  const sunset = firstDaily ? firstDaily.sunset : null

  for (let i = 0; i < hourlyData.length; i++) {
    let r = hourlyData[i]
    if (!r || !r.fxTime) {
      continue
    }
    // fxTime格式：2021-02-16T15:00+08:00
    let timeStr = r.fxTime
    let hours = parseInt(timeStr.slice(11, 13))
    let isNight = _isNight(hours, sunrise, sunset)
    
    const iconCode = parseInt(r.icon) || 100

    hourly.push({
      temp: r.temp,
      time: hours + ':00',
      weather: r.text,
      icon: getIconNameByCode(iconCode.toString(), isNight)
    })
  }

  return hourly
}

// 处理每日天气数据（API v7格式）
const _daily = (data) => {
  if (!data || !Array.isArray(data)) return []
  
  let weekly = []
  for (let i = 0; i < Math.min(data.length, 7); i++) {
    let r = data[i]
    if (!r) continue
    
    const dayIconCode = parseInt(r.iconDay) || 100
    const nightIconCode = parseInt(r.iconNight) || 150
    
    weekly.push({
      day: r.textDay,
      dayIcon: getIconNameByCode(dayIconCode.toString()),
      dayWind: r.windDirDay,
      dayWindLevel: r.windScaleDay,
      maxTemp: r.tempMax,
      minTemp: r.tempMin,
      night: r.textNight,
      nightIcon: getIconNameByCode(nightIconCode.toString(), true),
      nightWind: r.windDirNight,
      nightWindLevel: r.windScaleNight,
      time: new Date(r.fxDate).getTime()
    })
  }
  return weekly
}

// 处理生活指数数据
const _lifestyle = (data) => {
  let arr = []
  const map = {
    cw: { icon: 'xichezhishu', name: '洗车' },
    sport: { icon: 'yundongzhishu', name: '运动' },
    flu: { icon: 'ganmao', name: '感冒' },
    uv: { icon: 'ziwaixian', name: '紫外线强度' },
    drsg: { icon: 'liangshai', name: '穿衣' },
    air: { icon: 'beikouzhao', name: '污染扩散' },
    trav: { icon: 'fangshai', name: '旅游' },
    comf: { icon: 'shushi', name: '舒适度' }
  }

  for (let i = 0; i < data.length; i++) {
    let r = data[i]
    if (map[r.type]) {
      arr.push({
        icon: map[r.type].icon,
        name: map[r.type].name,
        detail: r.txt
      })
    }
  }
  return arr
}

// 空气质量背景色
const airBackgroundColor = (aqi) => {
  if (aqi < 50) {
    return '#00cf9a'
  } else if (aqi < 100) {
    return '#00cf9a'
  } else if (aqi < 200) {
    return '#4295f4'
  } else if (aqi > 300) {
    return '#ff6600'
  }
  return '#00cf9a'
}

// 处理天气数据（API v7格式）
const handlerData = (data) => {
  if (!data || !data.now) {
    return {
      status: 500,
      msg: '数据格式错误'
    }
  }
  
  const { now, daily = [], hourly = [] } = data
  const iconCode = parseInt(now.icon) || 100
  
  return {
    status: 0,
    effect: getEffectSettings(iconCode),
    oneWord: getOneWord(iconCode),
    current: _now(now, daily),
    hourly: _hourly(hourly, daily),
    lifeStyle: [], // API v7需要单独调用生活指数接口，这里先返回空数组
    daily: _daily(daily)
  }
}

module.exports = {
  handlerData,
  airBackgroundColor
}
