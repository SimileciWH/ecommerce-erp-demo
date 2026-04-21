# 跨境电商 ERP 实时数据大屏 Demo 开发 Spec v1.0

## 1. 项目目标

开发一个用于演示的跨境电商 ERP 实时数据大屏 Web App。当前阶段只做前端，不做后端，不接真实平台 API。系统通过固定路径加载 CSV 文件，模拟展示跨境电商多店铺、多平台、多国家、多商品的实时销售数据。

系统需要帮助运营人员快速判断：当前订单量与销售额表现、热销店铺、爆款商品、销售国家分布、平台走势、分时销售趋势和实时订单动态。

## 2. 业务背景

跨境电商通常存在多个店铺、多个销售国家、多个平台和大量商品。运营人员需要一个 ERP 数据看板，快速掌握当前业务状态，并指导重点国家、重点平台、爆款商品和关键时间段的运营动作。

## 3. 技术方案

### 3.1 技术栈

- Next.js
- React
- ECharts
- PapaParse
- CSS 大屏布局
- CSV 浏览器端解析
- GitHub Pages 静态部署

### 3.2 部署方式

项目部署到 GitHub Pages。

仓库名称：

```text
ecommerce-erp-demo
```

GitHub Pages 项目路径：

```text
/ecommerce-erp-demo/
```

Next.js 使用静态导出：

```text
output: 'export'
```

不使用 SSR、API Routes、数据库或后端服务。

## 4. 不做内容

本阶段明确不做：

- 不做后端
- 不做真实登录系统
- 不做注册系统
- 不做数据库
- 不做真实平台 API 接入
- 不做用户权限系统
- 不做订单管理、发货、库存等 ERP 操作功能
- 不做移动端重点适配
- 不做国家点击筛选全页面
- 不显示顶部时区选择、币种选择、全部订单筛选器

## 5. 登录规则

### 5.1 固定 Demo 用户

```text
邮箱：sjf@qq.com
密码：sjf20260421
```

### 5.2 登录页面

访问首页时，未登录用户看到登录页。登录页采用深色科技风背景，与 ERP 大屏保持统一。

结构：

```text
左侧品牌区 + 右侧登录框
```

左侧展示：

- Logo
- 系统名称
- 简短说明文字

右侧展示：

- 邮箱输入框
- 密码输入框
- 登录按钮
- 登录错误提示

### 5.3 Logo

Logo 使用用户提供的图片，不重新绘制。建议路径：

```text
/public/assets/logo.png
```

Logo 图片保留白底，放在浅色或白色 Logo 卡片中展示，优先保证品牌图清晰。

### 5.4 登录状态

登录成功后，将登录状态保存到 `localStorage`。刷新页面后仍保持登录状态。

### 5.5 退出登录

ERP 大屏页面需要退出入口。退出按钮放在参考图中原本“全部订单”的位置。

文案：

```text
退出
```

视觉要求：小字号、低亮度，不破坏大屏整体视觉。点击后清除 `localStorage` 登录状态，并返回登录页。

## 6. 页面路由

采用单页模式：

```text
/ecommerce-erp-demo/
```

未登录时显示登录页。已登录时同地址显示 ERP 实时数据大屏。

不使用 `/login` 或 `/dashboard` 子路由，避免 GitHub Pages 静态部署刷新子路由时出现 404。

## 7. 大屏页面设计

### 7.1 总体视觉

ERP 大屏页面视觉尽量严格贴近用户提供的参考图：

- 深色科技风
- 蓝色系发光边框
- 数据大屏风格
- 中间世界地图
- 左侧排行榜
- 右侧趋势图
- 底部实时订单

### 7.2 大屏尺寸

设计稿固定为：

```text
1920 × 1080
```

适配方式：固定 1920×1080 设计稿，整体等比例缩放。不重点适配手机和平板。

### 7.3 Logo

ERP 大屏页面不显示 Logo。Logo 只用于登录页。

## 8. 顶部区域

### 8.1 标题

```text
实时数据大屏
```

### 8.2 当前时间

顶部保留当前时间显示。时间使用系统内部 UTC+8 当前时间，但页面不显示 `UTC+8` 字样。

显示格式严格按照参考图风格：

```text
YYYY-MM-DD HH:mm:ss
```

示例：

```text
2026-04-21 15:39:37
```

### 8.3 顶部 KPI

只保留两个指标：

```text
总订单量
总销售额
```

### 8.4 顶部不显示内容

顶部不显示：

- 时区选择
- 币种选择
- 全部订单筛选器

原“全部订单”位置用于显示弱化的退出按钮。

## 9. 币种和金额格式

系统内部默认币种：

```text
USD
```

页面所有金额统一以美元显示。格式：

```text
$75,927.75
```

规则：使用 `$`、千分位、保留两位小数。

## 10. 时间规则

### 10.1 系统时间

系统统一使用 UTC+8。

### 10.2 每日周期

每天按 UTC+8 计算。

一天开始：

```text
00:00:00
```

一天结束：

```text
23:59:59
```

每天 UTC+8 00:00 自动归 0，重新跑同一份 CSV 模板数据。

### 10.3 CSV 时间作为每日模板，并按参考图完整显示日期时间

CSV 里的 24 小时订单数据作为每日循环模板使用。

系统读取 CSV 中每笔订单的 `order_time_utc8` 字段，但实际运行时主要使用其中的时、分、秒，然后将该订单时间套用到当前 UTC+8 日期。

例如 CSV 模板订单时间为：

```text
2025-09-29 15:23:18
```

如果当前 UTC+8 日期是：

```text
2026-04-21
```

则该订单在当天实际触发时间为：

```text
2026-04-21 15:23:18
```

页面展示时间时，需要严格按照参考图风格完整显示日期和时间：

```text
YYYY-MM-DD HH:mm:ss
```

说明：

- CSV 中的日期只作为模板日期，不决定实际运行日期。
- CSV 中的时分秒决定订单每天的触发时间。
- 页面展示时，日期必须使用当前 UTC+8 日期。
- 每天 UTC+8 00:00 后，系统归 0，并继续使用同一份 CSV 的时分秒在新日期重新跑一遍。
- 不显示 `UTC+8` 字样，但所有日期时间均按 UTC+8 计算。

### 10.4 打开页面时的数据状态

如果用户在 UTC+8 当天 15:30 打开页面，系统应该立即显示当天 00:00:00 到 15:30:00 已经发生的订单累计数据，而不是从 0 重新播放。

## 11. 实时数据规则

### 11.1 订单触发方式

订单按 CSV 中每笔订单的 UTC+8 时分秒精确触发。页面每秒检查一次当前应该显示哪些订单。已发生订单进入统计，未来订单不进入统计。

### 11.2 所有模块统一统计口径

所有统计模块只统计：

```text
UTC+8 当天 00:00:00 到当前时刻已经发生的订单
```

适用模块：顶部总订单量、顶部总销售额、热销店铺 TOP10、热销商品 TOP10、世界地图、实时订单、GMV 走势图、订单量走势图和平台走势图。

### 11.3 订单状态口径

只统计：

```text
order_status = paid
```

Demo 阶段 CSV 可以全部为 `paid`。保留 `order_status` 字段，方便后续扩展 pending、cancelled、refunded 等状态。

## 12. CSV 数据源

### 12.1 固定加载文件

页面只加载核心明细表：

```text
/ecommerce-erp-demo/data/orders.csv
/ecommerce-erp-demo/data/order_items.csv
/ecommerce-erp-demo/data/products.csv
/ecommerce-erp-demo/data/stores.csv
/ecommerce-erp-demo/data/countries.csv
```

地图额外加载：

```text
/ecommerce-erp-demo/data/world.geo.json
```

### 12.2 运行策略

页面首次打开时读取一次 CSV。运行中不定时重新读取。跨过 UTC+8 00:00 后自动归 0，并复用同一份 CSV 作为新一天模板。

### 12.3 数据计算方式

使用订单明细驱动。前端读取 CSV 原始数据，实时计算全部展示结果，不依赖预计算 CSV。

## 13. CSV Schema

### 13.1 orders.csv

用于顶部订单量、顶部销售额、实时订单、店铺排行榜、国家地图、GMV 趋势、订单量趋势、平台趋势。

当前 Demo 字段：

```text
order_id
order_sequence
dashboard_date
order_time_utc8
order_hour_utc8
minutes_from_start
local_order_time
local_hour
country_code
country_name_cn
country_name_en
site
timezone
platform
store_id
store_name
business_type
customer_name
order_amount_usd
currency
order_status
payment_status
is_mock
```

核心口径：

- 销售额主口径使用 `orders.csv.order_amount_usd`。
- 顶部总销售额、实时订单金额、店铺销售额、国家销售额、趋势图销售额都使用 `order_amount_usd`。
- 只统计 `order_status = paid` 的订单。

### 13.2 order_items.csv

用于热销商品 TOP10、商品销量、商品订单数、商品销售额、商品成交均价。

当前 Demo 字段：

```text
order_item_id
order_id
sku
product_name_en
product_name_cn
product_image
category
quantity
unit_price_usd
item_sales_amount_usd
store_id
store_name
platform
country_code
country_name_cn
```

商品榜销售额口径使用 `item_sales_amount_usd`。

成交均价由前端计算：

```text
成交均价 = 商品销售额 / 商品销量
```

### 13.3 products.csv

当前 Demo 字段：

```text
sku
product_name_en
product_name_cn
category
list_price_usd
product_image
image_note
active
```

商品图片 Demo 阶段使用占位图路径，后续可自行替换真实图片。

### 13.4 stores.csv

当前 Demo 字段：

```text
store_id
store_name
store_display_name
store_note
business_type
active
display_order
```

### 13.5 countries.csv

当前 Demo 字段：

```text
country_code
country_name_cn
country_name_en
map_name
timezone
sales_weight
time_zone_note
preferred_sales_local_hours
dashboard_timezone
```

`map_name` 用于匹配 `world.geo.json` 中的国家名称。

## 14. 基础业务数据

### 14.1 店铺

固定店铺名称：

```text
YHR C
Camplab Outdoor Peak
Coco Sports and Outdoors
Outdoor equipment shop
Xing Fan Go
Xing Fan Go
YIHRA
```

其中两个 `Xing Fan Go` 按两个不同 `store_id` 的店铺处理，页面展示名称仍然都是 `Xing Fan Go`。

### 14.2 销售国家

```text
英国
法国
美国
俄罗斯
越南
菲律宾
泰国
马来西亚
```

国家代码：

```text
GB
FR
US
RU
VN
PH
TH
MY
```

### 14.3 平台

```text
AliExpress
mercado
temu
tiktok
ozon
```

### 14.4 商品价格和全天目标

商品价格范围：

```text
$120.00 - $256.00
```

Demo 模拟数据全天总销售额目标：

```text
$70,000 - $80,000
```

## 15. 数据模拟要求

### 15.1 24 小时真实跑

Demo 不加速。系统按照真实时间运行，从 UTC+8 00:00 到 23:59:59 完成一天数据展示。

### 15.2 销售总额

全天最终销售额控制在 $70,000 - $80,000。

### 15.3 订单递增

订单量和销售额全天逐步增加，不能一开始就暴露全天结果。

### 15.4 国家销售时间合理性

订单时间需要符合不同国家的本地销售习惯：本地凌晨订单少，上午逐步增加，中午和晚上较活跃，深夜回落。

每条订单保留：

```text
order_time_utc8
local_order_time
local_hour
timezone
```

用于前端展示和数据校验。

## 16. 顶部 KPI 动画

顶部两个 KPI 使用滚动递增动画：总订单量、总销售额。

当新订单进入统计时，总订单量和总销售额平滑滚动到最新值。其他模块直接刷新，不做复杂数字滚动，避免页面频繁闪动。

## 17. 热销店铺 TOP10

位置：左侧上方模块。

字段严格按照参考图，不额外增加字段：

```text
店铺名称
平台
订单数
销售额
```

默认按销售额排序，支持点击切换为订单数排序。

数据来源：`orders.csv`。

统计口径：已发生 paid 订单。

店铺销售额：

```text
sum(order_amount_usd)
```

店铺订单数：

```text
count(order_id)
```

## 18. 热销商品 TOP10

位置：左侧中下方模块。

字段：

```text
商品图片
商品名称
销量
订单数
销售额
成交均价
```

支持三种排序：销售额、销量、订单数。默认按销量排序。

数据来源：`order_items.csv` 和 `products.csv`。只统计对应订单已经发生且 `order_status = paid` 的商品明细。

指标计算：

```text
销量 = sum(quantity)
订单数 = count(distinct order_id)
商品销售额 = sum(item_sales_amount_usd)
成交均价 = 商品销售额 / 商品销量
```

## 19. 世界地图

位置：页面中间主视觉区域。

地图方案：使用 ECharts 世界地图，地图底图数据放在项目本地：

```text
/ecommerce-erp-demo/data/world.geo.json
```

显示完整世界地图。有销售数据的国家按指标强弱点亮，无销售数据的国家使用暗色或低亮度显示。

地图支持销售额 / 订单数切换，默认按销售额点亮国家。

鼠标悬停国家时显示 tooltip：

```text
国家名称
订单数
销售额
销售额占比
```

不做点击国家筛选全页面。

## 20. 实时订单列表

位置：页面底部中间区域。

页面固定显示最近 5 条订单，列表自动滚动循环展示。有新订单进入时，新订单进入列表。

字段：

```text
业务类型
平台
店铺名称
销售国家
客户名称
下单金额
下单时间
```

这里保留店铺名称，是用户明确要求的扩展字段。

下单时间默认显示相对时间：

```text
刚刚
2 分钟前
4 小时前
```

鼠标悬停时显示完整 UTC+8 下单时间，格式：

```text
YYYY-MM-DD HH:mm:ss
```

## 21. 右侧趋势图

右侧包含三个趋势模块。

### 21.1 GMV 走势图

显示当天 UTC+8 00:00 到当前时刻的 GMV 走势。横轴固定显示 0-24 小时，未来时间无数据，线条只画到当前时间。粒度按小时聚合。数据来源：`orders.csv.order_amount_usd`。

### 21.2 订单量走势图

显示当天 UTC+8 00:00 到当前时刻的订单量走势。横轴固定显示 0-24 小时，未来时间无数据。粒度按小时聚合。

### 21.3 自营-平台走势图

按平台显示多条线：

```text
AliExpress
mercado
temu
tiktok
ozon
```

支持销售额 / 订单数切换，默认销售额。粒度按小时聚合，横轴固定显示 0-24 小时，未来时间为空。

## 22. 交互规则

- 热销店铺 TOP10：销售额 / 订单数切换。
- 热销商品 TOP10：销售额 / 销量 / 订单数切换。
- 世界地图：销售额 / 订单数切换。
- 平台走势图：销售额 / 订单数切换。
- 顶部 KPI 不受切换影响，始终显示总订单量和总销售额。

## 23. 加载状态

CSV 加载完成前显示深色科技风 Loading 页面。

文案：

```text
数据加载中...
```

如果 CSV 加载失败，显示错误提示页：

```text
数据加载失败，请检查 CSV 文件路径或文件格式。
```

提供“重新加载”按钮。

## 24. 成功标准

1. 访问 `/ecommerce-erp-demo/` 后，未登录时显示登录页。
2. 输入 `sjf@qq.com` 和 `sjf20260421` 可以登录。
3. 登录状态保存在 localStorage，刷新页面后仍保持登录。
4. 点击退出后清除登录状态并回到登录页。
5. 登录页使用深色科技风背景，并展示用户提供的 Logo。
6. ERP 大屏页面视觉结构贴近参考图。
7. 页面固定按 1920×1080 设计稿整体缩放。
8. 系统从固定 CSV 路径加载数据。
9. 所有数据按 UTC+8 当天 00:00 到当前时刻实时计算。
10. 订单按 CSV 中的时分秒精确触发。
11. 每天 UTC+8 00:00 自动归 0，并重新使用同一份 CSV 模板。
12. 顶部显示当前时间、总订单量、总销售额。
13. 当前时间完整显示为 `YYYY-MM-DD HH:mm:ss`。
14. 顶部金额使用美元格式，例如 `$75,927.75`。
15. 顶部订单量和销售额有滚动递增动画。
16. 热销店铺 TOP10 可以按销售额和订单数排序。
17. 热销商品 TOP10 可以按销售额、销量、订单数排序。
18. 世界地图完整显示，销售国家正确点亮。
19. 地图 tooltip 正确显示国家、订单数、销售额、销售额占比。
20. 实时订单列表显示最近订单，并自动滚动。
21. 实时订单时间默认相对显示，悬停显示完整 UTC+8 日期时间。
22. 右侧 GMV、订单量、平台走势图正确展示。
23. 所有金额均以 USD 显示。
24. 页面不显示时区选择、币种选择、全部订单筛选器。
25. CSV 加载中和加载失败都有明确状态页。

## 25. 当前默认决定

| 项目 | 默认决定 |
|---|---|
| 销售额主口径 | `orders.csv.order_amount_usd` |
| 商品榜销售额口径 | `order_items.csv.item_sales_amount_usd` |
| 实际大屏分辨率未知 | 先按 1920×1080 整体缩放 |
| 两个 Xing Fan Go | 作为两个不同 `store_id` 的店铺 |
| Demo 订单状态 | CSV 全部为 `paid`，前端仍按 `paid` 过滤 |
| 商品图片 | 先用占位图路径，后续自行替换 |
| 地图底图 | 本地 `world.geo.json` |
| 当前时间 | 显示 UTC+8 时间，但不显示 UTC+8 字样 |
| 时间格式 | `YYYY-MM-DD HH:mm:ss` |
| 大屏 Logo | 不显示 |
| 登录页 Logo | 显示白底 Logo 卡片 |
