import './globals.css';

export const metadata = {
  title: '实时数据大屏',
  description: '跨境电商 ERP 实时数据大屏 Demo'
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
