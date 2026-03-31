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
  hint: '准备好再往下滑动照片了吗？',
  /** 开放页中段：引导动线，填满视觉空白 */
  trail: [
    { id: 'scroll', title: '翻阅', desc: '向下滑过那些被定格的瞬间', delay: 0.12 },
    { id: 'quiz', title: '回想', desc: '选一处只属于我们的夏天', delay: 0.28 },
    { id: 'stay', title: '驻足', desc: '最后一屏，那句话只说给你听', delay: 0.44 }
  ]
}

/** 多轮小问答，按顺序答对后进入下一题；最后一题答对前往 moment */
const QUIZ = [
  {
    kicker: '旅行与夏天',
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
  },
  {
    kicker: '路上的细节',
    question: '那次旅行里，是谁坚持要在凌晨爬起来等日出？',
    correctId: 'you',
    options: [
      { id: 'me', text: '是你硬把我拽起来的' },
      { id: 'you', text: '是我，拉着你冲出门的那个' },
      { id: 'both', text: '两个人都睡过了，根本没看到' }
    ],
    hints: {
      me: '你嘴硬的样子我也很喜欢，但这题在夸另一个答案哦。',
      both: '虽然我们也干过这类乌龙，但这次是认真想看的那次～'
    },
    defaultHint: '想想是谁更固执地不想错过那一道光～'
  },
  {
    kicker: '味觉记忆',
    question: '回程飞机上，我们约定下次还要再去吃一次的是什么？',
    correctId: 'seafood',
    options: [
      { id: 'seafood', text: '码头边那盘刚捞上来的' },
      { id: 'dessert', text: '巷子里的椰子甜品' },
      { id: 'instant', text: '便利店里的杯面也算数' }
    ],
    hints: {
      dessert: '甜的也重要，但这一题是更深的海的味道。',
      instant: '应急有过，但「约定」的是另一顿大餐啦。'
    },
    defaultHint: '和手机里那张油乎乎却爆满桌的照片有关～'
  },
  {
    kicker: '悄悄话前奏',
    question: '下列哪一句，最像那次旅行最后我想说却没说够的？',
    correctId: 'weather',
    options: [
      { id: 'weather', text: '想和你把今后的天气都过成好心情' },
      { id: 'simple', text: '下次还要一起来' },
      { id: 'photo', text: '照片记得发我原图' }
    ],
    hints: {
      simple: '这句我们说过啦，再挖一层心意～',
      photo: '原图当然要，但这题在问更认真的一句。'
    },
    defaultHint: '和下一屏要问你的那句话，是同一个方向哦。'
  }
]

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
