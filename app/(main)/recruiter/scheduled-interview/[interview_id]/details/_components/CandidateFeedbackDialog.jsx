import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/services/supabaseClient";
import { toast } from "sonner";
import { Download, Check, Shield, Printer } from "lucide-react";
import Image from "next/image";

function CandidateFeedbackDialog({ candidate }) {
  const [downloadingCV, setDownloadingCV] = useState(false);
  const [cvAvailable, setCvAvailable] = useState(false);
  const [cvFilePath, setCvFilePath] = useState(null);
  const [candidatePicture, setCandidatePicture] = useState(null);

  const feedback = candidate?.conversation_transcript?.feedback || {};
  const executiveSummary = feedback?.executive_summary || feedback?.summary || feedback?.summery || "";
  const detailedMetrics = feedback?.detailed_metrics || {};
  const transcriptHighlights = feedback?.interview_transcript_highlights || [];
  const trainingRecommendations = feedback?.training_recommendations || feedback?.improvement_plan || feedback?.improvementPlan || [];

  const rating = feedback?.rating || {
    TechnicalProficiency: 0,
    CommunicationClarity: 0,
    ProblemSolvingDepth: 0,
    CulturalAlignment: 0,
    ConfidenceLevel: 0,
    OverallScore: 0
  };

  const strengths = feedback?.strengths || [];
  const weaknesses = feedback?.weaknesses || [];

  const summaryArray = Array.isArray(executiveSummary)
    ? executiveSummary
    : typeof executiveSummary === "string"
      ? executiveSummary.split("\n").filter((line) => line.trim())
      : [];

  const ratings = Object.values(rating).filter((val) => typeof val === "number");
  const overallScore = rating?.OverallScore || (ratings.length > 0 ? Math.round(ratings.reduce((a, b) => a + b, 0) / ratings.length) : 0);

  const isRecommended =
    feedback?.Recommendation?.toLowerCase() === "recommended";
  const isRejected = feedback?.Recommendation?.toLowerCase() === "not recommended";

  const getQualitativeFeedback = (score) => {
    if (score >= 8) return "Good";
    if (score >= 5) return "Needs Improvement";
    return "Bad";
  };

  // Fetch candidate's CV information
  const fetchCandidateCV = async () => {
    // 1. Check if candidate has a portal-uploaded CV (users table)
    if (candidate?.email) {
      try {
        const { data: userData } = await supabase
          .from('users')
          .select('cv_file_path, picture')
          .eq('email', candidate.email)
          .single();

        if (userData?.cv_file_path) {
          setCvFilePath(userData.cv_file_path);
          setCvAvailable(true);
          if (userData.picture) setCandidatePicture(userData.picture);
          return; // Priority given to portal upload
        }

        if (userData?.picture) setCandidatePicture(userData.picture);
      } catch (err) {
        console.error("Error fetching user data:", err);
      }
    }

    // 2. Fallback to existing resume_url if available
    if (candidate?.resume_url) {
      setCvFilePath(candidate.resume_url);
      setCvAvailable(true);
      return;
    }
  };

  // Function to download CV
  const downloadCV = async () => {
    if (!cvFilePath) {
      toast.error('CV not available');
      return;
    }

    setDownloadingCV(true);
    try {
      // Ensure we have a clean relative path
      // Remove any full URL prefix if present (e.g. https://xyz.supabase.co/storage/v1/object/public/cv-uploads/)
      const cleanPath = cvFilePath.includes('cv-uploads/')
        ? cvFilePath.split('cv-uploads/')[1]
        : cvFilePath;

      console.log("Attempting download with path:", cleanPath);

      const { data, error } = await supabase.storage
        .from('cv-uploads')
        .download(cleanPath);

      if (error) {
        console.error('Supabase storage download error:', error);
        throw error;
      }

      // Create a blob URL and trigger download
      const blob = new Blob([data], { type: 'application/pdf' });
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${candidate?.fullname?.replace(/\s+/g, '_') || 'candidate'}_CV.pdf`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success('CV downloaded successfully!');
    } catch (error) {
      console.error('Error downloading CV:', error);
      toast.error('Failed to download CV. Please check console for details.');
    } finally {
      setDownloadingCV(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  // Fetch CV info when dialog opens
  React.useEffect(() => {
    if (candidate?.email) {
      fetchCandidateCV();
    }
  }, [candidate?.email]);

  const emailTemplates = {
    selected: `Subject: Congratulations! You've been selected for further evaluation

Dear ${candidate?.fullname || "Candidate"},

We're pleased to inform you that based on your recent interview performance, you've been selected to move forward in our hiring process for the ${candidate?.jobposition || "the position"} role.

Your performance in the key areas is summarized below:
${Object.entries(rating)
        .map(
          ([skill, score]) =>
            `- ${skill.replace(/([A-Z])/g, " $1").trim()}: ${getQualitativeFeedback(score)}`
        )
        .join("\n")}

Our team will be in touch shortly to schedule the next phase. In the meantime, feel free to reply to this email with any questions.

Congratulations again!

Best regards,
${candidate?.fullname || "Candidate"}
${candidate?.email || "No Email"}`,

    rejected: `Subject: Update on Your Application for ${candidate?.jobposition || "the position"}

Dear ${candidate?.fullname || "Candidate"},

Thank you for taking the time to interview with us for the ${candidate?.jobposition || "the position"} position. We appreciate the effort you put into the process.

Your performance in the key areas is summarized below:
${Object.entries(rating)
        .map(
          ([skill, score]) =>
            `- ${skill.replace(/([A-Z])/g, " $1").trim()}: ${getQualitativeFeedback(score)}`
        )
        .join("\n")}

After careful consideration, we've decided to move forward with other candidates whose skills and experience more closely match our current needs.

We wish you the best in your job search and professional endeavors.

Best regards,
${candidate?.fullname || "Candidate"}
${candidate?.email || "No Email"}`,

    reevaluate: `Subject: Request for Additional Evaluation for ${candidate?.jobposition || "the position"}

Dear ${candidate?.fullname || "Candidate"},

Thank you for your recent interview for the ${candidate?.jobposition || "the position"} role. While we found several strengths in your application, we'd like to gather some additional information before making a final decision.

Your performance in the key areas is summarized below:
${Object.entries(rating)
        .map(
          ([skill, score]) =>
            `- ${skill.replace(/([A-Z])/g, " $1").trim()}: ${getQualitativeFeedback(score)}`
        )
        .join("\n")}

Would you be available for a conversation at your earliest convenience? Please reply with your availability or any questions you might have.

We appreciate your time and interest, and we look forward to continuing the conversation.

Best regards,
${candidate?.fullname || "Candidate"}
${candidate?.email || "No Email"}`,
  };

  const handleEmailAction = (templateType) => {
    const email = candidate?.email || "";
    const subject = emailTemplates[templateType].split("\n")[0].replace("Subject: ", "");
    const body = emailTemplates[templateType].split("\n").slice(1).join("\n");

    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    window.open(gmailUrl, '_blank');
    toast.success("Opening Gmail compose...");
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" className="text-primary hover:bg-primary/10">
          View Report
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Comprehensive Evaluation Report</DialogTitle>
          <DialogDescription asChild>
            <div className="mt-5 space-y-4">
              {/* Candidate Header */}
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-4">
                  {candidatePicture ? (
                    <Image
                      src={candidatePicture}
                      alt={candidate?.fullname || "Candidate"}
                      width={40}
                      height={40}
                      className="rounded-full"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center">
                      <h2 className="text-white font-bold">
                        {candidate?.fullname?.[0]?.toUpperCase() || "?"}
                      </h2>
                    </div>
                  )}
                  <div>
                    <h2 className="font-bold">{candidate?.fullname || "No Name"}</h2>
                    <h2 className="text-gray-500 text-sm">
                      {candidate?.email || "No Email"}
                    </h2>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <h2 className="text-primary text-2xl font-bold">
                    {overallScore}/10
                  </h2>
                  <Button
                    onClick={handlePrint}
                    variant="outline"
                    size="sm"
                    className="flex items-center gap-2 text-gray-600 border-gray-300 hover:bg-gray-50 print:hidden"
                  >
                    <Printer className="w-4 h-4" />
                    Print
                  </Button>
                  {cvAvailable && (
                    <Button
                      onClick={downloadCV}
                      disabled={downloadingCV}
                      variant="outline"
                      size="sm"
                      className="flex items-center gap-2 text-green-600 border-green-600 hover:bg-green-50 print:hidden"
                    >
                      <Download className="w-4 h-4" />
                      {downloadingCV ? 'Downloading...' : 'Download CV'}
                    </Button>
                  )}
                </div>
              </div>

              {/* Skills Assessment */}
              <div>
                <h2 className="font-bold">Skills Assessment</h2>
                <div className="mt-2 grid grid-cols-2 gap-x-10 gap-y-4">
                  {Object.entries(rating).map(([skill, score]) => (
                    <div key={skill}>
                      <div className="flex justify-between text-sm mb-1">
                        {skill.replace(/([A-Z])/g, " $1").trim()}{" "}
                        <span>{score}/10</span>
                      </div>
                      <Progress
                        value={score * 10}
                        className="h-2 mt-1 [&>div]:bg-primary"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Performance Summary */}
              <div className="mt-6">
                <h2 className="font-bold flex items-center gap-2 text-lg">
                  <span className="w-1.5 h-5 bg-primary rounded-full" />
                  Executive Summary
                </h2>
                <div className="p-6 bg-slate-50 border border-slate-200 my-3 rounded-xl text-gray-700 leading-relaxed shadow-sm">
                  {executiveSummary ? (
                    <div className="whitespace-pre-wrap">{executiveSummary}</div>
                  ) : (
                    <p className="text-gray-500 italic">No executive summary available</p>
                  )}
                </div>
              </div>

              {/* Detailed Qualitative Metrics */}
              {Object.keys(detailedMetrics).length > 0 && (
                <div className="mt-6 bg-indigo-50/50 p-6 rounded-xl border border-indigo-100">
                  <h2 className="font-bold text-lg text-indigo-900 mb-4">Deep Insights</h2>
                  <div className="space-y-4">
                    {Object.entries(detailedMetrics).map(([key, val]) => (
                      <div key={key}>
                        <span className="font-semibold text-indigo-700 capitalize">{key}: </span>
                        <span className="text-indigo-800/90">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Detailed Insights - Strengths & Weaknesses */}
              {(strengths.length > 0 || weaknesses.length > 0) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="p-4 bg-green-50 border border-green-100 rounded-xl">
                    <h3 className="font-bold text-green-800 mb-3 flex items-center gap-2">
                      <Check className="w-4 h-4" /> Key Strengths
                    </h3>
                    <ul className="space-y-2">
                      {strengths.map((str, i) => (
                        <li key={i} className="text-sm text-green-700 flex gap-2">
                          <span className="mt-1.5 w-1 h-1 bg-green-400 rounded-full flex-shrink-0" />
                          {str}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div className="p-4 bg-red-50 border border-red-100 rounded-xl">
                    <h3 className="font-bold text-red-800 mb-3 flex items-center gap-2">
                      <Shield className="w-4 h-4" /> Areas for Improvement
                    </h3>
                    <ul className="space-y-2">
                      {weaknesses.map((weak, i) => (
                        <li key={i} className="text-sm text-red-700 flex gap-2">
                          <span className="mt-1.5 w-1 h-1 bg-red-400 rounded-full flex-shrink-0" />
                          {weak}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}

              {/* Actionable Improvement Plan */}
              {trainingRecommendations.length > 0 && (
                <div className="mt-6">
                  <h2 className="font-bold flex items-center gap-2 text-lg">
                    <span className="w-1.5 h-4 bg-blue-500 rounded-full" />
                    Growth & Training Plan
                  </h2>
                  <div className="mt-3 space-y-3">
                    {trainingRecommendations.map((step, i) => (
                      <div key={i} className="p-4 bg-blue-50 border border-blue-100 rounded-lg text-sm text-blue-800 flex gap-4 items-start">
                        <div className="w-6 h-6 bg-blue-100 rounded-full flex items-center justify-center font-bold text-blue-600 flex-shrink-0 mt-0.5">
                          {i + 1}
                        </div>
                        <p className="leading-relaxed">{step}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Transcript Highlights */}
              {transcriptHighlights.length > 0 && (
                <div className="mt-8">
                  <h2 className="font-bold flex items-center gap-2 text-lg">
                    <span className="w-1.5 h-4 bg-amber-500 rounded-full" />
                    Transcript Highlights
                  </h2>
                  <div className="mt-4 space-y-4">
                    {transcriptHighlights.map((hl, i) => (
                      <div key={i} className="p-4 bg-white border border-gray-100 rounded-xl shadow-sm space-y-2">
                        <div className="text-xs font-bold text-gray-400 uppercase tracking-wider">Q: {hl.question}</div>
                        <div className="text-sm font-medium text-gray-700 italic border-l-4 border-amber-200 pl-3">"{hl.candidate_answer}"</div>
                        <div className="text-xs text-indigo-600 bg-indigo-50 p-2 rounded-lg font-medium">Analysis: {hl.analysis}</div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Recommendation Section */}
              <div
                className={`p-6 rounded-xl mt-8 shadow-sm ${isRecommended
                  ? "bg-green-50 border border-green-200"
                  : isRejected ? "bg-red-50 border-red-200 border" : "bg-amber-50 border-amber-200 border"
                  }`}
              >
                <div className="flex flex-col gap-6">
                  <div>
                    <h2
                      className={`font-bold text-xl ${isRecommended ? "text-green-700" : isRejected ? "text-red-700" : "text-amber-700"
                        }`}
                    >
                      Final Verdict: {feedback?.Recommendation || "Pending"}
                    </h2>
                    <p className="mt-3 whitespace-pre-wrap text-gray-700 leading-relaxed font-medium">
                      {feedback?.RecommendationMessage || "Awaiting final analysis justification..."}
                    </p>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Button
                      onClick={() => handleEmailAction("selected")}
                      variant="outline"
                      className="w-full text-green-600 border-green-600 hover:bg-green-50 font-semibold"
                    >
                      Offer / Next Step
                    </Button>
                    <Button
                      onClick={() => handleEmailAction("rejected")}
                      variant="outline"
                      className="w-full text-red-600 border-red-600 hover:bg-red-50 font-semibold"
                    >
                      Reject
                    </Button>
                    <Button
                      onClick={() => handleEmailAction("reevaluate")}
                      variant="outline"
                      className="w-full text-amber-600 border-amber-600 hover:bg-amber-50 font-semibold"
                    >
                      Re-Evaluate
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}

export default CandidateFeedbackDialog;
