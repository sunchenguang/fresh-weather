import {fixChart, getChartConfig, drawEffect} from '../../lib/utils'
import Chart from '../../lib/chartjs/chart'
import {getMood, geocoder, getWeather, getAir} from '../../lib/api'
import {callHello} from '../../lib/cloud'

const app = getApp()
/** 先点「今天」再点「明天」进入求婚新动线的间隔（毫秒） */
const EASTER_EGG_WINDOW_MS = 12000

let can = false
let effectInstance
const EFFECT_CANVAS_HEIGHT = 768 / 2
const CHART_CANVAS_HEIGHT = 272 / 2
let isUpdate = false
Page({
  data: {
    // 页面数据
    statusBarHeight: 32,
    backgroundImage: '../../images/cloud.jpg',
    backgroundColor: '#62aadc',
    current: {
      temp: '0',
      weather: '数据获取中',
      humidity: '1',
      icon: 'xiaolian'
    },
    today: {
      temp: 'N/A',
      weather: '暂无'
    },
    tomorrow: {
      temp: 'N/A',
      weather: '暂无'
    },
    // hourlyData
    hourlyData: [],
    city: '北京',
    weeklyData: [],
    width: 375,
    scale: 1,
    address: '定位中',
    lat: 40.056974,
    lon: 116.307689
  },
  inDays(d1, d2) {
    var t2 = d2.getTime();
    var t1 = d1.getTime();

    return Math.floor((t2-t1)/(24*3600*1000));
  },
  /**
   * 根据this.data中的对应字段
   * 1. 获取天气
   * 2. 获取空气质量
   * 3. 获取心情
   * @param cb
   */
  getWeatherData(cb) {
    wx.showLoading({
      title: '获取数据中',
      mask: true
    })
    const fail = (e) => {
      wx.hideLoading()
      if (typeof cb === 'function') {
        cb()
      }
      // 输出详细错误信息到控制台，方便调试
      console.error('天气数据加载失败:', e)
      const errorMsg = e && e.message ? e.message : (e && e.errMsg ? e.errMsg : '未知错误')
      console.error('错误详情:', errorMsg)
      
      // 在开发环境显示详细错误，生产环境显示通用提示
      const isDev = typeof __DEV__ !== 'undefined' && __DEV__
      wx.showToast({
        title: isDev ? `加载失败: ${errorMsg.substring(0, 20)}...` : '加载失败，请稍后再试',
        icon: 'none',
        duration: 3000
      })
    }
    const {lat, lon, province, city, county} = this.data
    //获取天气
    getWeather(lat, lon)
      .then((res) => {
        wx.hideLoading()
        if (typeof cb === 'function') {
          cb()
        }
        if (res.result) {
          // 先于 render（setData / 图表 / 缓存）发起 AI 建议，整体更早出结果
          this.requestWeatherAdviceToast(res.result)
          this.render(res.result)
        } else {
          fail()
        }
      })
      .catch(fail)

    // 获取空气质量（使用经纬度，更准确）
    // 注意：和风天气API要求格式为：经度,纬度（lon,lat）
    getAir(`${lon},${lat}`)
      .then((res) => {
        if (res && res.result) {
          this.setData({
            air: res.result
          })
        }
      })
      .catch((e) => {})

    // 获取心情
    getMood(province, city, county, (res) => {
      let result = (res.data || {}).data
      if (result && result.tips) {
        var dString = "2021-07-26";
        var dString1 = "2022-01-01";

        var d1 = new Date(dString);
        var d1_1 = new Date(dString1);
        var d2 = new Date();
        this.setData({
          tips: '冰冰，今天是我们认识的第'+this.inDays(d1,d2)+'天\n\n在一起的第'+this.inDays(d1_1,d2)+'天，有你真好！\n'
        })
      }
    })
  },
  /**
   * 处理逆经纬度，并且获取天气数据
   * 根据经纬度找到国家，省份，城市
   * @param lat
   * @param lon
   * @param name
   */
  getAddress(lat, lon, name) {
    wx.showLoading({
      title: '定位中',
      mask: true
    })
    let fail = (e) => {
      this.setData({
        address: name || '北京市海淀区西二旗北路'
      })
      wx.hideLoading()

      this.getWeatherData()
    }
    geocoder(
      lat,
      lon,
      (res) => {
        wx.hideLoading()
        let result = (res.data || {}).result

        if (res.statusCode === 200 && result && result.address) {
          let {address, formatted_addresses, address_component} = result
          if (formatted_addresses && (formatted_addresses.recommend || formatted_addresses.rough)) {
            address = formatted_addresses.recommend || formatted_addresses.rough
          }
          let {province, city, district: county} = address_component
          this.setData({
            province,
            county,
            city,
            address: name || address
          })
          this.getWeatherData()
        } else {
          //失败
          fail()
        }
      },
      fail
    )
  },
  /**
   * 设置经纬度，地址。并且获取天气数据
   * @param res
   */
  updateLocation(res) {
    let {latitude: lat, longitude: lon, name} = res
    let data = {
      lat,
      lon
    }
    if (name) {
      data.address = name
    }
    this.setData(data)
    this.getAddress(lat, lon, name)
  },
  /**
   * 使用模拟位置（上海）- 用于开发者工具测试
   */
  useMockLocation() {
    const mockLocation = {
      latitude: 31.2304,  // 上海纬度
      longitude: 121.4737, // 上海经度
      name: '上海市'
    }
    this.updateLocation(mockLocation)
  },
  /**
   * wx.getLocation获取经纬度，地址
   */
  getLocation() {
    wx.getLocation({
      type: 'gcj02',
      success: this.updateLocation,
      fail: (e) => {
        // 在开发者工具中，如果获取位置失败，使用模拟位置（上海）
        try {
          const deviceInfo = wx.getDeviceInfo()
          // 开发者工具中 platform 通常是 'devtools'
          if (deviceInfo.platform === 'devtools') {
            this.useMockLocation()
          } else {
            // 真机环境，弹出权限提示
            this.openLocation()
          }
        } catch (err) {
          // 如果获取设备信息失败，也尝试使用模拟位置（方便调试）
          this.useMockLocation()
        }
      }
    })
  },
  /**
   * 选择位置。若跟以前一样，重新获取3个数据。
   * 不一样则根据经纬度获取地址，并且获取天气数据。
   */
  chooseLocation() {
    wx.chooseLocation({
      success: (res) => {
        let {latitude, longitude} = res
        let {lat, lon} = this.data
        if (latitude == lat && lon == longitude) {
          this.getWeatherData()
        } else {
          this.updateLocation(res)
        }
      }
    })
  },
  /**
   * 未授权使用位置权限 提示
   */
  openLocation() {
    wx.showModal({
      title: '位置权限未开启',
      content: '检测到您未授权使用位置权限，需要位置信息才能获取天气数据，是否前往设置开启？',
      confirmText: '去设置',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 用户点击了"去设置"按钮
          wx.openSetting({
            success: (settingRes) => {
              // 检查用户是否授权了位置权限
              if (settingRes.authSetting['scope.userLocation']) {
                // 用户授权成功，重新获取位置
                this.getLocation()
              }
            }
          })
        }
      }
    })
  },
  /**
   * 获取用户的当前设置，如果允许scope.userLocation则去获取数据。不允许则弹出提示。
   */
  onLocation() {
    wx.getSetting({
      success: ({authSetting}) => {
        can = authSetting['scope.userLocation']
        if (can) {
          this.chooseLocation()
        } else {
          this.openLocation()
        }
      }
    })
  },
  /**
   * onload时
   * 1. 获取系统信息
   * 2. 看url上是否带有信息，有的话直接setData，然后获取天气数据。没有的话，从storage中拿，然后获取天气数据
   */
  onLoad() {
    const windowInfo = wx.getWindowInfo()
    const width = windowInfo.windowWidth
    const scale = width / 375
    this.setData({
      width,
      scale,
      paddingTop: windowInfo.statusBarHeight + 12
    })
    const pages = getCurrentPages() //获取加载的页面
    const currentPage = pages[pages.length - 1] //获取当前页面的对象
    const query = currentPage.options
    if (query && query.address && query.lat && query.lon) {
      let {province, city, county, address, lat, lon} = query
      this.setData(
        {
          city,
          province,
          county,
          address,
          lat,
          lon
        },
        () => {
          this.getWeatherData()
        }
      )
    } else {
      // 获取缓存数据
      this.setDataFromCache()
      this.getLocation()
    }
    this._weatherAdviceToastShown = false
  },

  /**
   * 在天气接口渲染完成后调用：把实况与今日预报写入提示词，避免模型「无法获取实况」；
   * 成功后将一句建议用 toast 提示（每进入页面只自动弹一次，避免下拉刷新反复打扰）。
   */
  requestWeatherAdviceToast(apiData) {
    if (this._weatherAdviceToastShown) {
      return
    }
    const {city, address, lat, lon} = this.data
    const {current, daily} = apiData || {}
    if (!current || !daily || !daily.length) {
      return
    }
    const loc =
      address && address !== '定位中' ? `${address}（${city}）` : `「${city}」`
    const d0 = daily[0]
    const d1 = daily[1]
    const todayLine = `今日预报：${d0.day}，${d0.minTemp}～${d0.maxTemp}°C`
    const tomorrowLine = d1
      ? `明日预报：${d1.day}，${d1.minTemp}～${d1.maxTemp}°C`
      : ''
    const windFrag =
      current.wind && current.windLevel
        ? `，${current.wind}${current.windLevel}级`
        : current.wind
          ? `，${current.wind}`
          : ''
    const nowLine = `实时：${current.weather}，体感约${current.temp}°C，湿度${current.humidity}%${windFrag}`
    const query = `以下为小程序已从气象接口拉取的数据（视为当地真实天气），请严格只根据下文回答，不要声称无法获取实况，不要让用户再去查天气网站或 App。
地点：${loc}
${nowLine}
${todayLine}
${tomorrowLine}
请用不超过两句、总字数不超过 36 个汉字，直接给出今日穿衣与出行提醒（亲切口语），不要套话前缀。`
    callHello({
      from: 'weather',
      t: Date.now(),
      city,
      address,
      lat,
      lon,
      query
    })
      .then((res) => {
        const r = res && res.result
        console.log('[云开发] hello', r)
        if (r && r.ok && r.answer) {
          this._weatherAdviceToastShown = true
          const line = String(r.answer)
            .replace(/\s+/g, ' ')
            .trim()
          const maxLen = 32
          const title = line.length > maxLen ? line.slice(0, maxLen - 1) + '…' : line
          wx.showToast({
            title,
            icon: 'none',
            duration: Math.min(5000, 2200 + Math.min(line.length, maxLen) * 90)
          })
        }
      })
      .catch((err) => {
        const msg = (err && err.errMsg) || (err && err.message) || ''
        const hint =
          msg.indexOf('FUNCTION_NOT_FOUND') !== -1 || msg.indexOf('could not be found') !== -1
            ? '云端未部署 hello：在项目根执行 npm run tcb:login 后 npm run deploy:hello'
            : '请检查云环境 ID、是否已上传部署云函数'
        console.warn('[云开发] hello 未就绪（' + hint + '）', err)
      })
  },
  /**
   * 下拉刷新
   */
  onPullDownRefresh() {
    this.getWeatherData(() => {
      wx.stopPullDownRefresh()
    })
  },
  /**
   * 分享app信息，url可附带query, 在onload方法中会去解析
   * @returns {*}
   */
  onShareAppMessage() {
    if (!isUpdate) {
      return {
        title: '我发现一个好玩的天气小程序，分享给你看看！',
        path: '/pages/weather/index'
      }
    } else {
      const {lat, lon, address, province, city, county} = this.data
      let url = `/pages/weather/index?lat=${lat}&lon=${lon}&address=${address}&province=${province}&city=${city}&county=${county}`

      return {
        title: `「${address}」现在天气情况，快打开看看吧！`,
        path: url
      }
    }
  },

  /**
   * 根据天气数据来setData, 画出一周温度图，缓存某些数据，提前获取心情数据
   * @param data
   */
  render(data) {
    isUpdate = true
    const {width, scale} = this.data
    const {hourly, daily, current, oneWord = '', effect} = data
    const {backgroundColor, backgroundImage} = current

    const _today = daily[0],
      _tomorrow = daily[1]
    const today = {
      temp: `${_today.minTemp}/${_today.maxTemp}°`,
      icon: _today.dayIcon,
      weather: _today.day
    }
    const tomorrow = {
      temp: `${_tomorrow.minTemp}/${_tomorrow.maxTemp}°`,
      icon: _tomorrow.dayIcon,
      weather: _tomorrow.day
    }

    this.setData({
      hourlyData: hourly,
      weeklyData: daily,
      current,
      backgroundImage,
      backgroundColor,
      today,
      tomorrow,
      oneWord
    })
    this.stopEffect()

    //获取一个effect实例
    if (effect && effect.name) {
      effectInstance = drawEffect('effect', effect.name, width, EFFECT_CANVAS_HEIGHT * scale, effect.amount)
    }
    // 延时画图
    this.drawChart()
    // 缓存数据
    this.dataCache()
  },
  /**
   * 在storage中存储defaultData
   */
  dataCache() {
    const {current, backgroundColor, backgroundImage, today, tomorrow, address, tips, hourlyData} = this.data
    wx.setStorage({
      key: 'defaultData',
      data: {
        current,
        backgroundColor,
        backgroundImage,
        today,
        tomorrow,
        address,
        tips,
        hourlyData
      }
    })
  },
  /**
   * 从storage中取出defaultData并对应的setData
   */
  setDataFromCache() {
    wx.getStorage({
      key: 'defaultData',
      success: ({data}) => {
        if (data && !isUpdate) {
          // 存在并且没有获取数据成功，那么可以给首屏赋值上次数据
          const {current, backgroundColor, backgroundImage, today, tomorrow, address, tips, hourlyData} = data
          this.setData({
            current,
            backgroundColor,
            backgroundImage,
            today,
            tomorrow,
            address,
            tips,
            hourlyData
          })
        }
      }
    })
  },
  /**
   * 暂停动画效果
   * effectInstance.clear()
   */
  stopEffect() {
    if (effectInstance && effectInstance.clear) {
      effectInstance.clear()
    }
  },
  /**
   * 返回一个Chart实例
   */
  drawChart() {
    const {width, scale, weeklyData} = this.data
    let height = CHART_CANVAS_HEIGHT * scale
    let ctx = wx.createCanvasContext('chart')
    fixChart(ctx, width, height)

    // 添加温度
    Chart.pluginService.register({
      afterDatasetsDraw(e, t) {
        ctx.setTextAlign('center')
        ctx.setTextBaseline('middle')
        ctx.setFontSize(16)

        e.data.datasets.forEach((t, a) => {
          let r = e.getDatasetMeta(a)
          r.hidden ||
            r.data.forEach((e, r) => {
              // 昨天数据发灰
              ctx.setFillStyle(r === 0 ? '#e0e0e0' : '#ffffff')

              let i = t.data[r].toString() + '\xb0'
              let o = e.tooltipPosition()
              0 == a ? ctx.fillText(i, o.x + 2, o.y - 8 - 10) : 1 == a && ctx.fillText(i, o.x + 2, o.y + 8 + 10)
            })
        })
      }
    })

    return new Chart(ctx, getChartConfig(weeklyData))
  },
  _clearEasterEggTimer() {
    if (this._eggTimer) {
      clearTimeout(this._eggTimer)
      this._eggTimer = null
    }
  },

  /**
   * 彩蛋：先点「今天」卡片，再在时限内点「明天」→ 进入 packageProposal 新动线
   */
  onEasterEggTodayTap() {
    if (this._eggPhase === 1) {
      return
    }
    this._eggPhase = 1
    this._clearEasterEggTimer()
    this._eggTimer = setTimeout(() => {
      this._eggPhase = 0
      this._eggTimer = null
    }, EASTER_EGG_WINDOW_MS)
  },

  onEasterEggTomorrowTap() {
    if (this._eggPhase === 1) {
      this._eggPhase = 0
      this._clearEasterEggTimer()
      wx.navigateTo({
        url: '/packageProposal/pages/open/index'
      })
      return
    }
  },

  /** 点击当前气温进入 AI 聊天 */
  onCurrentTempTap() {
    wx.navigateTo({
      url: '/packageChat/pages/chat/index'
    })
  },

  onUnload() {
    this._eggPhase = 0
    this._clearEasterEggTimer()
  },
  /**
   * 底部一句话：点击向云函数要一句情话，替换展示文案
   */
  onSourceTap() {
    if (this._loveLinePending) {
      return
    }
    this._loveLinePending = true
    wx.showLoading({ title: '今日语录正在 AI thinking 中', mask: true })
    const query =
      '随便写一段温柔的中文情话吧，长短、风格都由你定，适合当一句心情签名就好。'
    const done = () => {
      this._loveLinePending = false
      wx.hideLoading()
    }
    callHello({
      from: 'weather',
      t: Date.now(),
      query
    })
      .then((res) => {
        const r = res && res.result
        if (r && r.ok && r.answer) {
          const line = String(r.answer)
            .replace(/\s+/g, ' ')
            .trim()
            .slice(0, 500)
          this.setData({oneWord: line})
        } else {
          wx.showToast({
            title: (r && r.error) || '生成失败',
            icon: 'none'
          })
        }
        done()
      })
      .catch((err) => {
        wx.showToast({
          title: (err && err.errMsg) || '网络异常',
          icon: 'none'
        })
        done()
      })
  }
})
