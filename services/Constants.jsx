import { BriefcaseBusinessIcon, Code2Icon, User2Icon, Component, Puzzle, Calendar, LayoutDashboard, List, Settings, WalletCards, LogOutIcon, Video } from "lucide-react";

export const SideBarOptions = [
    {
        name: 'Dashboard',
        icon: LayoutDashboard,
        path: '/recruiter/dashboard'
    },
    {
        name: 'Scheduled Interview',
        icon: Calendar,
        path: '/recruiter/scheduled-interview'
    },
    {
        name: 'All Interview',
        icon: List,
        path: '/recruiter/all-interview'
    },
    {
        name: 'Profile',
        icon: User2Icon,
        path: '/recruiter/profile'
    },
    {
        name: 'Billing',
        icon: WalletCards,
        path: '/recruiter/billing'
    },


]

export const SideBarCondidate = [
    {
        name: 'Dashboard',
        icon: LayoutDashboard,
        path: '/candidate/dashboard'
    },
    {
        name: 'Interviews',
        icon: Video,
        path: '/candidate/interviews'
    },
    {
        name: 'Profile',
        icon: User2Icon,
        path: '/candidate/profile'
    },


]

export const InterviewType = [
    {
        name: 'Technical',
        icon: Code2Icon,
    },
    {
        name: 'Behavioral',
        icon: User2Icon,
    },
    {
        name: 'Experience',
        icon: BriefcaseBusinessIcon,
    },
    {
        name: 'Problem Solving',
        icon: Puzzle,
    },
    {
        name: 'Leadership',
        icon: Component,
    },
]

export const QUESTIONS_PROMPT = `You are a senior technical interviewer conducting a rigorous, high-stakes interview. Your goal is to identify only the best candidates — be thorough, critical, and uncompromising in your standards.

Job Title: {{jobTitle}}

Job Description: {{jobDescription}}

Interview Duration: {{duration}}

Interview Type: {{type}}

📋 Your task:
- Analyze the job description to identify key responsibilities, required skills, and expected experience.
- Generate a structured list of interview questions scaled to the interview duration.
- Include: candidate self-introduction, deep technical/role-specific questions, behavioral questions, situational challenges, and salary/closing questions.
- Questions must be probing and specific — not generic. Avoid surface-level questions.
- Design questions that expose weak candidates: ask for concrete examples, specific implementations, and measurable outcomes.
- Include at least 2-3 questions that are deliberately challenging to separate strong candidates from average ones.

⚠️ Strictness Guidelines (IMPORTANT):
- Every question should require a substantive, specific answer — vague answers should be insufficient.
- Include questions that test depth of knowledge, not just familiarity.
- Probe for real-world experience: "Tell me about a time when..." should require specific projects, outcomes, and learnings.
- Do not make questions easy or leading. The interview should feel like a professional, high-bar evaluation.

🧩 Format your response in JSON format:
format: interviewQuestions=[
{
 question:'',
 type:'Candidate selfIntroduction about education background, work experience/Candidate home and working locations/worked previous and current working company/Why Should we hire you/Present salary negotiation/Technical/Behavioral/Experience/Problem Solving/Leadership'
},{
...
}]

🎯 The goal is to create a rigorous, time-optimized interview plan that only the most qualified candidates for a {{jobTitle}} role will pass.`

export const QUESTIONS_PROMPT_WITH_RESUME = `You are a senior technical interviewer conducting a rigorous, high-stakes interview. A candidate's resume has been provided. Your goal is to identify only the best candidates — be thorough, critical, and deeply analytical of their background.

Job Title: {{jobTitle}}

Job Description: {{jobDescription}}

Interview Duration: {{duration}}

Interview Type: {{type}}

📄 Resume Analysis Instructions:
- Carefully read the attached candidate resume.
- Identify their specific projects, technologies used, companies worked at, roles held, and education.
- Note any gaps, inconsistencies, or areas that need deeper probing.
- Use their actual experience as the foundation for your questions.

📋 Question Generation:
- Generate a structured list of questions scaled to the interview duration.
- Mix: 60% resume-specific questions + 40% general role/behavioral questions.
- Resume-specific questions must reference their actual experience: "I see you worked on X at Company Y — walk me through..."
- Include: self-introduction, deep technical probing based on their stack, behavioral questions tied to their experience, situational challenges, and salary/closing.
- Include at least 2-3 deliberately challenging questions that expose weak candidates.

⚠️ Strictness Guidelines (IMPORTANT):
- Do not accept vague answers — questions must demand specifics, metrics, and real outcomes.
- Probe for depth: if they listed a technology on their resume, they must be able to explain it in detail.
- Challenge claims on their resume: if they say they "led" a project, ask for team size, decisions made, obstacles overcome.
- Do not make questions easy or leading. This is a high-bar professional evaluation.

🧩 Format your response in JSON format:
format: interviewQuestions=[
{
 question:'',
 type:'Candidate selfIntroduction about education background, work experience/Candidate home and working locations/worked previous and current working company/Why Should we hire you/Present salary negotiation/Technical/Behavioral/Experience/Problem Solving/Leadership/Resume-Specific'
},{
...
}]

🎯 The goal is to create a rigorous, resume-tailored interview plan that only the most qualified candidates for a {{jobTitle}} role will pass.`

export const FEEDBACK_PROMPT = `{{conversation}}

Based on the interview transcript between the AI recruiter and the candidate above, generate a comprehensive, multi-dimensional evaluation report. This report must be extremely thorough, providing at least 500-700 words of analysis, and structured for a professional HR/Technical review.

Return the response in JSON format with the following structure:
{
    "feedback": {
        "rating": {
            "TechnicalProficiency": 0,
            "CommunicationClarity": 0,
            "ProblemSolvingDepth": 0,
            "CulturalAlignment": 0,
            "ConfidenceLevel": 0,
            "ExperienceRelevance": 0,
            "EmotionalIntelligence": 0,
            "LeadershipPotential": 0,
            "LearningAgility": 0,
            "OverallScore": 0
        },
        "executive_summary": "Provide a very detailed 2-3 paragraph overview (250+ words) of the candidate's performance, personality, and suitability for the role.",
        "detailed_metrics": {
            "Communication": "Analyze grammar, tone, pace, and clarity of thought.",
            "TechnicalDepth": "Assess the specific technical accuracy and depth of their answers.",
            "BehavioralTraits": "Identify key traits like resilience, teamwork, or initiative shown."
        },
        "strengths": [
            "Strength 1: [Observation] - [Evidence from transcript] - [Impact on role]",
            "Strength 2: [Observation] - [Evidence from transcript] - [Impact on role]",
            "Strength 3: [Observation] - [Evidence from transcript] - [Impact on role]"
        ],
        "weaknesses": [
            "Areas for Improvement 1: [Observation] - [Evidence from transcript] - [Associated Risk]",
            "Areas for Improvement 2: [Observation] - [Evidence from transcript] - [Associated Risk]"
        ],
        "interview_transcript_highlights": [
            { "question": "Key Question Asked", "candidate_answer": "Snippet of their answer", "analysis": "Why this answer was significant" }
        ],
        "training_recommendations": [
            "Specific course, skill, or project they should work on based on their gaps."
        ],
        "Recommendation": "Recommended / Not Recommended / Re-evaluate",
        "RecommendationMessage": "A final detailed verdict (4-5 sentences) providing a professional justification for this hiring decision."
    }
}

Guidelines:
1. Ratings are on a scale of 1-10. 
2. Be critical and objective; do not give perfect scores unless the performance was truly exceptional.
3. Use specific quotes or paraphrased examples from the transcript to back up every claim in the strengths/weaknesses.
4. The executive summary must feel like a professional evaluation from a senior recruiter.
5. Ensure the JSON is valid and strictly follows the schema.`