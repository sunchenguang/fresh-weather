# 微信小程序域名配置清单

## 问题说明
在体验版中提示"加载失败，请稍后再试"，通常是因为域名配置问题。开发者工具和真机调试可能开启了"不校验合法域名"，但体验版会严格校验。

## 需要配置的域名

### 1. request合法域名（必须配置）

以下域名需要在微信公众平台的"开发" → "开发管理" → "开发设置" → "服务器域名" → "request合法域名"中配置：

```
https://apis.map.qq.com
https://n444txw66r.re.qweatherapi.com
https://wis.qq.com
```

### 2. downloadFile合法域名（如果使用wx.downloadFile下载图片）

如果代码中使用了 `wx.downloadFile` 下载图片，需要配置：

```
https://tianqi-1d3bf9.tcb.qcloud.la
```

**注意**：如果图片是通过 `<image>` 标签的 `src` 或 CSS `background-image` 加载的，不需要配置 downloadFile 域名。

## 配置步骤

1. 登录微信公众平台：https://mp.weixin.qq.com/
2. 进入你的小程序管理后台
3. 点击左侧菜单"开发" → "开发管理" → "开发设置"
4. 找到"服务器域名"部分
5. 点击"修改"按钮（注意：每月有修改次数限制）
6. 在"request合法域名"中添加上述域名（每行一个，不要包含协议头 `https://` 之外的内容）
7. 点击"保存"按钮
8. **重要**：保存后需要等待几分钟才能生效

## 配置注意事项

### ✅ 正确格式
```
apis.map.qq.com
n444txw66r.re.qweatherapi.com
wis.qq.com
```

### ❌ 错误格式
```
https://apis.map.qq.com  （不要包含协议头）
apis.map.qq.com/         （不要包含路径）
apis.map.qq.com:443      （不要包含端口）
 apis.map.qq.com         （不要有空格）
```

## 验证配置

配置完成后，可以通过以下方式验证：

1. **检查域名列表**：在"开发设置"页面查看已配置的域名列表
2. **重新上传代码**：配置域名后，重新上传代码到体验版
3. **查看控制台日志**：在体验版中查看控制台，检查是否有域名相关的错误

## 常见错误信息

如果看到以下错误，说明域名配置有问题：

- `errMsg: "request:fail url not in domain list"`
- `errMsg: "域名不在合法域名列表中"`
- `errMsg: "不在以下 request 合法域名列表中"`

## 代码中使用的域名详情

### 1. 腾讯地图API（逆地理编码）
- **域名**：`apis.map.qq.com`
- **完整URL**：`https://apis.map.qq.com/ws/geocoder/v1/`
- **用途**：根据经纬度获取地址信息
- **文件位置**：`client/lib/api.js` 第124行

### 2. 和风天气API
- **域名**：`n444txw66r.re.qweatherapi.com`
- **完整URL**：`https://n444txw66r.re.qweatherapi.com/v7/weather/now`
- **用途**：获取天气数据（实时天气、7天预报、24小时预报、空气质量）
- **文件位置**：`client/lib/api.js` 第12-16行

### 3. 腾讯天气API（心情）
- **域名**：`wis.qq.com`
- **完整URL**：`https://wis.qq.com/weather/common`
- **用途**：获取天气心情提示
- **文件位置**：`client/lib/api.js` 第153行

### 4. 静态资源（图片）
- **域名**：`tianqi-1d3bf9.tcb.qcloud.la`
- **完整URL**：`https://tianqi-1d3bf9.tcb.qcloud.la/bg/...` 和 `https://tianqi-1d3bf9.tcb.qcloud.la/icon/...`
- **用途**：加载背景图片和天气图标
- **文件位置**：`client/lib/weather-utils.js` 第4行
- **注意**：如果图片加载失败，不会导致"加载失败，请稍后再试"的错误，但会影响显示效果

## 排查步骤

如果配置后仍然失败，请按以下步骤排查：

1. **确认域名格式正确**：检查是否有空格、多余字符、协议头等
2. **确认域名已保存**：在"开发设置"页面查看域名列表，确认已保存
3. **等待生效**：域名配置保存后需要等待几分钟才能生效
4. **重新上传代码**：配置域名后，重新上传代码到体验版
5. **查看控制台日志**：在体验版中打开调试，查看控制台的具体错误信息
6. **检查API密钥**：确认和风天气API的密钥是否正确且有效

## 联系支持

如果按照以上步骤配置后仍然失败，请提供：
1. 控制台的具体错误信息
2. 后台配置的域名截图
3. 失败的API请求URL
