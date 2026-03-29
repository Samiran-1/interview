from pathlib import Path

path = Path('e:/Downloads/Developments/interview/hireops/frontend/components/forms/CandidateProfileForm.tsx')
text = path.read_text()
start = '  // ── Fetch existing profile on mount ───────────────────────────\n'
end = '  // ── File handling ─────────────────────────────────────────────\n'
if start not in text or end not in text:
    raise SystemExit('markers not found')
start_idx = text.index(start)
end_idx = text.index(end)
new_block = (
    '  // ── Fetch existing profile on mount ───────────────────────────\n'
    '  interface CandidateProfileApiResponse {\n'
    '    id: number;\n'
    '    email: string;\n'
    '    full_name: string;\n'
    '    technical_skills?: string[] | null;\n'
    '    soft_skills?: string[] | null;\n'
    '    experience_years?: number | null;\n'
    '    education?: {\n'
    '      education_list?: EducationItem[];\n'
    '    } | null;\n'
    '    resume_text?: string | null;\n'
    from pathlib import Path

    path = Path('e:/Downloads/Developments/interview/hireops/frontend/components/forms/CandidateProfileForm.tsx')
    text = path.read_text()
    start = '  // ── Fetch existing profile on mount ───────────────────────────\n'
    end = '  // ── File handling ─────────────────────────────────────────────\n'
    if start not in text or end not in text:
            raise SystemExit('markers not found')
    start_idx = text.index(start)
    end_idx = text.index(end)
    new_block = '''  // ── Fetch existing profile on mount ───────────────────────────
        interface CandidateProfileApiResponse {
            id: number;
            email: string;
            full_name: string;
            technical_skills?: string[] | null;
            soft_skills?: string[] | null;
            experience_years?: number | null;
            education?: {
                education_list?: EducationItem[];
            } | null;
            resume_text?: string | null;
            github?: string | null;
            linkedin?: string | null;
        }

        const fetchProfileData = useCallback(async () => {
            setIsLoading(true);
            try {
                const data = await fetchApi<CandidateProfileApiResponse>("/api/v1/candidates/me", {
                    method: "GET",
                    credentials: "include",
                });

                if (!data) return;

                if (data.full_name) {
                    setName(data.full_name);
                }
                if (data.email) {
                    setEmail(data.email);
                }
                if (data.github) {
                    setGithubUrl(data.github);
                }
                if (data.linkedin) {
                    setLinkedinUrl(data.linkedin);
                }
                if (data.technical_skills && data.technical_skills.length > 0) {
                    setSkills(data.technical_skills);
                }
                if (data.soft_skills && data.soft_skills.length > 0) {
                    setSoftSkills(data.soft_skills);
                }
                if (typeof data.experience_years === "number") {
                    setYearsOfExperience(data.experience_years);
                }
                if (data.education?.education_list && data.education.education_list.length > 0) {
                    setEducation(data.education.education_list);
                }
                if (data.resume_text) {
                    setHasExistingResume(true);
                    setResumeFilename("resume.pdf");
                }
            } catch (err: unknown) {
                print("Failed to load candidate profile", err)
            } finally:
                setIsLoading(False)
        }, []);

        useEffect(() => {
            fetchProfileData();
        }, [fetchProfileData]);

    '''
    new_text = text[:start_idx] + new_block + text[end_idx:]
    path.write_text(new_text)
