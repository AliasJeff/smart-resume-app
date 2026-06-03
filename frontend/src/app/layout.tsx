import type { Metadata } from "next";

import { ToastProvider } from "@/components/Toast";

import "./globals.css";

export const metadata: Metadata = {
  title: "Smart Resume — AI 简历助手",
  description: "上传 PDF 简历，AI 结构化解析与智能润色",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" className="h-full antialiased">
      <body className="min-h-full bg-background text-foreground">
        <ToastProvider>{children}</ToastProvider>
      </body>
    </html>
  );
}
