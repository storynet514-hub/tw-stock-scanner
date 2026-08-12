export const metadata = {
  title: '台股儀表板',
  description: '台股即時掃描儀表板',
};

export default function RootLayout({ children }) {
  return (
    <html lang="zh-TW">
      <body>{children}</body>
    </html>
  );
}
