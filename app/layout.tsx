import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    title: 'Steam Multichat',
    description: 'Steam bot management and multichat system',
}

export default function RootLayout({
    children,
}: {
  children: React.ReactNode
}) {
    return (
        <html lang="en">
            <body className={inter.className}>
                <nav className="bg-gray-800 text-white p-4">
                    <div className="container mx-auto flex gap-4">
                        <a href="/bots" className="hover:text-gray-300">Bots</a>
                        <a href="/tasks" className="hover:text-gray-300">Tasks</a>
                        <a href="/chats" className="hover:text-gray-300">Chats</a>
                        <a href="/settings" className="hover:text-gray-300">Settings</a>
                    </div>
                </nav>
                <main className="container mx-auto p-4">
                    {children}
                </main>
            </body>
        </html>
    )
}