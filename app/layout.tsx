import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "لیدرا | اتوماسیون هوشمند تور لیدرها",
  description: "پلتفرم مدیریت و ثبت‌نام هوشمند ویژه تور لیدرهای شاهو",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fa" dir="rtl" className="h-full antialiased">
      <body className="min-h-full flex flex-col">
        {children}
      </body>
    </html>
  );
}