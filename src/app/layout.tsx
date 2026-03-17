import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { headers } from "next/headers";
import { GNB } from "@/components/GNB";
import { createClient } from "@/lib/supabase/server";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "나눗 - 우리 건물 공동구매",
  description: "이웃과 함께하는 스마트 공동구매 서비스",
};

const NO_GNB_PATHS = ['/login', '/signup', '/building', '/auth'];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const headersList = await headers();
  const pathname = headersList.get('x-pathname') || '';
  const showGNB = !NO_GNB_PATHS.some(p => pathname.startsWith(p));

  let isAuthenticated = false;
  if (showGNB) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    isAuthenticated = !!user;
  }

  return (
    <html lang="ko" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <div className="mx-auto max-w-[440px] min-h-screen bg-white shadow-xl flex flex-col relative overflow-hidden">
          <div className={`flex flex-col flex-1 ${isAuthenticated && showGNB ? 'pb-16' : ''}`}>
            {children}
          </div>
          {isAuthenticated && showGNB && <GNB />}
        </div>
      </body>
    </html>
  );
}
