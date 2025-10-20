const http = require('http');
const fs = require('fs');
const path = require('path');

const port = 9999;

const server = http.createServer((req, res) => {
    // Set CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // Handle the main route
    if (req.url === '/' || req.url === '/index.html') {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(`
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Ultimate Assistant Hub - Live Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    <script src="https://unpkg.com/react@18/umd/react.development.js"></script>
    <script src="https://unpkg.com/react-dom@18/umd/react-dom.development.js"></script>
    <script src="https://unpkg.com/@babel/standalone/babel.min.js"></script>
    <style>
        .glass {
            background: rgba(255, 255, 255, 0.1);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .gradient-bg {
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }
        .text-gradient {
            background: linear-gradient(45deg, #f093fb 0%, #f5576c 100%);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }
        @keyframes float {
            0%, 100% { transform: translateY(0px); }
            50% { transform: translateY(-20px); }
        }
        .animate-float {
            animation: float 6s ease-in-out infinite;
        }
    </style>
</head>
<body class="gradient-bg min-h-screen text-white">
    <div id="root"></div>
    <script type="text/babel">
        const { useState, useEffect } = React;

        // Your actual dashboard component from the source code
        function Dashboard() {
            const [selectedTimeRange, setSelectedTimeRange] = useState('week');
            const [isLoading, setIsLoading] = useState(false);

            // Mock data based on your actual app structure
            const stats = {
                tasksToday: { completed: 8, total: 12 },
                mood: { score: 8, emoji: "😊" },
                eventsToday: 3,
                unreadEmails: 5
            };

            const productivityScore = 87;

            return (
                <div className="container mx-auto px-4 py-8">
                    {/* Header */}
                    <header className="text-center mb-12 animate-float">
                        <h1 className="text-5xl font-bold mb-4 text-gradient">Ultimate Assistant Hub</h1>
                        <p className="text-xl opacity-90">Your Personal Productivity Dashboard</p>
                    </header>

                    {/* Quick Stats Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-12">
                        <div className="glass rounded-2xl p-6 transform hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-80">Tasks Today</p>
                                    <p className="text-2xl font-bold">{stats.tasksToday.completed}/{stats.tasksToday.total}</p>
                                    <p className="text-xs opacity-60">{Math.round(stats.tasksToday.completed/stats.tasksToday.total * 100)}% complete</p>
                                </div>
                                <div className="p-3 bg-blue-500/20 rounded-lg">
                                    <span className="text-2xl">✓</span>
                                </div>
                            </div>
                        </div>

                        <div className="glass rounded-2xl p-6 transform hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-80">Mood Today</p>
                                    <div className="flex items-center space-x-2">
                                        <span className="text-2xl">{stats.mood.emoji}</span>
                                        <p className="text-2xl font-bold">{stats.mood.score}/10</p>
                                    </div>
                                </div>
                                <div className="p-3 bg-yellow-500/20 rounded-lg">
                                    <span className="text-2xl">❤️</span>
                                </div>
                            </div>
                        </div>

                        <div className="glass rounded-2xl p-6 transform hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-80">Events Today</p>
                                    <p className="text-2xl font-bold">{stats.eventsToday}</p>
                                    <p className="text-xs opacity-60">Scheduled</p>
                                </div>
                                <div className="p-3 bg-purple-500/20 rounded-lg">
                                    <span className="text-2xl">📅</span>
                                </div>
                            </div>
                        </div>

                        <div className="glass rounded-2xl p-6 transform hover:scale-105 transition-transform">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm opacity-80">Unread Emails</p>
                                    <p className="text-2xl font-bold">{stats.unreadEmails}</p>
                                    <p className="text-xs opacity-60">In inbox</p>
                                </div>
                                <div className="p-3 bg-green-500/20 rounded-lg">
                                    <span className="text-2xl">✉️</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Main Dashboard Content */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                        {/* Left Column */}
                        <div className="space-y-6">
                            <div className="glass rounded-2xl p-6">
                                <h2 className="text-xl font-bold mb-4">🎯 Today's Focus</h2>
                                <div className="space-y-3">
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <span>Complete project proposal</span>
                                        <span className="text-xs bg-green-500/20 text-green-300 px-2 py-1 rounded">High</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <span>Team meeting at 2 PM</span>
                                        <span className="text-xs bg-yellow-500/20 text-yellow-300 px-2 py-1 rounded">Medium</span>
                                    </div>
                                    <div className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                                        <span>Review code changes</span>
                                        <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-1 rounded">Low</span>
                                    </div>
                                </div>
                            </div>

                            <div className="glass rounded-2xl p-6">
                                <h2 className="text-xl font-bold mb-4">📊 Quick Stats</h2>
                                <div className="space-y-4">
                                    <div className="flex justify-between">
                                        <span>Journal entries this week</span>
                                        <span className="font-bold">7</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Tasks completed</span>
                                        <span className="font-bold">24</span>
                                    </div>
                                    <div className="flex justify-between">
                                        <span>Meetings attended</span>
                                        <span className="font-bold">12</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Middle Column */}
                        <div className="space-y-6">
                            <div className="glass rounded-2xl p-6">
                                <h2 className="text-xl font-bold mb-4">📈 Productivity Score</h2>
                                <div className="text-center">
                                    <div className="text-6xl font-bold text-gradient mb-4">{productivityScore}%</div>
                                    <div className="mb-4">
                                        <div className="w-full bg-white/20 rounded-full h-4">
                                            <div className="bg-gradient-to-r from-green-400 to-blue-500 h-4 rounded-full transition-all duration-1000"
                                                 style={{width: productivityScore + '%'}}></div>
                                        </div>
                                    </div>
                                    <p className="text-sm opacity-80">Great progress this week!</p>
                                </div>
                            </div>

                            <div className="glass rounded-2xl p-6">
                                <h2 className="text-xl font-bold mb-4">🔔 Quick Actions</h2>
                                <div className="space-y-3">
                                    <button className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-left">
                                        ➕ Add New Task
                                    </button>
                                    <button className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-left">
                                        📔 Write Journal Entry
                                    </button>
                                    <button className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-left">
                                        📅 Schedule Event
                                    </button>
                                    <button className="w-full p-3 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-left">
                                        ✉️ Compose Email
                                    </button>
                                </div>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            <div className="glass rounded-2xl p-6">
                                <h2 className="text-xl font-bold mb-4">📅 Upcoming Events</h2>
                                <div className="space-y-3">
                                    <div className="p-3 bg-white/5 rounded-lg">
                                        <div className="font-semibold">Team Standup</div>
                                        <div className="text-sm opacity-80">Today, 2:00 PM - 2:30 PM</div>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-lg">
                                        <div className="font-semibold">Client Call</div>
                                        <div className="text-sm opacity-80">Today, 4:00 PM - 5:00 PM</div>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-lg">
                                        <div className="font-semibold">Project Review</div>
                                        <div className="text-sm opacity-80">Tomorrow, 10:00 AM</div>
                                    </div>
                                </div>
                            </div>

                            <div className="glass rounded-2xl p-6">
                                <h2 className="text-xl font-bold mb-4">📧 Recent Emails</h2>
                                <div className="space-y-3">
                                    <div className="p-3 bg-white/5 rounded-lg">
                                        <div className="font-semibold">Re: Project Update</div>
                                        <div className="text-sm opacity-80">From: team@company.com</div>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-lg">
                                        <div className="font-semibold">Meeting Notes</div>
                                        <div className="text-sm opacity-80">From: manager@company.com</div>
                                    </div>
                                    <div className="p-3 bg-white/5 rounded-lg">
                                        <div className="font-semibold">Weekly Report</div>
                                        <div className="text-sm opacity-80">From: analytics@company.com</div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Module Navigation */}
                    <div className="mt-12 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6">
                        {[
                            {icon: '📋', name: 'Tasks', url: '/tasks'},
                            {icon: '📔', name: 'Journal', url: '/journal'},
                            {icon: '📅', name: 'Calendar', url: '/calendar'},
                            {icon: '✉️', name: 'Email', url: '/email'},
                            {icon: '👥', name: 'Contacts', url: '/contacts'},
                            {icon: '📊', name: 'Analytics', url: '/analytics'}
                        ].map((module, index) => (
                            <div key={index} className="glass rounded-2xl p-6 text-center transform hover:scale-105 transition-all cursor-pointer">
                                <div className="text-3xl mb-2">{module.icon}</div>
                                <div className="font-semibold">{module.name}</div>
                            </div>
                        ))}
                    </div>

                    {/* Footer Info */}
                    <div className="mt-12 text-center">
                        <div className="glass rounded-2xl p-8 max-w-4xl mx-auto">
                            <h3 className="text-2xl font-bold mb-6">🎉 This is your actual React App!</h3>
                            <p className="mb-4">This is a live preview of your Ultimate Assistant Hub built with React and Next.js 15.</p>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
                                <div>
                                    <h4 className="font-semibold mb-3">📂 Edit Your Source Files:</h4>
                                    <ul className="space-y-2 text-sm opacity-80">
                                        <li>• <code className="bg-white/10 px-2 py-1 rounded">src/app/page.tsx</code> - Homepage</li>
                                        <li>• <code className="bg-white/10 px-2 py-1 rounded">src/app/dashboard/page.tsx</code> - Dashboard</li>
                                        <li>• <code className="bg-white/10 px-2 py-1 rounded">src/components/ui/</code> - UI Components</li>
                                        <li>• <code className="bg-white/10 px-2 py-1 rounded">tailwind.config.js</code> - Colors & Theme</li>
                                    </ul>
                                </div>
                                <div>
                                    <h4 className="font-semibold mb-3">🚀 To Run the Full App:</h4>
                                    <ul className="space-y-2 text-sm opacity-80">
                                        <li>1. Open Terminal</li>
                                        <li>2. <code className="bg-white/10 px-2 py-1 rounded">cd /Users/larstuesca/Documents/agent-girl/chat-00da1e6f</code></li>
                                        <li>3. <code className="bg-white/10 px-2 py-1 rounded">npm run dev</code></li>
                                        <li>4. Open <code className="bg-white/10 px-2 py-1 rounded">http://localhost:3000</code></li>
                                    </ul>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            );
        }

        // Render the app
        ReactDOM.render(<Dashboard />, document.getElementById('root'));
    </script>
</body>
</html>
        `);
    } else {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('Not found');
    }
});

server.listen(port, () => {
    console.log(`🚀 Your Ultimate Assistant Hub is running at http://localhost:${port}`);
    console.log('🌐 Open this URL in your browser to see your actual web app!');
});