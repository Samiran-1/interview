"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Loader2, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { fetchApi } from "@/lib/api";
import CandidateProfileForm from "@/components/forms/CandidateProfileForm";
import { CandidateProfileView } from "@/components/candidate/CandidateProfileView";

export default function ProfilePage() {
  const [isEditMode, setIsEditMode] = useState(false);
  const [candidate, setCandidate] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch candidate profile on mount
  useEffect(() => {
    let cancelled = false;

    const fetchProfile = async () => {
      setIsLoading(true);
      try {
        // Add small delay to ensure auth is hydrated
        await new Promise(resolve => setTimeout(resolve, 300));

        if (cancelled) return;

        const data = await fetchApi<any>("/api/v1/candidates/me");
        if (!cancelled) {
          setCandidate(data);
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to fetch profile:", err);
          // Set empty candidate state so we can show edit view
          setCandidate(null);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    fetchProfile();

    return () => {
      cancelled = true;
    };
  }, []);

  const handleEditClick = () => {
    setIsEditMode(true);
  };

  const handleEditComplete = () => {
    // Refresh profile data after edit
    setIsEditMode(false);
    const fetchProfile = async () => {
      try {
        const data = await fetchApi<any>("/api/v1/candidates/me");
        setCandidate(data);
      } catch (err) {
        console.error("Failed to refresh profile:", err);
      }
    };
    fetchProfile();
  };

  return (
    <div className="relative min-h-screen bg-neutral-950 py-12 px-4 overflow-auto">
      {/* Ambient */}
      <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-indigo-600/[0.03] rounded-full blur-[200px] pointer-events-none" />

      <div className="relative z-10">
        {/* Navigation */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8 flex items-center gap-3"
        >
          <Link
            href="/candidate"
            className="p-2.5 bg-neutral-900/60 border border-neutral-800 rounded-xl text-neutral-500 hover:text-neutral-200 hover:bg-neutral-800 transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <h1 className="text-2xl font-semibold text-neutral-100">My Profile</h1>
        </motion.div>

        {isLoading ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center justify-center min-h-[60vh]"
          >
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
              <p className="text-neutral-400">Loading profile...</p>
            </div>
          </motion.div>
        ) : isEditMode ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CandidateProfileForm onComplete={handleEditComplete} />
          </motion.div>
        ) : candidate ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
          >
            <CandidateProfileView candidate={candidate} onEditClick={handleEditClick} />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-neutral-900/40 border border-neutral-800/50 rounded-2xl p-8 text-center"
          >
            <p className="text-neutral-400 mb-6">No profile data found. Let's get you started!</p>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleEditClick}
              className="px-6 py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-all"
            >
              Create Profile
            </motion.button>
          </motion.div>
        )}
      </div>
    </div>
  );
}
