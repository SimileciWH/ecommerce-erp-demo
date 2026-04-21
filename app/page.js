'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Papa from 'papaparse';

const BASE_PATH = process.env.NEXT_PUBLIC_BASE_PATH || '';
const DESIGN_WIDTH = 1920;
const DESIGN_HEIGHT = 1080;
const LOGIN_EMAIL = 'sjf@qq.com';
const LOGIN_PASSWORD = 'sjf20260421';
const LOGIN_KEY = 'ecommerce_erp_demo_logged_in';
const PLATFORMS = ['AliExpress', 'mercado', 'temu', 'tiktok', 'ozon'];
const USD_FORMATTER = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});
const NUMBER_FORMATTER = new Intl.NumberFormat('en-US');
const COLORS = ['#41f6ff', '#5aa8ff', '#83f9a7', '#ffd166', '#ff7bbd', '#9d8cff'];

function asset(path) {
  if (!path) return '';
  if (/^https?:\/\//.test(path)) return path;
  const normalized = path.startsWith('/') ? path : `/${path}`;
  return `${BASE_PATH}${normalized}`;
}

function cleanHeader(header) {
  return String(header || '').replace(/^\uFEFF/, '').trim();
}

function parseCsv(url) {
  return new Promise((resolve, reject) => {
    Papa.parse(url, {
      download: true,
      header: true,
      skipEmptyLines: true,
      transformHeader: cleanHeader,
      complete: (result) => resolve(result.data),
      error: reject
    });
  });
}

async function loadDashboardData() {
  const [orders, orderItems, products, stores, countries, worldGeo] = await Promise.all([
    parseCsv(asset('/data/orders.csv')),
    parseCsv(asset('/data/order_items.csv')),
    parseCsv(asset('/data/products.csv')),
    parseCsv(asset('/data/stores.csv')),
    parseCsv(asset('/data/countries.csv')),
    fetch(asset('/data/world.geo.json')).then((response) => {
      if (!response.ok) throw new Error(`world.geo.json ${response.status}`);
      return response.json();
    })
  ]);

  const countryByCode = Object.fromEntries(countries.map((country) => [country.country_code, country]));
  const productBySku = Object.fromEntries(products.map((product) => [product.sku, product]));
  const storeById = Object.fromEntries(stores.map((store) => [store.store_id, store]));

  return {
    orders: orders.map((order) => ({
      ...order,
      triggerSeconds: secondsFromTemplateTime(order.order_time_utc8),
      amount: numberValue(order.order_amount_usd ?? order.order_amount),
      status: String(order.order_status || '').toLowerCase(),
      currency: order.currency || 'USD'
    })).filter((order) => Number.isFinite(order.triggerSeconds)),
    orderItems: orderItems.map((item) => ({
      ...item,
      quantityValue: numberValue(item.quantity),
      itemSalesAmount: numberValue(item.item_sales_amount_usd ?? item.item_sales_amount),
      unitPrice: numberValue(item.unit_price_usd ?? item.unit_price)
    })),
    products,
    stores,
    countries,
    countryByCode,
    productBySku,
    storeById,
    worldGeo
  };
}

function numberValue(value) {
  const parsed = Number.parseFloat(String(value ?? '').replace(/,/g, ''));
  return Number.isFinite(parsed) ? parsed : 0;
}

function pad2(value) {
  return String(value).padStart(2, '0');
}

function utc8Parts(date = new Date()) {
  const shifted = new Date(date.getTime() + 8 * 60 * 60 * 1000);
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
    day: shifted.getUTCDate(),
    hour: shifted.getUTCHours(),
    minute: shifted.getUTCMinutes(),
    second: shifted.getUTCSeconds()
  };
}

function formatUtc8(date = new Date()) {
  const p = utc8Parts(date);
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)} ${pad2(p.hour)}:${pad2(p.minute)}:${pad2(p.second)}`;
}

function currentUtc8Date() {
  const p = utc8Parts();
  return `${p.year}-${pad2(p.month)}-${pad2(p.day)}`;
}

function currentSecondsOfDay() {
  const p = utc8Parts();
  return p.hour * 3600 + p.minute * 60 + p.second;
}

function secondsFromTemplateTime(timeLike) {
  const text = String(timeLike || '').trim();
  const match = text.match(/(?:\d{4}-\d{2}-\d{2}\s+)?(\d{1,2}):(\d{2}):(\d{2})/);
  if (!match) return Number.NaN;
  return Number(match[1]) * 3600 + Number(match[2]) * 60 + Number(match[3]);
}

function templateTimeOfDay(timeLike) {
  const text = String(timeLike || '').trim();
  const match = text.match(/(\d{1,2}:\d{2}:\d{2})$/);
  return match ? match[1].padStart(8, '0') : '00:00:00';
}

function formatTemplateDateTime(timeLike) {
  return `${currentUtc8Date()} ${templateTimeOfDay(timeLike)}`;
}

function canUseFullscreen() {
  if (typeof document === 'undefined') return false;
  const root = document.documentElement;
  return typeof root.requestFullscreen === 'function' || typeof root.webkitRequestFullscreen === 'function';
}

function isFullscreenActive() {
  if (typeof document === 'undefined') return false;
  return Boolean(document.fullscreenElement || document.webkitFullscreenElement);
}

function enterFullscreen() {
  const root = document.documentElement;
  if (typeof root.requestFullscreen === 'function') return root.requestFullscreen();
  if (typeof root.webkitRequestFullscreen === 'function') return root.webkitRequestFullscreen();
  return Promise.reject(new Error('Fullscreen is not supported.'));
}

function exitFullscreen() {
  if (typeof document.exitFullscreen === 'function') return document.exitFullscreen();
  if (typeof document.webkitExitFullscreen === 'function') return document.webkitExitFullscreen();
  return Promise.resolve();
}

function relativeTime(triggerSeconds, nowSeconds) {
  const diff = Math.max(0, nowSeconds - triggerSeconds);
  if (diff < 60) return '刚刚';
  if (diff < 3600) return `${Math.floor(diff / 60)} 分钟前`;
  return `${Math.floor(diff / 3600)} 小时前`;
}

function useViewportScale() {
  const [scale, setScale] = useState(1);
  useEffect(() => {
    const update = () => {
      setScale(Math.min(window.innerWidth / DESIGN_WIDTH, window.innerHeight / DESIGN_HEIGHT));
    };
    update();
    window.addEventListener('resize', update);
    return () => window.removeEventListener('resize', update);
  }, []);
  return scale;
}

function useAnimatedNumber(value, duration = 780) {
  const [displayValue, setDisplayValue] = useState(value);
  const previousValue = useRef(value);

  useEffect(() => {
    const from = previousValue.current;
    const to = value;
    previousValue.current = value;
    if (from === to) return undefined;
    let frame;
    const start = performance.now();
    const animate = (now) => {
      const progress = Math.min(1, (now - start) / duration);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayValue(from + (to - from) * eased);
      if (progress < 1) frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, [value, duration]);

  return displayValue;
}

function AnimatedKpi({ value, type }) {
  const animated = useAnimatedNumber(value);
  if (type === 'money') return <>{USD_FORMATTER.format(animated)}</>;
  return <>{NUMBER_FORMATTER.format(Math.round(animated))}</>;
}

const registeredMaps = new Set();

function EChart({ option, className, mapName, geoJson }) {
  const elementRef = useRef(null);
  const chartRef = useRef(null);
  const echartsRef = useRef(null);

  useEffect(() => {
    let alive = true;
    import('echarts').then((echarts) => {
      if (!alive || !elementRef.current) return;
      echartsRef.current = echarts;
      if (mapName && geoJson && !registeredMaps.has(mapName)) {
        echarts.registerMap(mapName, geoJson);
        registeredMaps.add(mapName);
      }
      chartRef.current = echarts.init(elementRef.current, null, { renderer: 'canvas' });
      chartRef.current.setOption(option, true);
      const resize = () => chartRef.current?.resize();
      window.addEventListener('resize', resize);
      setTimeout(resize, 50);
      chartRef.current.__resizeHandler = resize;
    });
    return () => {
      alive = false;
      if (chartRef.current?.__resizeHandler) {
        window.removeEventListener('resize', chartRef.current.__resizeHandler);
      }
      chartRef.current?.dispose();
      chartRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (echartsRef.current && mapName && geoJson && !registeredMaps.has(mapName)) {
      echartsRef.current.registerMap(mapName, geoJson);
      registeredMaps.add(mapName);
    }
    chartRef.current?.setOption(option, true);
  }, [option, mapName, geoJson]);

  return <div ref={elementRef} className={className} />;
}

function buildViewModel(data, nowSeconds, storeSort, productSort, mapMetric, platformMetric) {
  const paidOrders = data.orders.filter((order) => order.status === 'paid' && order.triggerSeconds <= nowSeconds);
  const paidOrderIds = new Set(paidOrders.map((order) => order.order_id));
  const totalOrders = paidOrders.length;
  const totalSales = paidOrders.reduce((sum, order) => sum + order.amount, 0);

  const storeMap = new Map();
  for (const order of paidOrders) {
    const key = `${order.store_id || order.store_name}|${order.platform}`;
    if (!storeMap.has(key)) {
      storeMap.set(key, {
        key,
        storeName: order.store_name || data.storeById[order.store_id]?.store_name || '-',
        platform: order.platform || '-',
        orderCount: 0,
        sales: 0
      });
    }
    const row = storeMap.get(key);
    row.orderCount += 1;
    row.sales += order.amount;
  }
  const storeTop = [...storeMap.values()]
    .sort((a, b) => (storeSort === 'orders' ? b.orderCount - a.orderCount : b.sales - a.sales))
    .slice(0, 10);

  const itemMap = new Map();
  for (const item of data.orderItems) {
    if (!paidOrderIds.has(item.order_id)) continue;
    const product = data.productBySku[item.sku] || {};
    if (!itemMap.has(item.sku)) {
      itemMap.set(item.sku, {
        sku: item.sku,
        productName: product.product_name_en || item.product_name_en || item.product_name_cn || item.sku,
        image: product.product_image || item.product_image || '',
        quantity: 0,
        orderIds: new Set(),
        sales: 0
      });
    }
    const row = itemMap.get(item.sku);
    row.quantity += item.quantityValue;
    row.sales += item.itemSalesAmount;
    row.orderIds.add(item.order_id);
  }
  const productTop = [...itemMap.values()].map((row) => ({
    ...row,
    orderCount: row.orderIds.size,
    avgPrice: row.quantity > 0 ? row.sales / row.quantity : 0
  })).sort((a, b) => {
    if (productSort === 'sales') return b.sales - a.sales;
    if (productSort === 'orders') return b.orderCount - a.orderCount;
    return b.quantity - a.quantity;
  }).slice(0, 10);

  const countryMap = new Map();
  for (const order of paidOrders) {
    const country = data.countryByCode[order.country_code] || {};
    const mapName = country.map_name || order.country_name_en || order.country_name || order.country_name_cn;
    const code = order.country_code || mapName;
    if (!countryMap.has(code)) {
      countryMap.set(code, {
        countryCode: code,
        countryName: country.country_name_cn || order.country_name_cn || order.site || mapName,
        countryNameEn: country.country_name_en || order.country_name_en || mapName,
        mapName,
        orderCount: 0,
        sales: 0
      });
    }
    const row = countryMap.get(code);
    row.orderCount += 1;
    row.sales += order.amount;
  }
  const countryStats = [...countryMap.values()].map((country) => ({
    ...country,
    salesShare: totalSales > 0 ? country.sales / totalSales : 0,
    value: mapMetric === 'orders' ? country.orderCount : country.sales
  }));

  const hourlySales = Array.from({ length: 24 }, () => 0);
  const hourlyOrders = Array.from({ length: 24 }, () => 0);
  const platformHourly = Object.fromEntries(PLATFORMS.map((platform) => [platform, Array.from({ length: 24 }, () => 0)]));
  for (const order of paidOrders) {
    const hour = Math.floor(order.triggerSeconds / 3600);
    if (hour >= 0 && hour < 24) {
      hourlySales[hour] += order.amount;
      hourlyOrders[hour] += 1;
      if (!platformHourly[order.platform]) platformHourly[order.platform] = Array.from({ length: 24 }, () => 0);
      platformHourly[order.platform][hour] += platformMetric === 'orders' ? 1 : order.amount;
    }
  }
  const currentHour = Math.floor(nowSeconds / 3600);
  const maskFuture = (arr) => arr.map((value, hour) => (hour <= currentHour ? Number(value.toFixed ? value.toFixed(2) : value) : null));

  const latestOrders = paidOrders
    .slice()
    .sort((a, b) => b.triggerSeconds - a.triggerSeconds)
    .map((order) => ({
      ...order,
      displayDateTime: formatTemplateDateTime(order.order_time_utc8),
      relative: relativeTime(order.triggerSeconds, nowSeconds)
    }));

  return {
    paidOrders,
    totalOrders,
    totalSales,
    storeTop,
    productTop,
    countryStats,
    hourlySales: maskFuture(hourlySales),
    hourlyOrders: maskFuture(hourlyOrders),
    platformHourly: Object.fromEntries(Object.entries(platformHourly).map(([platform, arr]) => [platform, maskFuture(arr)])),
    latestOrders
  };
}

function makeLineOption({ title, data, unit = 'money' }) {
  return {
    backgroundColor: 'transparent',
    grid: { top: 24, right: 16, bottom: 28, left: 46 },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(4, 19, 31, 0.92)',
      borderColor: '#39d6ff',
      textStyle: { color: '#dffcff' },
      valueFormatter: (value) => (value == null ? '-' : unit === 'money' ? USD_FORMATTER.format(value) : NUMBER_FORMATTER.format(value))
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: Array.from({ length: 24 }, (_, index) => index),
      axisLabel: { color: '#90afbd', fontSize: 12, interval: 3 },
      axisLine: { lineStyle: { color: 'rgba(126, 226, 255, 0.28)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(126, 226, 255, 0.14)' } },
      axisLabel: { color: '#90afbd', fontSize: 12 },
      axisLine: { show: false }
    },
    series: [{
      name: title,
      type: 'line',
      smooth: true,
      symbol: 'none',
      connectNulls: false,
      lineStyle: { width: 2.5, color: '#45f0e7' },
      areaStyle: { color: 'rgba(69, 240, 231, 0.20)' },
      data
    }]
  };
}

function makePlatformOption(platformHourly, metric) {
  return {
    backgroundColor: 'transparent',
    color: COLORS,
    grid: { top: 38, right: 16, bottom: 28, left: 46 },
    legend: {
      top: 3,
      left: 8,
      itemWidth: 10,
      itemHeight: 8,
      textStyle: { color: '#c9f8ff', fontSize: 11 }
    },
    tooltip: {
      trigger: 'axis',
      backgroundColor: 'rgba(4, 19, 31, 0.92)',
      borderColor: '#39d6ff',
      textStyle: { color: '#dffcff' },
      valueFormatter: (value) => (value == null ? '-' : metric === 'sales' ? USD_FORMATTER.format(value) : NUMBER_FORMATTER.format(value))
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      data: Array.from({ length: 24 }, (_, index) => index),
      axisLabel: { color: '#90afbd', fontSize: 12, interval: 3 },
      axisLine: { lineStyle: { color: 'rgba(126, 226, 255, 0.28)' } },
      axisTick: { show: false }
    },
    yAxis: {
      type: 'value',
      splitLine: { lineStyle: { color: 'rgba(126, 226, 255, 0.14)' } },
      axisLabel: { color: '#90afbd', fontSize: 12 },
      axisLine: { show: false }
    },
    series: PLATFORMS.map((platform) => ({
      name: platform,
      type: 'line',
      smooth: true,
      symbol: 'none',
      connectNulls: false,
      lineStyle: { width: 2 },
      data: platformHourly[platform] || Array.from({ length: 24 }, () => null)
    }))
  };
}

function makeMapOption(countryStats, mapMetric) {
  const max = Math.max(1, ...countryStats.map((country) => country.value));
  const byMapName = Object.fromEntries(countryStats.map((country) => [country.mapName, country]));
  return {
    backgroundColor: 'transparent',
    tooltip: {
      trigger: 'item',
      backgroundColor: 'rgba(4, 19, 31, 0.94)',
      borderColor: '#39d6ff',
      textStyle: { color: '#dffcff' },
      formatter: (params) => {
        const stat = byMapName[params.name];
        if (!stat) return `${params.name}<br/>订单数：0<br/>销售额：$0.00<br/>销售额占比：0.00%`;
        return `${stat.countryName}<br/>订单数：${NUMBER_FORMATTER.format(stat.orderCount)}<br/>销售额：${USD_FORMATTER.format(stat.sales)}<br/>销售额占比：${(stat.salesShare * 100).toFixed(2)}%`;
      }
    },
    visualMap: {
      show: false,
      min: 0,
      max,
      inRange: { color: ['#183244', '#2b8aa1', '#76fff0'] }
    },
    series: [{
      type: 'map',
      map: 'world-demo',
      roam: false,
      zoom: 1.18,
      top: 18,
      bottom: 4,
      left: 0,
      right: 0,
      emphasis: {
        label: { show: false },
        itemStyle: { areaColor: '#79fff2', borderColor: '#bffffa', borderWidth: 1.2 }
      },
      label: { show: false },
      itemStyle: {
        areaColor: 'rgba(17, 48, 63, 0.76)',
        borderColor: 'rgba(78, 204, 230, 0.28)',
        borderWidth: 0.6
      },
      data: countryStats.map((country) => ({
        name: country.mapName,
        value: country.value
      }))
    }]
  };
}

function MetricTabs({ value, onChange, items }) {
  return (
    <div className="metric-tabs">
      {items.map((item) => (
        <button key={item.value} className={value === item.value ? 'active' : ''} onClick={() => onChange(item.value)} type="button">
          {item.label}
        </button>
      ))}
    </div>
  );
}

function Panel({ title, children, className = '', actions }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-title">
        <span>{title}</span>
        {actions}
      </div>
      <div className="panel-body">{children}</div>
    </section>
  );
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const submit = (event) => {
    event.preventDefault();
    if (email.trim() === LOGIN_EMAIL && password === LOGIN_PASSWORD) {
      localStorage.setItem(LOGIN_KEY, '1');
      onLogin();
      return;
    }
    setError('邮箱或密码不正确');
  };

  return (
    <main className="login-page">
      <div className="login-shell">
        <section className="brand-side">
          <div className="logo-card">
            <img src={asset('/assets/logo.png')} alt="自由探险 FREE EXPLORATION" />
          </div>
          <h1>跨境电商 ERP 实时数据大屏</h1>
          <p>多平台、多店铺、多国家销售数据集中展示，辅助快速判断爆款商品与重点销售区域。</p>
          <div className="brand-lines"><span /><span /><span /></div>
        </section>
        <section className="login-card">
          <h2>用户登录</h2>
          <p className="login-subtitle">请输入 Demo 账号进入数据大屏</p>
          <form onSubmit={submit}>
            <label>
              邮箱
              <input value={email} onChange={(event) => setEmail(event.target.value)} placeholder="sjf@qq.com" autoComplete="email" />
            </label>
            <label>
              密码
              <input value={password} onChange={(event) => setPassword(event.target.value)} placeholder="请输入密码" type="password" autoComplete="current-password" />
            </label>
            {error && <div className="login-error">{error}</div>}
            <button className="login-button" type="submit">登录</button>
          </form>
        </section>
      </div>
    </main>
  );
}

function LoadingPage({ text = '数据加载中...' }) {
  return (
    <main className="state-page">
      <div className="loading-orbit" />
      <p>{text}</p>
    </main>
  );
}

function ErrorPage({ message, onRetry }) {
  return (
    <main className="state-page">
      <div className="error-box">
        <h1>数据加载失败</h1>
        <p>{message || '请检查 CSV 文件路径或文件格式。'}</p>
        <button type="button" onClick={onRetry}>重新加载</button>
      </div>
    </main>
  );
}

function Dashboard({ data, onLogout }) {
  const scale = useViewportScale();
  const [nowText, setNowText] = useState(formatUtc8());
  const [nowSeconds, setNowSeconds] = useState(currentSecondsOfDay());
  const [storeSort, setStoreSort] = useState('sales');
  const [productSort, setProductSort] = useState('quantity');
  const [mapMetric, setMapMetric] = useState('sales');
  const [platformMetric, setPlatformMetric] = useState('sales');
  const [orderScrollIndex, setOrderScrollIndex] = useState(0);
  const [fullscreenEnabled, setFullscreenEnabled] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setNowText(formatUtc8());
      setNowSeconds(currentSecondsOfDay());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const syncFullscreen = () => {
      setFullscreenEnabled(canUseFullscreen());
      setIsFullscreen(isFullscreenActive());
    };

    syncFullscreen();
    document.addEventListener('fullscreenchange', syncFullscreen);
    document.addEventListener('webkitfullscreenchange', syncFullscreen);
    return () => {
      document.removeEventListener('fullscreenchange', syncFullscreen);
      document.removeEventListener('webkitfullscreenchange', syncFullscreen);
    };
  }, []);

  const view = useMemo(
    () => buildViewModel(data, nowSeconds, storeSort, productSort, mapMetric, platformMetric),
    [data, nowSeconds, storeSort, productSort, mapMetric, platformMetric]
  );

  useEffect(() => {
    setOrderScrollIndex(0);
  }, [view.latestOrders.length]);

  useEffect(() => {
    if (view.latestOrders.length <= 5) return undefined;
    const timer = setInterval(() => {
      setOrderScrollIndex((index) => (index + 1) % view.latestOrders.length);
    }, 3200);
    return () => clearInterval(timer);
  }, [view.latestOrders.length]);

  const visibleOrders = useMemo(() => {
    if (view.latestOrders.length <= 5) return view.latestOrders.slice(0, 5);
    return Array.from({ length: 5 }, (_, index) => view.latestOrders[(orderScrollIndex + index) % view.latestOrders.length]);
  }, [view.latestOrders, orderScrollIndex]);

  const gmvOption = useMemo(() => makeLineOption({ title: 'GMV', data: view.hourlySales, unit: 'money' }), [view.hourlySales]);
  const ordersOption = useMemo(() => makeLineOption({ title: '订单量', data: view.hourlyOrders, unit: 'count' }), [view.hourlyOrders]);
  const platformOption = useMemo(() => makePlatformOption(view.platformHourly, platformMetric), [view.platformHourly, platformMetric]);
  const mapOption = useMemo(() => makeMapOption(view.countryStats, mapMetric), [view.countryStats, mapMetric]);
  const toggleFullscreen = async () => {
    if (!fullscreenEnabled) return;
    try {
      if (isFullscreenActive()) {
        await exitFullscreen();
      } else {
        await enterFullscreen();
      }
    } catch (error) {
      console.error('Fullscreen toggle failed.', error);
    }
  };

  return (
    <main className="screen-wrap">
      <div className="screen" style={{ transform: `translate(-50%, -50%) scale(${scale})` }}>
        <header className="top-header">
          <div className="title-block">
            <h1>实时数据大屏</h1>
            <div className="current-time">{nowText}</div>
          </div>
          <div className="kpi-strip">
            <div className="kpi-item"><span>订单量</span><strong><AnimatedKpi value={view.totalOrders} type="count" /></strong></div>
            <div className="kpi-item"><span>销售额($)</span><strong><AnimatedKpi value={view.totalSales} type="money" /></strong></div>
          </div>
          <div className="header-actions">
            <button className="header-action-button" type="button" onClick={toggleFullscreen} disabled={!fullscreenEnabled}>
              {isFullscreen ? '退出全屏' : '全屏'}
            </button>
            <button className="header-action-button logout-button" type="button" onClick={onLogout}>退出</button>
          </div>
        </header>

        <Panel title="热销店铺TOP 10" className="stores-panel" actions={<MetricTabs value={storeSort} onChange={setStoreSort} items={[{ value: 'orders', label: '按订单量' }, { value: 'sales', label: '按销售额' }]} />}>
          <table className="data-table store-table">
            <thead><tr><th>名称</th><th>平台</th><th>订单量</th><th>销售额($)</th></tr></thead>
            <tbody>
              {view.storeTop.map((row) => (
                <tr key={row.key}>
                  <td title={row.storeName}>{row.storeName}</td>
                  <td>{row.platform}</td>
                  <td>{NUMBER_FORMATTER.format(row.orderCount)}</td>
                  <td>{USD_FORMATTER.format(row.sales)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="热销商品TOP 10" className="products-panel" actions={<MetricTabs value={productSort} onChange={setProductSort} items={[{ value: 'quantity', label: '按销量' }, { value: 'orders', label: '按订单数' }, { value: 'sales', label: '按销售额' }]} />}>
          <table className="data-table product-table">
            <thead><tr><th>图片</th><th>名称</th><th>销量</th><th>订单数</th><th>销售额($)</th><th>成交均价($)</th></tr></thead>
            <tbody>
              {view.productTop.map((row) => (
                <tr key={row.sku}>
                  <td><img className="product-thumb" src={asset(row.image)} alt={row.productName} /></td>
                  <td title={row.productName}>{row.productName}</td>
                  <td>{NUMBER_FORMATTER.format(row.quantity)}</td>
                  <td>{NUMBER_FORMATTER.format(row.orderCount)}</td>
                  <td>{USD_FORMATTER.format(row.sales)}</td>
                  <td>{USD_FORMATTER.format(row.avgPrice)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <section className="map-zone">
          <div className="map-actions"><MetricTabs value={mapMetric} onChange={setMapMetric} items={[{ value: 'sales', label: '按销售额' }, { value: 'orders', label: '按订单数' }]} /></div>
          <EChart className="map-chart" option={mapOption} mapName="world-demo" geoJson={data.worldGeo} />
        </section>

        <Panel title="实时订单" className="realtime-panel">
          <table className="data-table realtime-table">
            <thead><tr><th>类型</th><th>平台</th><th>店铺名称</th><th>站点</th><th>客户名称</th><th>下单金额($)</th><th>下单时间</th></tr></thead>
            <tbody>
              {visibleOrders.map((order) => (
                <tr key={order.order_id} className="live-row">
                  <td>{order.business_type || '自营'}</td>
                  <td>{order.platform}</td>
                  <td title={order.store_name}>{order.store_name}</td>
                  <td>{order.country_name_cn || order.site}</td>
                  <td title={order.customer_name}>{order.customer_name}</td>
                  <td>{USD_FORMATTER.format(order.amount)}</td>
                  <td title={order.displayDateTime}>{order.relative}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="GMV走势图 ($)" className="chart-panel chart-one">
          <EChart className="line-chart" option={gmvOption} />
        </Panel>
        <Panel title="订单量走势图" className="chart-panel chart-two">
          <EChart className="line-chart" option={ordersOption} />
        </Panel>
        <Panel title="自营-平台走势图" className="chart-panel chart-three" actions={<MetricTabs value={platformMetric} onChange={setPlatformMetric} items={[{ value: 'orders', label: '按订单量' }, { value: 'sales', label: '按销售额' }]} />}>
          <EChart className="line-chart" option={platformOption} />
        </Panel>
      </div>
    </main>
  );
}

export default function Page() {
  const [loggedIn, setLoggedIn] = useState(false);
  const [ready, setReady] = useState(false);
  const [dashboardData, setDashboardData] = useState(null);
  const [loadingError, setLoadingError] = useState('');

  useEffect(() => {
    setLoggedIn(localStorage.getItem(LOGIN_KEY) === '1');
    setReady(true);
  }, []);

  useEffect(() => {
    if (!loggedIn) return undefined;
    let alive = true;
    setLoadingError('');
    loadDashboardData()
      .then((loaded) => {
        if (alive) setDashboardData(loaded);
      })
      .catch((error) => {
        if (alive) setLoadingError(error?.message || '请检查 CSV 文件路径或文件格式。');
      });
    return () => { alive = false; };
  }, [loggedIn]);

  const logout = () => {
    localStorage.removeItem(LOGIN_KEY);
    setLoggedIn(false);
    setDashboardData(null);
  };

  if (!ready) return <LoadingPage />;
  if (!loggedIn) return <LoginPage onLogin={() => setLoggedIn(true)} />;
  if (loadingError) return <ErrorPage message={loadingError} onRetry={() => window.location.reload()} />;
  if (!dashboardData) return <LoadingPage />;
  return <Dashboard data={dashboardData} onLogout={logout} />;
}
