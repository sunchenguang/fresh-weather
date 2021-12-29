## 新鲜天气小程序

> 此小程序代码源自https://github.com/ksky521/fresh-weather， 主要做了注释，对和风天气API做了更新，使代码能正常运行。

![](./qrcode.jpg)

掘金小册《[微信小程序开发入门：从 0 到 1 实现天气小程序](https://juejin.im/book/5b70f101e51d456669381803/)》源码，欢迎购买小册支持作者（全网价格9.9）。



内容由三部分组成：

* 小程序开发基础知识：这部分主要介绍微信小程序、小程序云开发基础知识，最后介绍了小程序的运行机制
* 实战开发「新鲜天气」小程序：从脚手架搭建开始，将「新鲜天气」的天气预报和心情签到页面从布局到功能实现进行全面讲解，涉及小程序研发中绝大部分 API 和重要流程的梳理实现
* 优化到上线：从多个方面介绍小程序优化的知识点，并且完成小程序的上线

![](https://user-gold-cdn.xitu.io/2018/8/27/1657b37b54c56142?imageView2/0/w/1280/h/960/format/webp/ignore-error/1)



https://juejin.cn/book/6844733743266005006/section/6844733743362473997
```
项目二次开发
开发的时候，需要监听文件的变化，于是启动本地 mock server

# mock server 启动
npm run server
# 启动 cloud functions 云函数文件夹同步
npm run cloud
# 编译项目，并且启动 gulp watch 功能
npm run dev
现在，用小程序开发者工具打开项目的 dist 文件夹即可。
```
