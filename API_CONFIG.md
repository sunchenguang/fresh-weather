# 和风天气 API v7 配置说明

## 重要提示

和风天气 API 已从 v6 升级到 v7，旧版 API (`/s6/weather`) 已废弃。本项目已更新为使用最新的 API v7。

## 配置步骤

### 1. 获取 API Host 和 API KEY

1. 访问和风天气控制台：https://console.qweather.com/
2. 登录你的账号（如果没有账号，需要先注册）
3. 在左侧菜单点击"设置"，查看你的 **API Host**（格式如：`abc1234xyz.def.qweatherapi.com`）
4. 在左侧菜单点击"项目管理"，创建或选择一个项目
5. 在项目页面点击"添加凭据"按钮
6. 选择身份认证方式为 **API KEY**
7. 输入凭据名称（如：微信小程序）
8. 点击"创建"按钮，获取你的 **API KEY**

### 2. 配置代码

打开 `client/lib/api.js` 文件，找到以下配置：

```javascript
const QWEATHER_API_HOST = 'devapi.qweather.com' // 请替换为你的API Host
const QWEATHER_API_KEY = 'd9c64249ed7846429266edb41a9807d3' // 请替换为你的API KEY
```

将这两个值替换为你从控制台获取的实际值。

### 3. 配置微信小程序域名

在微信公众平台配置 request 合法域名：

1. 登录微信公众平台：https://mp.weixin.qq.com/
2. 进入你的小程序管理后台
3. 点击"开发" → "开发管理" → "开发设置"
4. 在"服务器域名" → "request合法域名"中添加你的 API Host 域名
   - 例如：如果你的 API Host 是 `abc1234xyz.def.qweatherapi.com`，则添加 `https://abc1234xyz.def.qweatherapi.com`

### 4. 开发者工具设置

在微信开发者工具中：

1. 点击右上角"详情"
2. 在"本地设置"中勾选"不校验合法域名、web-view（业务域名）、TLS 版本以及 HTTPS 证书"
   - 注意：这仅用于开发测试，正式发布前需要正确配置域名

## API 变更说明

### 旧版 API (v6) - 已废弃
- 实时天气：`https://free-api.heweather.net/s6/weather`
- 空气质量：`https://free-api.heweather.net/s6/air/now`
- 认证方式：URL 参数 `key=xxx`

### 新版 API (v7) - 当前使用
- 实时天气：`/v7/weather/now`
- 7天预报：`/v7/weather/7d`
- 24小时预报：`/v7/weather/24h`
- 实时空气质量：`/v7/air/now`
- 认证方式：Header `X-QW-Api-Key` 或 URL 参数 `key=xxx`
- API Host：每个开发者独立的 API Host

## 数据格式变更

### 旧版返回格式
```json
{
  "HeWeather6": [{
    "now": {...},
    "daily_forecast": [...],
    "hourly": [...]
  }]
}
```

### 新版返回格式
```json
{
  "code": "200",
  "updateTime": "2021-11-15T16:35+08:00",
  "now": {...},
  "daily": [...],
  "hourly": [...]
}
```

## 注意事项

1. **API Host 是必需的**：每个开发者都有独立的 API Host，不能使用公共域名
2. **JWT 认证（可选）**：如果需要更高的安全性，可以使用 JWT 认证方式，详见：https://dev.qweather.com/docs/configuration/authentication/
3. **费用**：和风天气 API 采用按量计费，请查看定价页面了解详情
4. **限制**：从 2027年1月1日起，API KEY 认证方式的每日请求数量将受到限制，建议使用 JWT 认证

## 参考文档

- 和风天气开发文档：https://dev.qweather.com/docs/api/
- API 配置说明：https://dev.qweather.com/docs/configuration/api-config/
- 身份认证说明：https://dev.qweather.com/docs/configuration/authentication/
