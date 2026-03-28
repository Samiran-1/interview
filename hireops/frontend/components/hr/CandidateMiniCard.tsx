"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Briefcase, Calendar, Loader2, ThumbsUp, Ban, AlertTriangle } from "lucide-react";
import { GlassCard } from "@/components/ui/GlassCard";
import { ScoreBadge } from "@/components/ui/ScoreBadge";
import { fetchApi } from "@/lib/api";

export interface HRApplication {
  id: number;
  candidate_id: number;
  candidate: {
    id: number;
    full_name: string;
    email: string;
  };
  job_id: number;
  job: {
    id: number;
    title: string;
    company?: {
      id: number;
      name: string;
      description?: string;
    } | null;
    description?: string;
  };
  status: string;
  match_score?: number | null;
  mcq_score?: number | null;
  coding_score?: number | null;
  voice_score?: number | null;
  ai_feedback?: string | null;
}

interface CandidateMiniCardProps {
  app: HRApplication;
  columnKey: string;
}

export function CandidateMiniCard({ app, columnKey }: CandidateMiniCardProps) {
  const router = useRouter();
  const [scheduling, setScheduling] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [isRejecting, setIsRejecting] = useState(false);

  const candidateName = app.candidate?.full_name || "Unknown Candidate";
  const candidateEmail = app.candidate?.email || "No email";
  const jobTitle = app.job?.title || "Unknown Job";
  const companyName = app.job?.company?.name || "Unknown Company";

  // Test passing threshold (50%)
  const PASSING_THRESHOLD = 50;
  const mcqPassed = typeof app.mcq_score === 'number' && app.mcq_score >= PASSING_THRESHOLD;
  const codingPassed = typeof app.coding_score === 'number' && app.coding_score >= PASSING_THRESHOLD;
  const bothTestsTaken = typeof app.mcq_score === 'number' && typeof app.coding_score === 'number';
  const bothTestsPassed = mcqPassed && codingPassed;
  const eitherTestFailed = bothTestsTaken && !bothTestsPassed;

  // Determine if candidate needs review (both tests taken, not yet advanced/rejected)
  const isNeedsReview =
    bothTestsTaken &&
    app.status !== "VOICE_PENDING" &&
    app.status !== "SHORTLISTED" &&
    app.status !== "REJECTED";

  const handleSchedule = async () => {
    setScheduling(true);
    // Simulate API call
    await new Promise((r) => setTimeout(r, 1000));
    alert(`📅 1:1 Interview scheduled with ${candidateName} for "${jobTitle}"`);
    setScheduling(false);
  };

  const handleApproveForVoice = async () => {
    if (!bothTestsPassed) {
      alert("❌ Cannot approve: One or both tests did not meet the passing threshold.");
      return;
    }

    setIsApproving(true);
    try {
      await fetchApi(`/api/v1/applications/${app.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "VOICE_PENDING" }),
      });

      alert(`✅ ${candidateName} approved for voice interview!`);
      router.refresh();
    } catch (error) {
      console.error("Error approving candidate:", error);
      alert(`❌ Error: ${error instanceof Error ? error.message : "Failed to approve candidate"}`);
    } finally {
      setIsApproving(false);
    }
  };

  const handleReject = async () => {
    const reason = mcqPassed && codingPassed
      ? "Unknown reason"
      : !mcqPassed && !codingPassed
        ? `Both tests failed (MCQ: ${app.mcq_score?.toFixed(1)}%, Coding: ${app.coding_score?.toFixed(1)}%)`
        : !mcqPassed
          ? `MCQ test failed (${app.mcq_score?.toFixed(1)}%)`
          : `Coding test failed (${app.coding_score?.toFixed(1)}%)`;

    if (!window.confirm(`Reject ${candidateName}?\n\nReason: ${reason}`)) {
      return;
    }

    setIsRejecting(true);
    try {
      await fetchApi(`/api/v1/applications/${app.id}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: "REJECTED" }),
      });

      alert(`🚫 ${candidateName} has been rejected.`);
      router.refresh();
    } catch (error) {
      console.error("Error rejecting candidate:", error);
      alert(`❌ Error: ${error instanceof Error ? error.message : "Failed to reject candidate"}`);
    } finally {
      setIsRejecting(false);
    }
  };

  // Determine score display based on assessment phase
  const displayScore = app.mcq_score !== null && app.mcq_score !== undefined
    ? app.mcq_score
    : (app.match_score || null);

  return (
    <GlassCard
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      whileHover={{ y: -2, transition: { duration: 0.2 } }}
      className={`bg-neutral-800/30 p-4 rounded-2xl cursor-pointer group transition-all duration-200 ${columnKey === "SHORTLISTED"
        ? "border-emerald-500/25 hover:border-emerald-500/50 shadow-[0_0_15px_rgba(52,211,153,0.05)]"
        : columnKey === "REJECTED"
          ? "border-red-500/15 opacity-60 hover:opacity-80"
          : "border-neutral-700/40 hover:border-indigo-500/40"
        }`}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="min-w-0 flex-1">
          <p className="font-medium text-sm text-neutral-100 truncate">
            {candidateName}
          </p>
          <p className="text-[10px] text-neutral-500 truncate">
            {candidateEmail}
          </p>
        </div>
        {displayScore !== null && (
          <ScoreBadge score={displayScore} className="ml-2" />
        )}
      </div>

      {/* Assessment Scores */}
      {(typeof app.mcq_score === 'number' || typeof app.coding_score === 'number' || typeof app.voice_score === 'number') && (
        <div className="space-y-1 mb-2 text-[9px] text-neutral-400">
          {typeof app.mcq_score === 'number' && (
            <div className="flex items-center justify-between">
              <span>MCQ:</span>
              <span className="font-bold text-indigo-400">{app.mcq_score.toFixed(1)}%</span>
            </div>
          )}
          {typeof app.coding_score === 'number' && (
            <div className="flex items-center justify-between">
              <span>Coding:</span>
              <span className="font-bold text-violet-400">{app.coding_score.toFixed(1)}%</span>
            </div>
          )}
          {typeof app.voice_score === 'number' && (
            <div className="flex items-center justify-between">
              <span>Voice:</span>
              <span className="font-bold text-emerald-400">{app.voice_score.toFixed(1)}%</span>
            </div>
          )}
        </div>
      )}

      {/* Job info */}
      <div className="flex items-center gap-1.5 mt-2">
        <Briefcase className="w-3 h-3 text-neutral-600 shrink-0" />
        <span className="text-[10px] text-neutral-400 truncate">
          {jobTitle}
        </span>
      </div>

      {/* Progress bar for pipeline stages */}
      {columnKey !== "SHORTLISTED" && columnKey !== "REJECTED" && displayScore !== null && (
        <div className="mt-3 w-full bg-neutral-950/60 h-1 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(displayScore, 100)}%` }}
            transition={{ duration: 1, ease: "easeOut", delay: 0.3 }}
            className="bg-indigo-500/80 h-full rounded-full"
          />
        </div>
      )}

      {/* Action Buttons - Needs Review: Show warning and approve/reject options */}
      {columnKey === "NEEDS_REVIEW" && bothTestsTaken && (
        <div className="space-y-2 mt-3">
          {/* Warning Badge */}
          <div className="px-3 py-2 flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
            <span className="text-[10px] text-amber-400 font-semibold">Proctoring Violations Detected</span>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleApproveForVoice}
              disabled={isApproving}
              className="flex-1 py-2 flex items-center justify-center gap-2 bg-emerald-600/15 border border-emerald-500/30 text-emerald-400 text-[10px] font-bold tracking-wider rounded-lg hover:bg-emerald-600/25 disabled:opacity-50 transition-all"
            >
              {isApproving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ThumbsUp className="w-3 h-3" />
              )}
              {isApproving ? "Approving…" : "Approve"}
            </motion.button>

            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReject}
              disabled={isRejecting}
              className="flex-1 py-2 flex items-center justify-center gap-2 bg-red-600/15 border border-red-500/30 text-red-400 text-[10px] font-bold tracking-wider rounded-lg hover:bg-red-600/25 disabled:opacity-50 transition-all"
            >
              {isRejecting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Ban className="w-3 h-3" />
              )}
              {isRejecting ? "Rejecting…" : "Reject"}
            </motion.button>
          </div>
        </div>
      )}

      {/* Action Buttons - Needs Review (Test Results): Approve if pass, Reject if fail */}
      {columnKey !== "NEEDS_REVIEW" && isNeedsReview && (
        <div className="flex gap-2 mt-3">
          {bothTestsPassed ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleApproveForVoice}
              disabled={isApproving}
              className="flex-1 py-2 flex items-center justify-center gap-2 bg-cyan-600/15 border border-cyan-500/30 text-cyan-400 text-[11px] font-bold tracking-wider rounded-xl hover:bg-cyan-600/25 disabled:opacity-50 transition-all shadow-[0_0_12px_rgba(34,211,238,0.1)] hover:shadow-[0_0_16px_rgba(34,211,238,0.2)]"
            >
              {isApproving ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <ThumbsUp className="w-3 h-3" />
              )}
              {isApproving ? "Approving…" : "Approve for Voice"}
            </motion.button>
          ) : eitherTestFailed ? (
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleReject}
              disabled={isRejecting}
              className="flex-1 py-2 flex items-center justify-center gap-2 bg-red-600/15 border border-red-500/30 text-red-400 text-[11px] font-bold tracking-wider rounded-xl hover:bg-red-600/25 disabled:opacity-50 transition-all shadow-[0_0_12px_rgba(239,68,68,0.1)] hover:shadow-[0_0_16px_rgba(239,68,68,0.2)]"
            >
              {isRejecting ? (
                <Loader2 className="w-3 h-3 animate-spin" />
              ) : (
                <Ban className="w-3 h-3" />
              )}
              {isRejecting ? "Rejecting…" : "Reject"}
            </motion.button>
          ) : null}
        </div>
      )}

      {/* Schedule 1:1 — only for Shortlisted */}
      {columnKey === "SHORTLISTED" && (
        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          onClick={handleSchedule}
          disabled={scheduling}
          className="w-full mt-3 py-2 flex items-center justify-center gap-2 bg-emerald-600/15 border border-emerald-500/25 text-emerald-400 text-[11px] font-bold tracking-wider rounded-xl hover:bg-emerald-600/25 transition-all disabled:opacity-50"
        >
          {scheduling ? (
            <Loader2 className="w-3 h-3 animate-spin" />
          ) : (
            <Calendar className="w-3 h-3" />
          )}
          {scheduling ? "Scheduling…" : "Schedule 1:1"}
        </motion.button>
      )}
    </GlassCard>
  );
}
