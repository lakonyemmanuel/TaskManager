export default function DashboardPage() {
    return (
        <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
            <div className="mx-auto max-w-7xl">
                <h1 className="text-3xl font-semibold">Dashboard</h1>
                <p className="mt-2 text-slate-400">Overview of tasks, activity, and deadlines.</p>
                <div className="mt-6 grid gap-4 md:grid-cols-3">
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">Total tasks</div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">Completed</div>
                    <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">Overdue</div>
                </div>
            </div>
        </div>
    );
}
