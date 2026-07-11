import { Link, Outlet } from 'react-router-dom';

export default function AppLayout() {
    return (
        <div className="min-h-screen bg-slate-950 text-slate-100">
            <nav className="border-b border-slate-800 bg-slate-900/80 px-6 py-4">
                <div className="mx-auto flex max-w-7xl items-center justify-between">
                    <div className="font-semibold">TaskManager Enterprise</div>
                    <div className="flex gap-4 text-sm text-slate-300">
                        <Link to="/dashboard">Dashboard</Link>
                        <Link to="/kanban">Kanban</Link>
                        <Link to="/reports">Reports</Link>
                    </div>
                </div>
            </nav>
            <main>
                <Outlet />
            </main>
        </div>
    );
}
