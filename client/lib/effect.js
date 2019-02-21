const STATUS_STOP = 'stop'
const STATUS_RUNNING = 'running'

/**
 * 粒子 基类
 */
class Particle {
  constructor(ctx, width, height, opts) {
    this._timer = null
    this._options = opts || {}
    this.ctx = ctx
    this.status = STATUS_STOP
    this.w = width
    this.h = height

    this._init()
  }
  _init() {}
  _draw() {}
  run() {
    if (this.status !== STATUS_RUNNING) {
      this.status = STATUS_RUNNING
      this._timer = setInterval(() => {
        this._draw()
      }, 30)
    }
    return this
  }
  stop() {
    this.status = STATUS_STOP
    clearInterval(this._timer)
    return this
  }
  clear(){
    this.stop()
    this.ctx.clearRect(0, 0, this.w, this.h)
    this.ctx.draw()
    return this
  }
}

/**
 * 雨
 */
class Rain extends Particle {

  /**
   * 初始化 一些雨滴的相关属性，放到 this.particles中
   * @private
   */
  _init() {
    let ctx = this.ctx
    ctx.setLineWidth(2)
    ctx.setLineCap('round')
    let h = this.h
    let w = this.w
    let i
    let amount = this._options.amount || 100
    let speedFactor = this._options.speedFactor || 0.03
    let speed = speedFactor * h
    let ps = (this.particles = [])
    for (i = 0; i < amount; i++) {
      let p = {
        x: Math.random() * w,
        y: Math.random() * h,
        l: 2 * Math.random(),
        xs: -1,
        ys: 10 * Math.random() + speed,
        color: 'rgba(255, 255, 255, 0.1)'
      }
      ps.push(p)
    }
  }

  /**
   * 更新所有雨滴的x,y， 供下一次_draw使用
   * @returns {Rain}
   * @private
   */
  _update() {
    let {w, h} = this
    for (let ps = this.particles, i = 0; i < ps.length; i++) {
      let s = ps[i]
      s.x += s.xs
      s.y += s.ys
      // 重复利用
      if (s.x > w || s.y > h) {
        s.x = Math.random() * w
        s.y = -10
      }
    }
    return this
  }

  /**
   * 画出所有雨点，执行一次 _update 方法
   * @returns {Rain}
   * @private
   */
  _draw() {
    let ps = this.particles
    let ctx = this.ctx
    ctx.clearRect(0, 0, this.w, this.h)
    for (let i = 0; i < ps.length; i++) {
      let s = ps[i]
      ctx.beginPath()
      ctx.moveTo(s.x, s.y)
      ctx.lineTo(s.x + s.l * s.xs, s.y + s.l * s.ys)
      ctx.setStrokeStyle(s.color)
      ctx.stroke()
    }
    ctx.draw()

    return this._update()
  }
}

/**
 * 星星
 */
class Star extends Particle {
  _init() {
    let amount = this._options.amount || 100
    let ps = (this.particles = [])
    for (let i = 0; i < amount; i++) {
      // console.log(x, y)
      ps.push(this._getStarOptions())
    }
  }
  _draw() {
    let ps = this.particles
    let ctx = this.ctx
    ctx.clearRect(0, 0, this.w, this.h)
    for (let i = 0; i < ps.length; i++) {
      let {x, y, r, blur, opacity, color} = ps[i]

      ctx.beginPath()
      ctx.arc(x, y, r, 0, 2 * Math.PI)
      ctx.setFillStyle(`rgba(${color},${opacity})`)
      ctx.shadowColor = `rgba(${color},${opacity})`
      ctx.shadowBlur = blur
      ctx.fill()
      ctx.closePath()
      ps[i].opacity = 1
    }

    ctx.draw()
    this._update()
  }

  /**
   * 获取 star option
   * @returns {{r: number, color: string, x: number, y: number, blur: number, opacity: number}}
   * @private
   */
  _getStarOptions() {
    let {w, h} = this
    let radius = this._options.radius || 2
    const MAX_BLUR = radius * 10
    const MIN_BLUR = 0.1
    const RGB_PROB = 5
    const RGB_COLR = [255, 255, 255] //default color
    const MAX_COLR = [255, 255, 0] //color max
    const MIN_COLR = [255, 0, 0]
    let x = Math.random() * w
    let y = Math.random() * h / 5
    return {
      x,
      y,
      opacity: 1,
      blur: Math.random() * (MAX_BLUR - MIN_BLUR) + MIN_BLUR,
      r: Math.floor(Math.random() * (radius + 0.5) + 0.5),
      color: (Math.random() <= RGB_PROB / 100
        ? [
            Math.round(Math.random() * (MAX_COLR[0] - MIN_COLR[0]) + MIN_COLR[0]),
            Math.round(Math.random() * (MAX_COLR[1] - MIN_COLR[1]) + MIN_COLR[1]),
            Math.round(Math.random() * (MAX_COLR[2] - MIN_COLR[2]) + MIN_COLR[2])
          ]
        : RGB_COLR).join(',')
    }
  }
  _update() {
    const INN_FADE = 30 //fade in %
    const OUT_FADE = 50
    let amount = this._options.amount

    let innPrc, outPrc
    let ps = this.particles

    // 取出重新插入队尾
    let select = ps.splice(0, Math.floor(ps.length / 50))
    for (let i = 0; i < select.length; i++) {
      ps.push(this._getStarOptions())
    }
    for (let i = 0; i < ps.length; i++) {
      let p = ps[i]
      innPrc = INN_FADE * amount / 100
      outPrc = OUT_FADE * amount / 100
      if (i < outPrc) {
        p.opacity = i / outPrc
      } else if (i > amount - innPrc) {
        p.opacity -= (i - (amount - innPrc)) / innPrc
      }
    }
  }
}

/**
 * 雪
 */
class Snow extends Particle {
  /**
   * 初始化this.particles
   * @private
   */
  _init() {
    let {w, h} = this
    let colors = this._options._colors || ['#ccc', '#eee', '#fff', '#ddd']
    let amount = this._options.amount || 100

    let speedFactor = this._options.speedFactor || 0.03
    let speed = speedFactor * h * 0.15

    let radius = this._options.radius || 2
    let ps = (this.particles = [])

    for (let i = 0; i < amount; i++) {
      let x = Math.random() * w
      let y = Math.random() * h
      // console.log(x, y)
      ps.push({
        x,
        y,
        ox: x,
        ys: Math.random() + speed,
        r: Math.floor(Math.random() * (radius + 0.5) + 0.5),
        color: colors[Math.floor(Math.random() * colors.length)],
        rs: Math.random() * 80
      })
    }
  }

  /**
   * 画出所有雪花。并且执行一次 _update
   * @private
   */
  _draw() {
    let ps = this.particles
    let ctx = this.ctx
    ctx.clearRect(0, 0, this.w, this.h)
    for (let i = 0; i < ps.length; i++) {
      let {x, y, r, color} = ps[i]
      ctx.beginPath()
      // console.log(x,y)
      ctx.arc(x, y, r, 0, Math.PI * 2, false)
      ctx.setFillStyle(color)
      ctx.fill()
      ctx.closePath()
    }

    ctx.draw()
    this._update()
  }

  /**
   * 更新this.particles， 为下一次_draw做准备
   * @private
   */
  _update() {
    let {w, h} = this
    let v = this._options.speedFactor / 10
    for (let ps = this.particles, i = 0; i < ps.length; i++) {
      let p = ps[i]
      let {ox, ys} = p
      p.rs += v
      p.x = ox + Math.cos(p.rs) * w / 2
      p.y += ys
      // console.log(ys)
      // 重复利用
      if (p.x > w || p.y > h) {
        p.x = Math.random() * w
        p.y = -10
      }
    }
  }
}

/**
 * effect工厂 有3种效果  rain snow star
 * @param ParticleName
 * @param id
 * @param width
 * @param height
 * @param opts
 * @returns {Particle}
 */
export default (ParticleName, id, width, height, opts) => {
  switch (ParticleName.toLowerCase()) {
    case 'rain':
      return new Rain(id, width, height, opts)
    case 'snow':
      return new Snow(id, width, height, opts)
    case 'star':
      return new Star(id, width, height, opts)
  }
}
