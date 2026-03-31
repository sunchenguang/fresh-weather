const fs = require('fs')
const path = require('path')
const { src, dest, series, parallel, watch } = require('gulp')
const rename = require('gulp-rename')

const through = require('through2')
const colors = require('ansi-colors')
const log = require('fancy-log')
const argv = require('minimist')(process.argv.slice(2))

const postcss = require('gulp-postcss')
const pxtorpx = require('postcss-px2rpx')
const base64 = require('postcss-font-base64')

const sass = require('gulp-sass')(require('sass'))
const jsonminify = require('gulp-jsonminify')
const combiner = require('stream-combiner2')
const babel = require('gulp-babel')
const uglify = require('gulp-uglify')
const cssnano = require('gulp-cssnano')
const sourcemaps = require('gulp-sourcemaps')
const filter = require('gulp-filter')
const jdists = require('gulp-jdists')

const srcRoot = './client'
const distRoot = './dist'
const isProd = argv.type === 'prod'

function clean(cb) {
  const out = path.join(__dirname, 'dist')
  if (fs.existsSync(out)) {
    fs.rmSync(out, { recursive: true, force: true })
  }
  cb()
}

const handleError = (err) => {
  console.log('\n')
  log(colors.red('Error!'))
  log('fileName: ' + colors.red(err.fileName))
  log('lineNumber: ' + colors.red(err.lineNumber))
  log('message: ' + err.message)
  log('plugin: ' + colors.yellow(err.plugin))
}

function json() {
  return src(`${srcRoot}/**/*.json`)
    .pipe(isProd ? jsonminify() : through.obj())
    .pipe(dest(distRoot))
}

function wxml() {
  return src(`${srcRoot}/**/*.wxml`).pipe(dest(distRoot))
}

function wxs() {
  return src(`${srcRoot}/**/*.wxs`).pipe(dest(distRoot))
}

function wxss() {
  const combined = combiner.obj([
    src(`${srcRoot}/**/*.{wxss,scss}`),
    sass().on('error', sass.logError),
    postcss([pxtorpx(), base64()]),
    isProd
      ? cssnano({
          autoprefixer: false,
          discardComments: { removeAll: true }
        })
      : through.obj(),
    rename((p) => {
      p.extname = '.wxss'
    }),
    dest(distRoot)
  ])

  combined.on('error', handleError)
  return combined
}

function images() {
  return src(`${srcRoot}/images/**`).pipe(dest(`${distRoot}/images`))
}

function assets() {
  return src(`${srcRoot}/assets/**`).pipe(dest(`${distRoot}/assets`))
}

function cloudfunctions() {
  return src(`${srcRoot}/cloudfunctions/**`).pipe(dest(`${distRoot}/cloudfunctions`))
}

function js() {
  const f = filter((file) => !/(mock)/.test(file.path))
  const fNoCloud = filter((file) => !/cloudfunctions/.test(file.path))
  return src(`${srcRoot}/**/*.js`)
    .pipe(fNoCloud)
    .pipe(isProd ? f : through.obj())
    .pipe(
      isProd
        ? jdists({
            trigger: 'prod'
          })
        : jdists({
            trigger: 'dev'
          })
    )
    .pipe(isProd ? through.obj() : sourcemaps.init())
    .pipe(
      babel({
        presets: ['@babel/preset-env']
      })
    )
    .pipe(
      isProd
        ? uglify({
            compress: true
          })
        : through.obj()
    )
    .pipe(isProd ? through.obj() : sourcemaps.write('./'))
    .pipe(dest(distRoot))
}

const buildAll = parallel(json, images, assets, cloudfunctions, wxml, wxss, js, wxs)

function watchFiles() {
  watch(`${srcRoot}/**/*.wxml`, wxml)
  watch(`${srcRoot}/**/*.wxs`, wxs)
  watch(`${srcRoot}/**/*.json`, json)
  watch(`${srcRoot}/**/*.js`, js)
  watch(`${srcRoot}/cloudfunctions/**`, cloudfunctions)
  watch(`${srcRoot}/images/**`, images)
  watch(`${srcRoot}/assets/**`, assets)
  watch(`${srcRoot}/**/*.{scss,wxss}`, wxss)
}

exports.json = json
exports.wxml = wxml
exports.wxs = wxs
exports.wxss = wxss
exports.images = images
exports.assets = assets
exports.cloudfunctions = cloudfunctions
exports.js = js
exports.clean = clean
exports.watch = watchFiles
exports.build = series(clean, buildAll)
exports.dev = series(clean, buildAll, watchFiles)
