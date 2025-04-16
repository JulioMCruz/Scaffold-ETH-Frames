"use client"

import { Geist, Geist_Mono } from "next/font/google"
//import { NeynarContextProvider } from "@neynar/react"
import "./globals.css"
import { NeynarContextProvider, Theme } from "@neynar/react";
import "@neynar/react/dist/style.css";
import { Header } from "@/components/Header";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

if (!process.env.NEXT_PUBLIC_NEYNAR_API_KEY) {
  throw new Error("Missing NEXT_PUBLIC_NEYNAR_API_KEY environment variable")
}

if (!process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID) {
  throw new Error("Missing NEXT_PUBLIC_NEYNAR_CLIENT_ID environment variable")
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <NeynarContextProvider 
          settings={{
            clientId: process.env.NEXT_PUBLIC_NEYNAR_CLIENT_ID || '',
            defaultTheme: Theme.Dark,
            eventsCallbacks: {
              onAuthSuccess: () => {
                console.log("onAuthSuccess");
              },
              onSignout: () => {
                console.log("onSignout");
              },
            },            
          }}
        >
          <Header />
          {children}
        </NeynarContextProvider>
      </body>
    </html>
  )
}
