"use client";

import { useCallback, useMemo, useState } from "react";
import dynamic from "next/dynamic";

const MonacoEditor = dynamic(() => import("@monaco-editor/react"), { ssr: false });

const languages = [
    { label: "Python", value: "python" },
    { label: "JavaScript", value: "javascript" },
    { label: "Java", value: "java" },
    { label: "C++", value: "cpp" },
];

const defaultProblem = {
    title: "Balanced Brackets Checker",
    difficulty: "Easy",
    description:
        "Given a string containing just the characters '(', ')', '{', '}', '[' and ']', return true if the input string is valid. An input string is valid if every opening bracket has a corresponding closing bracket of the same type and the brackets close in the correct order.",
    examples: [
        {
            input: "()[]{}",
            output: "true",
        },
        {
            input: "([)]",
            output: "false",
        },
    ],
};

export default function CodingAssessmentPage() {
    const [language, setLanguage] = useState("python");
    const [code, setCode] = useState<string>("# Write your solution here\n
def is_valid(s): \n    stack = []\n    mapping = { ')': '(', '}': '{', ']': '[' }\n    for char in s: \n        if char in mapping: \n            if not stack or stack.pop() != mapping[char]: \n                return False\n        else: \n            stack.append(char) \n    return not stack\n");
    const [output, setOutput] = useState("Ready to run your code.");
    const [isRunning, setIsRunning] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    const runCode = useCallback(async () => {
        setIsRunning(true);
        setOutput("Executing...");
        try {
            const response = await fetch("https://emkc.org/api/v2/piston/execute", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    language,
                    version: "*",
                    files: [{ content: code }],
                }),
            });

            const result = await response.json();
            const stderr = result?.run?.stderr;
            const stdout = result?.run?.stdout;
            if (stderr) {
                setOutput(stderr);
            } else if (stdout) {
                setOutput(stdout);
            } else {
                setOutput("Execution finished with no output.");
            }
        } catch (error) {
            setOutput((error as Error).message);
        } finally {
            setIsRunning(false);
        }
    }, [code, language]);

    const languageLabel = useMemo(() => languages.find((item) => item.value === language)?.label ?? "Python", [
        language,
    ]);

    return (
        <div className="min-h-screen bg-neutral-950 text-white">
            <header className="border-b border-neutral-800 bg-neutral-900 px-6 py-4 flex items-center justify-between">
                <div className="text-xl font-semibold tracking-wide">HireOps</div>
                <div className="flex items-center gap-3">
                    <select
                        className="bg-neutral-800 border border-neutral-700 px-3 py-1 rounded text-sm"
                        value={language}
                        onChange={(event) => setLanguage(event.target.value)}
                    >
                        {languages.map((item) => (
                            <option key={item.value} value={item.value}>
                                {item.label}
                            </option>
                        ))}
                    </select>
                    <button
                        className={`px-4 py-2 rounded-full bg-emerald-500 text-xs font-semibold tracking-wide uppercase hover:bg-emerald-400 transition ${isSubmitting ? "opacity-60 cursor-not-allowed" : ""
                            }`}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "Submitting..." : "Submit Code"}
                    </button>
                </div>
            </header>

            <div className="flex min-h-[calc(100vh-64px)]">
                <aside className="w-1/3 border-r border-neutral-800 bg-neutral-900 p-6 space-y-6">
                    <div>
                        <p className="text-sm text-neutral-400 uppercase tracking-[0.4em]">Problem</p>
                        <h1 className="mt-3 text-2xl font-bold">{defaultProblem.title}</h1>
                        <span className="inline-flex items-center rounded-full border border-emerald-400 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-emerald-300">
                            {defaultProblem.difficulty}
                        </span>
                    </div>
                    <p className="text-sm text-neutral-300 leading-relaxed">{defaultProblem.description}</p>
                    <div className="space-y-3">
                        <h2 className="text-sm font-semibold uppercase tracking-[0.3em] text-neutral-400">Examples</h2>
                        {defaultProblem.examples.map((example, index) => (
                            <div key={index} className="rounded-2xl border border-neutral-800 bg-neutral-950/60 p-4 space-y-2 text-sm">
                                <div className="text-xs font-semibold text-neutral-500">Input</div>
                                <div className="rounded bg-neutral-900 p-3 font-mono text-xs text-neutral-200">{example.input}</div>
                                <div className="text-xs font-semibold text-neutral-500">Output</div>
                                <div className="rounded bg-neutral-900 p-3 font-mono text-xs text-neutral-200">{example.output}</div>
                            </div>
                        ))}
                    </div>
                </aside>

                <main className="w-2/3 p-6 flex flex-col gap-4">
                    <div className="flex-1 rounded-3xl border border-neutral-800 bg-neutral-900/70">
                        <MonacoEditor
                            height="100%"
                            theme="vs-dark"
                            language={language}
                            value={code}
                            onChange={(value) => setCode(value ?? "")}
                            options={{ minimap: { enabled: false }, fontSize: 14, automaticLayout: true }}
                        />
                    </div>
                    <section className="h-48 rounded-3xl border border-neutral-800 bg-neutral-900/70 p-4 flex flex-col">
                        <div className="flex items-center justify-between pb-3 border-b border-neutral-850 text-xs uppercase tracking-[0.4em] text-neutral-400">
                            <span>console</span>
                            <button
                                className={`inline-flex items-center gap-2 rounded-full border border-emerald-500 px-4 py-1 text-[11px] font-semibold tracking-[0.3em] ${isRunning ? "bg-emerald-600/40 text-green-100" : "bg-transparent text-emerald-300 hover:bg-emerald-500/20"
                                    }`}
                                onClick={runCode}
                                disabled={isRunning}
                            >
                                ▶ {isRunning ? "Running..." : "Run Code"}
                            </button>
                        </div>
                        <div className="mt-3 flex-1 overflow-auto rounded-2xl border border-neutral-850 bg-black/60 p-3 text-[13px] font-mono leading-relaxed text-neutral-200">
                            <pre className="whitespace-pre-wrap break-words">{output}</pre>
                        </div>
                    </section>
                </main>
            </div>
        </div>
    );
}
