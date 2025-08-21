export default function Home() {
    return (
        <div className="space-y-4">
            <h1 className="text-3xl font-bold">Steam Multichat System</h1>
            <p className="text-gray-600">Internal bot management and multichat interface</p>
            <div className="grid grid-cols-2 gap-4 mt-8">
                <div className="border p-4 rounded">
                    <h2 className="text-xl font-semibold mb-2">Bots</h2>
                    <p className="text-gray-600">Manage Steam bot accounts</p>
                </div>
                <div className="border p-4 rounded">
                    <h2 className="text-xl font-semibold mb-2">Tasks</h2>
                    <p className="text-gray-600">Create and monitor tasks</p>
                </div>
                <div className="border p-4 rounded">
                    <h2 className="text-xl font-semibold mb-2">Chats</h2>
                    <p className="text-gray-600">View and manage conversations</p>
                </div>
                <div className="border p-4 rounded">
                    <h2 className="text-xl font-semibold mb-2">Settings</h2>
                    <p className="text-gray-600">System configuration</p>
                </div>
            </div>
        </div>
    )
}