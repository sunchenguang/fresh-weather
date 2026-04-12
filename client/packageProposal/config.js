/** 求婚新动线文案与资源（可按需修改，无需动页面逻辑） */
const STORY_PHOTOS = [
  'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/images/202604/169068389644394496.jpg',
  'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/images/202604/169068400289538048.jpg',
  'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/images/202604/169068424662638592.jpg',
  'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/images/202604/169068436050173952.jpg',
  'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/images/202604/169068446334607360.jpg',
  'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/images/202604/169070450020737024.jpg',
  'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/images/202604/169070464612720640.jpg',
  'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/images/202604/169073276448956416.jpg',
  'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/images/202604/169070494291615744.jpg',
  'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/images/202604/169070678975209472.jpg',
];

const STORY_BGM =
  'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/audio/202603/155318786080137216.mp3';

const CLIMAX_BGM =
  'https://cdn-cn-oss-dreame-store.dreame.tech/dreame-mall/audio/202603/155311901063012352.mp3';

const OPEN = {
  kicker: '嘘——把时间调成慢镜头。接下来这段，只写给你一个人。',
  title: '光会一格一格亮起来，像我心跳一步一步走向你。',
  hint: '往下轻轻滑：翻的不是相册，是我偷偷排练了很多遍的告白前奏。',
  /** 开放页中段：引导动线，填满视觉空白 */
  trail: [
    { id: 'scroll', title: '掠影', desc: '让那些定格的瞬间，再一次轻轻撞进你眼里。', delay: 0.12 },
    { id: 'quiz', title: '拾忆', desc: '从往事里捡起那段——说出口还会脸红的夏天。', delay: 0.28 },
    { id: 'stay', title: '见心', desc: '走到最后一屏，别躲——那句最重要的话在等你。', delay: 0.44 }
  ]
};

/** 多轮小问答，按顺序答对后进入下一题；最后一题答对前往 moment */
const QUIZ = [
  {
    kicker: '旅行与夏天',
    question: '这些地方里，哪一处藏着我们最想念的一段夏天？',
    correctId: 'bali',
    options: [
      { id: 'turkey', text: '土耳其的浪漫' },
      { id: 'bali', text: '巴厘岛的风里' },
      { id: 'suzhou', text: '苏州的街角' }
    ],
    hints: {
      turkey: '离海最近的是哪一次旅行呢？',
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
      me: '其实这次真的是你最积极啦，别太谦虚～',
      both: '虽然我们也干过这类乌龙，但这次是认真想看的那次～'
    },
    defaultHint: '想想是谁更固执地不想错过那一道光～'
  },
  {
    kicker: '味觉记忆',
    question: '你最喜欢我们去过哪里的美食？',
    correctId: 'suzhou',
    options: [
      { id: 'bali', text: '普吉岛的泰式餐' },
      { id: 'suzhou', text: '中国的火锅' },
      { id: 'turkey', text: '越南的河粉和咖啡' }
    ],
    hints: {
      bali: '泰式餐很好吃，但有一道味道是我们都念念不忘的～',
      turkey: '异域的河粉和咖啡当然也好吃，但还有一份“更合口味”的回忆哦～'
    },
    defaultHint: '想想我们拍下最多美食照、最开心吃火锅的地方是哪儿？'
  },
  {
    kicker: '悄悄话前奏',
    question: '下列哪一句，最像那次旅行最后你想说的？',
    correctId: 'weather',
    options: [
      { id: 'weather', text: '要是能每天吃喝玩乐就好了，天天旅游多开心' },
      { id: 'simple', text: '下次还要一起来' },
      { id: 'photo', text: '照片记得发我原图' }
    ],
    hints: {
      simple: '这句我们说过啦，再挖一层心意～',
      photo: '原图当然要，但这题在问更认真的一句。'
    },
    defaultHint: '和下一屏要问你的那句话，是同一个方向哦。'
  }
];

const MOMENT = {
  kicker: '想了很久，还是决定在这一天',
  question: '你愿意嫁给我吗？',
  verse: '往后的日子，想认真陪你走过每一个平凡又珍贵的瞬间。',
  footnote: '这不是冲动，是被你照亮的好多年。',
  button: '愿意'
};

module.exports = {
  STORY_PHOTOS,
  STORY_BGM,
  CLIMAX_BGM,
  OPEN,
  QUIZ,
  MOMENT
};
