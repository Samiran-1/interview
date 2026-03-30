import Link from "next/link";
import { CheckCircle2 } from "lucide-react";

export default function CandidateCongratulationsPage() {
    return (
        <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(16,185,129,0.25),_transparent_45%)] bg-neutral-950 text-white flex items-center justify-center px-4 py-12">
            <main className="w-full max-w-3xl space-y-8 rounded-3xl border border-white/10 bg-neutral-900/70 p-10 shadow-[0_30px_80px_rgba(15,23,42,0.75)] backdrop-blur-xl text-center">
                <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-300">
                    <CheckCircle2 className="h-10 w-10" />
                </div>
                <h1 className="text-3xl font-semibold tracking-tight text-white">
                    Interview Complete
                </h1>
                <p className="text-base text-neutral-300 leading-relaxed">
                    Thank you for sharing your time with us. Your interview is complete. Our AI Recruiter is finalizing your evaluation scorecard and our HR team will be in touch shortly.
                </p>
                <p className="text-sm text-neutral-500">
                    Feel free to explore other opportunities or check your dashboard for next steps.
                </p>
                <Link
                    href="/candidate"
                    className="inline-flex items-center justify-center rounded-2xl border border-emerald-500/40 bg-emerald-500/10 px-6 py-3 text-sm font-semibold uppercase tracking-[0.3em] text-emerald-300 transition hover:border-emerald-400 hover:bg-emerald-500/20"
                >
                    Back to dashboard
                </Link>
            </main>
        </div>
    );
}
