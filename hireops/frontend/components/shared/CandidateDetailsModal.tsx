"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import {
    FiMail,
    FiPhone,
    FiBriefcase,
    FiCode,
    FiAward,
    FiBook,
    FiExternalLink,
} from "react-icons/fi";
import {
    FaGithub,
    FaLinkedin,
} from "react-icons/fa";
import { GlassModal } from "@/components/ui/GlassModal";
import { ScoreBadge } from "@/components/ui/ScoreBadge";

export interface CandidateDetailsModalProps {
    isOpen: boolean;
    onClose: () => void;
    candidate: any;
}

export function CandidateDetailsModal({
    isOpen,
    onClose,
    candidate,
}: CandidateDetailsModalProps) {
    if (!candidate) return null;

    // Handle nested candidate data structures (from HRApplication)
    const candidateData = candidate.candidate || candidate;

    const candidateName = candidateData.user?.full_name || candidateData.full_name || "Unknown Candidate";
    const candidateEmail = candidateData.user?.email || candidateData.email || "N/A";
    const candidatePhone = candidateData.phone || "N/A";
    const professionalSummary = candidateData.professional_summary || "No professional summary provided.";
    const technicalSkills = Array.isArray(candidateData.technical_skills) ? candidateData.technical_skills : [];
    const softSkills = Array.isArray(candidateData.soft_skills) ? candidateData.soft_skills : [];
    const experience = candidateData.experience_years || 0;
    const github = candidateData.github || null;
    const linkedin = candidateData.linkedin || null;
    const education = Array.isArray(candidateData.education) ? candidateData.education : [];
    const projects = Array.isArray(candidateData.projects) ? candidateData.projects : [];
    const overallScore = candidateData.overall_score || 0;

    return (
        <GlassModal isOpen={isOpen} onClose={onClose} className="max-w-3xl overflow-hidden p-0">
            {/* Scrollable Content Container */}
            <div className="max-h-[85vh] overflow-y-auto custom-scrollbar">
                {/* Header Section */}
                <div className="p-8 pb-6 border-b border-neutral-800/50 bg-neutral-900/40 relative">
                    <div className="flex justify-between items-start">
                        <div className="flex-1">
                            <h2 className="text-3xl font-semibold text-neutral-100 tracking-tight leading-snug">
                                {candidateName}
                            </h2>
                            <div className="flex flex-wrap items-center gap-x-6 gap-y-3 mt-4 text-sm text-neutral-400 font-medium">
                                <span className="flex items-center gap-1.5 text-neutral-300">
                                    <FiMail className="w-4 h-4 text-neutral-500" />
                                    {candidateEmail}
                                </span>
                                {candidatePhone !== "N/A" && (
                                    <span className="flex items-center gap-1.5">
                                        <FiPhone className="w-4 h-4 text-neutral-500" />
                                        {candidatePhone}
                                    </span>
                                )}
                                {experience > 0 && (
                                    <span className="flex items-center gap-1.5 px-2.5 py-1 bg-neutral-800/60 rounded-lg text-xs tracking-wider border border-neutral-700/40">
                                        {experience} {experience === 1 ? "Year" : "Years"} Experience
                                    </span>
                                )}
                            </div>
                            {overallScore > 0 && (
                                <div className="mt-4 flex items-center gap-2">
                                    <span className="text-xs text-neutral-400">Resume Score:</span>
                                    <ScoreBadge score={overallScore} />
                                </div>
                            )}
                        </div>
                    </div>
                </div>

                {/* Body Section */}
                <div className="p-8 pb-32 space-y-8">
                    {/* Professional Summary */}
                    {professionalSummary && (
                        <div>
                            <h3 className="text-lg font-medium text-neutral-200 mb-4 px-2 border-l-2 border-indigo-500">
                                Professional Summary
                            </h3>
                            <div className="text-neutral-400 leading-relaxed text-[15px] ml-2 font-light">
                                {professionalSummary}
                            </div>
                        </div>
                    )}

                    {/* Technical Skills */}
                    {technicalSkills.length > 0 && (
                        <div>
                            <h3 className="text-lg font-medium text-neutral-200 mb-4 px-2 border-l-2 border-emerald-500 flex items-center gap-2">
                                <FiCode className="w-4 h-4" />
                                Technical Skills
                            </h3>
                            <div className="flex flex-wrap gap-2 ml-2">
                                {technicalSkills.map((skill: string) => (
                                    <span
                                        key={skill}
                                        className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-emerald-300 bg-emerald-500/10 border border-emerald-500/30 rounded-lg"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Soft Skills */}
                    {softSkills.length > 0 && (
                        <div>
                            <h3 className="text-lg font-medium text-neutral-200 mb-4 px-2 border-l-2 border-blue-500 flex items-center gap-2">
                                <FiAward className="w-4 h-4" />
                                Soft Skills
                            </h3>
                            <div className="flex flex-wrap gap-2 ml-2">
                                {softSkills.map((skill: string) => (
                                    <span
                                        key={skill}
                                        className="px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-blue-300 bg-blue-500/10 border border-blue-500/30 rounded-lg"
                                    >
                                        {skill}
                                    </span>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Work Experience */}
                    {candidate.experience && Array.isArray(candidate.experience) && candidate.experience.length > 0 && (
                        <div>
                            <h3 className="text-lg font-medium text-neutral-200 mb-4 px-2 border-l-2 border-amber-500 flex items-center gap-2">
                                <FiBriefcase className="w-4 h-4" />
                                Work Experience
                            </h3>
                            <div className="space-y-4 ml-2">
                                {candidate.experience.map((exp: any, idx: number) => (
                                    <div key={idx} className="p-4 bg-neutral-800/20 border border-neutral-700/30 rounded-lg">
                                        <div className="flex justify-between items-start mb-2">
                                            <h4 className="font-semibold text-neutral-200">{exp.job_title}</h4>
                                            {exp.start_date && (
                                                <span className="text-xs text-neutral-500">
                                                    {exp.start_date} - {exp.end_date || "Present"}
                                                </span>
                                            )}
                                        </div>
                                        {exp.company && (
                                            <p className="text-sm text-neutral-400 mb-2">{exp.company}</p>
                                        )}
                                        {Array.isArray(exp.responsibilities) && exp.responsibilities.length > 0 && (
                                            <ul className="list-disc list-inside space-y-1 text-sm text-neutral-400">
                                                {exp.responsibilities.map((resp: string, respIdx: number) => (
                                                    <li key={respIdx} className="line-clamp-2">{resp}</li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Education */}
                    {education.length > 0 && (
                        <div>
                            <h3 className="text-lg font-medium text-neutral-200 mb-4 px-2 border-l-2 border-violet-500 flex items-center gap-2">
                                <FiBook className="w-4 h-4" />
                                Education
                            </h3>
                            <div className="space-y-3 ml-2">
                                {education.map((edu: any, idx: number) => (
                                    <div key={idx} className="p-3 bg-neutral-800/20 border border-neutral-700/30 rounded-lg">
                                        <h4 className="font-semibold text-neutral-200">{edu.degree}</h4>
                                        <p className="text-sm text-neutral-400">{edu.institution}</p>
                                        {edu.graduation_year && (
                                            <p className="text-xs text-neutral-500 mt-1">Graduated: {edu.graduation_year}</p>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Projects */}
                    {projects.length > 0 && (
                        <div>
                            <h3 className="text-lg font-medium text-neutral-200 mb-4 px-2 border-l-2 border-pink-500 flex items-center gap-2">
                                <FiCode className="w-4 h-4" />
                                Projects
                            </h3>
                            <div className="space-y-4 ml-2">
                                {projects.map((project: any, idx: number) => (
                                    <div key={idx} className="p-4 bg-neutral-800/20 border border-neutral-700/30 rounded-lg">
                                        <h4 className="font-semibold text-neutral-200 mb-2">{project.name}</h4>
                                        {project.description && (
                                            <p className="text-sm text-neutral-400 mb-3">{project.description}</p>
                                        )}
                                        {Array.isArray(project.tech_stack) && project.tech_stack.length > 0 && (
                                            <div className="flex flex-wrap gap-1">
                                                {project.tech_stack.map((tech: string) => (
                                                    <span key={tech} className="text-xs px-2 py-1 bg-neutral-700/50 text-neutral-300 rounded">
                                                        {tech}
                                                    </span>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Social Links */}
                    {(github || linkedin) && (
                        <div>
                            <h3 className="text-lg font-medium text-neutral-200 mb-4 px-2 border-l-2 border-cyan-500">
                                Social Links
                            </h3>
                            <div className="flex gap-3 ml-2">
                                {github && (
                                    <a
                                        href={github}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-neutral-800/40 hover:bg-neutral-800/60 border border-neutral-700/30 rounded-lg text-neutral-300 hover:text-white transition-all text-sm font-medium"
                                    >
                                        <FaGithub className="w-4 h-4" />
                                        GitHub
                                        <FiExternalLink className="w-3 h-3 opacity-50" />
                                    </a>
                                )}
                                {linkedin && (
                                    <a
                                        href={linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-4 py-2 bg-neutral-800/40 hover:bg-neutral-800/60 border border-neutral-700/30 rounded-lg text-neutral-300 hover:text-white transition-all text-sm font-medium"
                                    >
                                        <FaLinkedin className="w-4 h-4" />
                                        LinkedIn
                                        <FiExternalLink className="w-3 h-3 opacity-50" />
                                    </a>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </GlassModal>
    );
}
