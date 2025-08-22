import type { Metadata } from 'next'
import './globals.css'
import Header from '@/components/layout/header'
import { prisma } from '@/lib/db/client'

export const metadata: Metadata = {
    title: 'Steam Bot Multichat',
    description: 'Steam bot management and multichat system',
}

async function getBotsStats() {
    try {
        const bots = await prisma.bot.findMany({
            select: { status: true }
        })
        const onlineCount = bots.filter((b: any) => b.status === 'connected').length
        return { total: bots.length, online: onlineCount }
    } catch {
        return { total: 0, online: 0 }
    }
}

export default async function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    const botsStats = await getBotsStats()
    
    return (
        <html lang="en">
            <body className="min-h-screen bg-steam-darkblue text-white font-steam">
                <Header 
                    botsCount={botsStats.total} 
                    onlineBotsCount={botsStats.online}
                />
                <main className="container mx-auto px-4 py-6">
                    {children}
                </main>
            </body>
        </html>
    )
}