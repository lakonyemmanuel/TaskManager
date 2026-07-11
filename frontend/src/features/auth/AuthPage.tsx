import { useState } from 'react';

export default function AuthPage() {
    const [mode, setMode] = useState<'login' | 'register'>('login');

    return (
        <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
            <div className="mx-auto max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-8 shadow-2xl">
                <h1 className="text-2xl font-semibold">{mode === 'login' ? 'Sign in' : 'Create account'}</h1>
                <p className="mt-2 text-sm text-slate-400">Enterprise task management starter</p>
                <div className="mt-6 space-y-3">
                    <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Email" />
                    <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Password" type="password" />
                    {mode === 'register' && <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Full name" />}
                    <button className="w-full rounded-lg bg-sky-500 px-3 py-2 font-medium text-slate-950">Continue</button>
                </div>
                <button className="mt-4 text-sm text-sky-400" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
                    {mode === 'login' ? 'Need an account?' : 'Already have an account?'}
                </button>
            </div>
        </div>
    );
}
