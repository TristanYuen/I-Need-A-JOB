import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "秋招投递表",
  description: "用一张表管理岗位、状态、截止日期和下一步动作。"
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
