export default function SettingsPage() {
    return (
        <div className="space-y-6">
            <h1 className="text-2xl font-bold">Settings</h1>
      
            <div className="border p-4 rounded space-y-4">
                <h2 className="text-lg font-semibold">Global Configuration</h2>
        
                <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                            <div className="font-medium">Friend Request Rate Limit</div>
                            <div className="text-sm text-gray-600">Maximum friend requests per bot</div>
                        </div>
                        <div className="text-right">
                            <div className="font-mono">1 / minute</div>
                            <div className="text-xs text-gray-500">Per bot limit</div>
                        </div>
                    </div>
          
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                            <div className="font-medium">Message Throughput</div>
                            <div className="text-sm text-gray-600">System-wide message rate</div>
                        </div>
                        <div className="text-right">
                            <div className="font-mono">≤ 1 msg/sec</div>
                            <div className="text-xs text-gray-500">Total system limit</div>
                        </div>
                    </div>
          
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                            <div className="font-medium">Agent Message Count</div>
                            <div className="text-sm text-gray-600">Messages sent by agent per chat</div>
                        </div>
                        <div className="text-right">
                            <div className="font-mono">3-5 messages</div>
                            <div className="text-xs text-gray-500">Random within range</div>
                        </div>
                    </div>
          
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
                        <div>
                            <div className="font-medium">Polling Interval</div>
                            <div className="text-sm text-gray-600">UI data refresh rate</div>
                        </div>
                        <div className="text-right">
                            <div className="font-mono">1-2 seconds</div>
                            <div className="text-xs text-gray-500">Auto-refresh</div>
                        </div>
                    </div>
                </div>
            </div>
      
            <div className="border p-4 rounded space-y-4">
                <h2 className="text-lg font-semibold">Proxy Configuration</h2>
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <div className="text-sm text-yellow-800">
                        <strong>Important:</strong> Each bot must use a sticky proxy to maintain consistent IP addresses.
            Proxies should be in the format: <code>http://username:password@proxy.host:port</code>
                    </div>
                </div>
            </div>
      
            <div className="border p-4 rounded space-y-4">
                <h2 className="text-lg font-semibold">Database</h2>
                <div className="p-3 bg-gray-50 rounded">
                    <div className="flex items-center justify-between">
                        <div>
                            <div className="font-medium">SQLite Database</div>
                            <div className="text-sm text-gray-600">Location: <code>prisma/dev.db</code></div>
                        </div>
                        <div className="text-green-600 text-sm">Active</div>
                    </div>
                </div>
            </div>
        </div>
    )
}