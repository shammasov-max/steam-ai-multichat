'use client'

import { Settings, Database, Clock, MessageSquare, Bot, Shield, AlertCircle, Server, GitBranch } from 'lucide-react'

export default function SettingsPage() {
    const systemConstants = {
        friendRequestRate: '1 request per minute per bot',
        messageThroughput: '≤1 message per second (system-wide)',
        agentMessageCount: '3-5 messages on accept',
        pollingInterval: '1-2 seconds',
        taskAssignment: 'Round-robin distribution',
        sessionManagement: 'In-process Steam connections',
        proxyRequirement: 'Sticky sessions required'
    }

    const databaseConfig = {
        type: 'SQLite',
        location: './prisma/dev.db',
        orm: 'Prisma',
        migrations: 'Auto-applied on startup',
        backup: 'Manual backup recommended',
        size: 'Varies by usage',
        status: 'Active'
    }

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-white">System Settings</h1>
                <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-sm text-gray-300">System Operational</span>
                </div>
            </div>

            {/* System Constants */}
            <div className="bg-steam-blue border border-steam-lightblue rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                    <Settings className="text-steam-green" size={24} />
                    <h2 className="text-xl font-semibold text-white">System Constants</h2>
                </div>
                
                <div className="grid gap-4 md:grid-cols-2">
                    {/* Friend Request Rate */}
                    <div className="bg-steam-darkblue/50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <Bot size={16} className="text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-300">Friend Request Rate</h3>
                        </div>
                        <p className="text-white font-mono text-sm">{systemConstants.friendRequestRate}</p>
                        <p className="text-xs text-gray-400 mt-1">Steam API rate limit compliance</p>
                    </div>

                    {/* Message Throughput */}
                    <div className="bg-steam-darkblue/50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <MessageSquare size={16} className="text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-300">Message Throughput</h3>
                        </div>
                        <p className="text-white font-mono text-sm">{systemConstants.messageThroughput}</p>
                        <p className="text-xs text-gray-400 mt-1">Global rate limiting</p>
                    </div>

                    {/* Agent Messages */}
                    <div className="bg-steam-darkblue/50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <MessageSquare size={16} className="text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-300">Agent Message Count</h3>
                        </div>
                        <p className="text-white font-mono text-sm">{systemConstants.agentMessageCount}</p>
                        <p className="text-xs text-gray-400 mt-1">Scripted responses on friendship accept</p>
                    </div>

                    {/* Polling Interval */}
                    <div className="bg-steam-darkblue/50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <Clock size={16} className="text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-300">Polling Interval</h3>
                        </div>
                        <p className="text-white font-mono text-sm">{systemConstants.pollingInterval}</p>
                        <p className="text-xs text-gray-400 mt-1">UI refresh rate</p>
                    </div>

                    {/* Task Assignment */}
                    <div className="bg-steam-darkblue/50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <GitBranch size={16} className="text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-300">Task Assignment</h3>
                        </div>
                        <p className="text-white font-mono text-sm">{systemConstants.taskAssignment}</p>
                        <p className="text-xs text-gray-400 mt-1">Automatic load balancing</p>
                    </div>

                    {/* Session Management */}
                    <div className="bg-steam-darkblue/50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <Server size={16} className="text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-300">Session Management</h3>
                        </div>
                        <p className="text-white font-mono text-sm">{systemConstants.sessionManagement}</p>
                        <p className="text-xs text-gray-400 mt-1">Steam client handling</p>
                    </div>
                </div>

                {/* Proxy Warning */}
                <div className="mt-4 p-4 bg-yellow-500/10 border border-yellow-500/30 rounded-lg">
                    <div className="flex items-start space-x-2">
                        <AlertCircle className="text-yellow-400 mt-0.5" size={16} />
                        <div>
                            <p className="text-sm font-medium text-yellow-400">Proxy Configuration</p>
                            <p className="text-xs text-gray-300 mt-1">
                                {systemConstants.proxyRequirement}. Format: <code className="bg-steam-darkblue px-1 py-0.5 rounded">http://username:password@proxy.host:port</code>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Database Configuration */}
            <div className="bg-steam-blue border border-steam-lightblue rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                    <Database className="text-steam-green" size={24} />
                    <h2 className="text-xl font-semibold text-white">Database Configuration</h2>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    {/* Database Type */}
                    <div className="bg-steam-darkblue/50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <Database size={16} className="text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-300">Database Type</h3>
                        </div>
                        <p className="text-white font-mono text-sm">{databaseConfig.type}</p>
                        <p className="text-xs text-gray-400 mt-1">Embedded database engine</p>
                    </div>

                    {/* Location */}
                    <div className="bg-steam-darkblue/50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <Server size={16} className="text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-300">Database Location</h3>
                        </div>
                        <p className="text-white font-mono text-sm break-all">{databaseConfig.location}</p>
                        <p className="text-xs text-gray-400 mt-1">Local file path</p>
                    </div>

                    {/* ORM */}
                    <div className="bg-steam-darkblue/50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <GitBranch size={16} className="text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-300">ORM</h3>
                        </div>
                        <p className="text-white font-mono text-sm">{databaseConfig.orm}</p>
                        <p className="text-xs text-gray-400 mt-1">Object-relational mapping</p>
                    </div>

                    {/* Migrations */}
                    <div className="bg-steam-darkblue/50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <Settings size={16} className="text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-300">Migrations</h3>
                        </div>
                        <p className="text-white font-mono text-sm">{databaseConfig.migrations}</p>
                        <p className="text-xs text-gray-400 mt-1">Schema management</p>
                    </div>

                    {/* Backup */}
                    <div className="bg-steam-darkblue/50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <Shield size={16} className="text-gray-400" />
                            <h3 className="text-sm font-medium text-gray-300">Backup Strategy</h3>
                        </div>
                        <p className="text-white font-mono text-sm">{databaseConfig.backup}</p>
                        <p className="text-xs text-gray-400 mt-1">Data protection</p>
                    </div>

                    {/* Status */}
                    <div className="bg-steam-darkblue/50 rounded-lg p-4">
                        <div className="flex items-center space-x-2 mb-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <h3 className="text-sm font-medium text-gray-300">Connection Status</h3>
                        </div>
                        <p className="text-white font-mono text-sm">{databaseConfig.status}</p>
                        <p className="text-xs text-gray-400 mt-1">Real-time status</p>
                    </div>
                </div>
            </div>

            {/* System Information */}
            <div className="bg-steam-blue border border-steam-lightblue rounded-lg p-6">
                <div className="flex items-center space-x-3 mb-4">
                    <AlertCircle className="text-steam-green" size={24} />
                    <h2 className="text-xl font-semibold text-white">System Information</h2>
                </div>

                <div className="space-y-3">
                    <div className="flex items-center justify-between py-2 border-b border-steam-lightblue/30">
                        <span className="text-sm text-gray-300">Application Mode</span>
                        <span className="text-sm font-mono text-white">Internal Use Only</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-steam-lightblue/30">
                        <span className="text-sm text-gray-300">Authentication</span>
                        <span className="text-sm font-mono text-white">None (Internal)</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-steam-lightblue/30">
                        <span className="text-sm text-gray-300">Deployment</span>
                        <span className="text-sm font-mono text-white">Docker Container</span>
                    </div>
                    <div className="flex items-center justify-between py-2 border-b border-steam-lightblue/30">
                        <span className="text-sm text-gray-300">Framework</span>
                        <span className="text-sm font-mono text-white">Next.js + RSC</span>
                    </div>
                    <div className="flex items-center justify-between py-2">
                        <span className="text-sm text-gray-300">Steam Integration</span>
                        <span className="text-sm font-mono text-white">Real Steam (maFile + Proxies)</span>
                    </div>
                </div>
            </div>

            {/* Footer Note */}
            <div className="text-center py-4 text-xs text-gray-400">
                <p>These settings are read-only system constants defined at deployment.</p>
                <p>Contact system administrator to modify configuration.</p>
            </div>
        </div>
    )
}