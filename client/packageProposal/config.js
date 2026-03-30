/** 求婚新动线文案与资源（可按需修改，无需动页面逻辑） */
const STORY_PHOTOS = [
  'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/images/202603/155298871822540800.jpg',
  'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/images/202603/155298985345572864.jpg',
  'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/images/202603/155299003733401600.jpg',
  'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/images/202603/155299018153418752.jpg'
]

const STORY_BGM =
  'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/audio/202603/155318786080137216.mp3'

const CLIMAX_BGM =
  'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/audio/202603/155311901063012352.mp3'

const OPEN = {
  kicker: '嘘，从这一屏开始——',
  title: '只有你能看见的下一段故事',
  hint: '准备好再往下滑动照片了吗？'
}

const QUIZ = {
  question: '这些地方里，哪一处藏着我们最想念的一段夏天？',
  correctId: 'bali',
  options: [
    { id: 'qingdao', text: '青岛的海边' },
    { id: 'bali', text: '巴厘岛的风里' },
    { id: 'suzhou', text: '苏州的街角' }
  ],
  hints: {
    qingdao: '再想想那次飞得更远的一次～',
    suzhou: '这座城我们有太多日常，题目问的是「那一趟夏天」哦。'
  },
  defaultHint: '再想想和我们最疯狂晒过太阳的那次旅行～'
}

const MOMENT = {
  question: '愿意和我一起，把今后的天气都过成好心情吗？',
  button: '愿意',
  modalTitle: '你答应了。',
  modalSub: '余生请多指教。'
}

module.exports = {
  STORY_PHOTOS,
  STORY_BGM,
  CLIMAX_BGM,
  OPEN,
  QUIZ,
  MOMENT
}
