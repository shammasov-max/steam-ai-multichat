import Link from 'next/link'
import { Activity, Users, Zap, MessageSquare, Settings, TrendingUp, Clock, CheckCircle } from 'lucide-react'
import { prisma } from '@/lib/db/client'

async function getDashboardStats() {
    try {
        const [bots, tasks, chats] = await Promise.all([
            prisma.bot.findMany({ select: { status: true } }),
            prisma.task.findMany({ select: { status: true } }),
            prisma.chat.findMany({ select: { agentEnabled: true } })
        ])

        return {
            totalBots: bots.length,
            onlineBots: bots.filter((b: any) => b.status === 'connected').length,
            totalTasks: tasks.length,
            activeTasks: tasks.filter((t: any) => ['created', 'assigned', 'invited'].includes(t.status)).length,
            totalChats: chats.length,
            agentChats: chats.filter((c: any) => c.agentEnabled).length
        }
    } catch {
        return {
            totalBots: 0,
            onlineBots: 0,
            totalTasks: 0,
            activeTasks: 0,
            totalChats: 0,
            agentChats: 0
        }
    }
}

export default async function Home() {
    const stats = await getDashboardStats()

    const cards = [
        {
            title: 'Bots Management',
            description: 'Add, remove and monitor Steam bot accounts',
            icon: <Users size={24} />,
            href: '/bots',
            stats: `${stats.onlineBots}/${stats.totalBots} online`,
            color: 'bg-steam-green'
        },
        {
            title: 'Tasks',
            description: 'Create and track automated tasks',
            icon: <Zap size={24} />,
            href: '/tasks',
            stats: `${stats.activeTasks} active`,
            color: 'bg-yellow-500'
        },
        {
            title: 'Chats',
            description: 'View and manage bot conversations',
            icon: <MessageSquare size={24} />,
            href: '/chats',
            stats: `${stats.totalChats} conversations`,
            color: 'bg-blue-500'
        },
        {
            title: 'Settings',
            description: 'Configure system parameters',
            icon: <Settings size={24} />,
            href: '/settings',
            stats: 'System config',
            color: 'bg-gray-500'
        }
    ]

    return (
        <div className="space-y-8">
            <div className="text-center py-8">
                <div className="flex justify-center mb-4">
                    <div className="w-16 h-16 bg-steam-green rounded-lg flex items-center justify-center">
                        <Activity size={32} className="text-white" />
                    </div>
                </div>
                <h1 className="text-4xl font-bold text-white mb-2">Steam Multichat System</h1>
                <p className="text-gray-400">Internal bot management and multichat interface</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {cards.map((card) => (
                    <Link
                        key={card.href}
                        href={card.href}
                        className="block group"
                    >
                        <div className="bg-steam-blue border border-steam-lightblue rounded-lg p-6 hover:border-steam-green transition-all duration-200 hover:shadow-lg hover:shadow-steam-green/20">
                            <div className="flex items-start justify-between mb-4">
                                <div className={`${card.color} p-3 rounded-lg`}>
                                    {card.icon}
                                </div>
                                <span className="text-sm text-gray-400">{card.stats}</span>
                            </div>
                            <h2 className="text-xl font-semibold text-white mb-2 group-hover:text-steam-green transition-colors">
                                {card.title}
                            </h2>
                            <p className="text-gray-400">{card.description}</p>
                        </div>
                    </Link>
                ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-8 border-t border-steam-lightblue">
                <div className="bg-steam-blue rounded-lg p-4 border border-steam-lightblue/50">
                    <div className="flex items-center space-x-3">
                        <TrendingUp className="text-steam-green" size={20} />
                        <div>
                            <p className="text-xs text-gray-400">System Status</p>
                            <p className="text-lg font-semibold text-white">Operational</p>
                        </div>
                    </div>
                </div>
                <div className="bg-steam-blue rounded-lg p-4 border border-steam-lightblue/50">
                    <div className="flex items-center space-x-3">
                        <Clock className="text-yellow-400" size={20} />
                        <div>
                            <p className="text-xs text-gray-400">Message Rate</p>
                            <p className="text-lg font-semibold text-white">≤1 msg/sec</p>
                        </div>
                    </div>
                </div>
                <div className="bg-steam-blue rounded-lg p-4 border border-steam-lightblue/50">
                    <div className="flex items-center space-x-3">
                        <CheckCircle className="text-green-400" size={20} />
                        <div>
                            <p className="text-xs text-gray-400">Database</p>
                            <p className="text-lg font-semibold text-white">SQLite Active</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}