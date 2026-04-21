# ecommerce-erp-demo

跨境电商 ERP 实时数据大屏 Demo。当前版本为纯前端 Next.js 静态站点，不做后端、不做真实登录系统、不接平台 API。数据全部从 `public/data/*.csv` 加载。

## Demo 登录账号

```text
邮箱：sjf@qq.com
密码：sjf20260421
```

## 本地运行

```bash
npm install
npm run validate
npm run dev
```

本地开发地址：

```text
http://localhost:3000/
```

## 构建静态文件

```bash
npm run validate
npm run build
```

静态导出目录：

```text
out/
```

## GitHub Pages 部署

仓库名需要是：

```text
ecommerce-erp-demo
```

部署方式：

1. 创建 public repo：`ecommerce-erp-demo`
2. 将本项目所有文件推送到 `main` 分支
3. 在 GitHub 仓库 Settings → Pages 中，将 Source 设置为 GitHub Actions
4. 推送后 `.github/workflows/deploy.yml` 会自动构建并部署

访问路径形如：

```text
https://<github-username>.github.io/ecommerce-erp-demo/
```

## 数据文件

核心数据文件：

```text
public/data/orders.csv
public/data/order_items.csv
public/data/products.csv
public/data/stores.csv
public/data/countries.csv
public/data/world.geo.json
```

页面首次打开时读取一次 CSV。运行过程中不会定时重新读取。每天 UTC+8 00:00 自动归 0，并复用同一份 CSV 的时分秒作为新一天模板。

## 时间规则

CSV 中的 `order_time_utc8` 作为每日模板时间使用。页面会取其中的时分秒并套用到当前 UTC+8 日期。

页面显示时间格式：

```text
YYYY-MM-DD HH:mm:ss
```

## 金额规则

所有金额默认 USD，页面显示格式：

```text
$75,927.75
```

## 地图数据说明

`public/data/world.geo.json` 由 `world-atlas` 的 Natural Earth 110m 国家数据转换为 GeoJSON 后随项目本地保存，避免运行时依赖外部 CDN。

## Spec

完整产品与开发 Spec 见：

```text
spec.md
```
