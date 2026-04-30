"use client";

import { InterviewDataContext } from "@/context/InterviewDataContext";
import { Mic, Phone, Timer, Loader2Icon, Video, VideoOff, MicOff, Settings, MoreHorizontal } from "lucide-react";
import Image from "next/image";
import React, { useContext, useEffect, useState, useRef } from "react";
import Vapi from "@vapi-ai/web";
import AlertConfirmation from "./_components/AlertConfirmation";
import axios from "axios";
import { FEEDBACK_PROMPT } from "@/services/Constants";
import TimmerComponent from "./_components/TimmerComponent";
import { getVapiClient } from "@/lib/vapiconfig";
import { supabase } from "@/services/supabaseClient";
import { useParams } from "next/navigation";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import ErrorBoundary from "@/components/ErrorBoundary";

function StartInterview() {
  const { interviewInfo, setInterviewInfo } = useContext(InterviewDataContext);
  const vapi = getVapiClient();
  const [activeUser, setActiveUser] = useState(false);
  const [start, setStart] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [callStatus, setCallStatus] = useState("idle"); // idle, connecting, active, ending, feedbacking
  const conversation = useRef(null);
  const { interview_id } = useParams();

  const [subtitles, setSubtitles] = useState("");
  const [remoteVideoStream, setRemoteVideoStream] = useState(null);
  const router = useRouter();
  const [userProfile, setUserProfile] = useState({
    picture: null,
    name: interviewInfo?.candidate_name || "Candidate"
  });
  const [isGeneratingFeedback, setIsGeneratingFeedback] = useState(false);
  const [recruiterProfile, setRecruiterProfile] = useState({
    picture: null,
    name: "Recruiter"
  });
  const [localStream, setLocalStream] = useState(null);
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const hasGeneratedFeedback = useRef(false);

  // Initialize Local Webcam
  useEffect(() => {
    const enableWebcam = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: false
        });
        setLocalStream(stream);
      } catch (err) {
        console.error("Camera access denied:", err);
        toast.error("Could not access camera. Please check permissions.");
      }
    };
    enableWebcam();

    return () => {
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
    };
  }, []);

  const toggleCamera = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isCameraOn;
      });
      setIsCameraOn(!isCameraOn);
    }
  };

  // Restore interviewInfo from localStorage if missing
  useEffect(() => {
    if (!interviewInfo && typeof window !== 'undefined') {
      const stored = localStorage.getItem('interviewInfo');
      if (stored) {
        try {
          const parsed = JSON.parse(stored);
          if (parsed && parsed.interview_id === interview_id) {
            setInterviewInfo(parsed);
          } else {
            // interview_id mismatch, clear
            localStorage.removeItem('interviewInfo');
            router.replace(`/interview/${interview_id}`);
          }
        } catch {
          localStorage.removeItem('interviewInfo');
          router.replace(`/interview/${interview_id}`);
        }
      } else {
        // No info, redirect to join page
        router.replace(`/interview/${interview_id}`);
      }
    }
  }, [interviewInfo, interview_id, setInterviewInfo, router]);

  useEffect(() => {
    if (interviewInfo?.candidate_name) {
      setUserProfile(prev => ({ ...prev, name: interviewInfo.candidate_name }));
    }
  }, [interviewInfo]);

  // Fetch Recruiter Profile
  useEffect(() => {
    const fetchRecruiterData = async () => {
      const email = interviewInfo?.interviewer_email;
      if (!email) return;

      try {
        const { data, error } = await supabase
          .from('users')
          .select('fullname, picture')
          .eq('email', email)
          .single();

        if (data) {
          setRecruiterProfile({
            name: data.fullname || "Recruiter",
            picture: data.picture
          });
        }
      } catch (err) {
        console.error("Error fetching recruiter profile:", err);
      }
    };

    fetchRecruiterData();
  }, [interviewInfo?.interviewer_email]);

  const handleStartCall = () => {
    if (vapi && interviewInfo) {
      setCallStatus("connecting");
      startCall();
    } else {
      toast.error("Vapi client not ready. Please refresh.");
    }
  };

  const startCall = async () => {
    const jobPosition = interviewInfo?.jobposition || "Unknown Position";
    // Use the generated questions for this candidate
    const questionList = interviewInfo?.questionlist?.interviewQuestions?.map((question) => question?.question) || [];

    console.log("jobPosition:", jobPosition);
    console.log("questionList:", questionList);

    const assistantOptions = {
      name: "AI Recruiter",
      firstMessage: `Hi ${interviewInfo?.candidate_name}, how are you? Ready for your interview on ${interviewInfo?.jobposition}?`,
      transcriber: {
        provider: "deepgram",
        model: "nova-2",
        language: "en-US",
      },
      voice: {
        provider: "11labs",
        voiceId: process.env.NEXT_PUBLIC_VOICE_ID_MANAV || "2BsEFcU7jUhLaUwV4h7l", // Manav voice
      },
      // Note: Video support (Tavus) has been temporarily disabled
      // video: {
      //   provider: "tavus",
      //   tavus: {
      //     replicaId: process.env.NEXT_PUBLIC_TAVUS_REPLICA_ID || "your-replica-id-here",
      //   }
      // },
      model: {
        provider: "openai",
        model: "gpt-4o-mini", // Fastest (390ms) + Cheapest ($0.01/min)
        messages: [
          {
            role: "system",
            content: `
You are an AI voice assistant conducting interviews.
Your job is to ask candidates provided interview questions, assess their responses.
Begin the conversation with a friendly introduction, setting a relaxed yet professional tone. Example:
"Hey ${interviewInfo?.candidate_name}! Welcome to your ${interviewInfo?.jobposition} interview. Let's get started with a few questions!"
Ask one question at a time and wait for the candidate's response before proceeding. Keep the questions clear and concise. Below Are the questions ask one by one:
Questions: ${questionList}
If the candidate struggles, offer hints or rephrase the question without giving away the answer. Example:
"Need a hint? Think about how React tracks component updates!"
Provide brief, encouraging feedback after each answer. Example:
"Nice! That's a solid answer."
"Hmm, not quite! Want to try again?"
Keep the conversation natural and engaging—use casual phrases like "Alright, next up..." or "Let's tackle a tricky one!"
After 5-7 questions, wrap up the interview smoothly by summarizing their performance. Example:
"That was great! You handled some tough questions well. Keep sharpening your skills!"
End on a positive note:
"Thanks for chatting! Hope to see you crushing projects soon!"
Key Guidelines:
✅ Be friendly, engaging, and witty 🎤
✅ Keep responses short and natural, like a real conversation
✅ Adapt based on the candidate's confidence level
✅ Ensure the interview remains focused on React
`.trim(),
          },
        ],
      },
    };

    vapi.start(assistantOptions);
  };

  useEffect(() => {
    if (!vapi) return;
    // Set up event listeners for Vapi events
    const handleMessage = (message) => {
      if (message?.role === "assistant" && message?.content) {
        setSubtitles(message.content);
      }

      if (message && message?.conversation) {
        const filteredConversation = message.conversation.filter((msg) => msg.role !== "system") || [];
        conversation.current = filteredConversation;
      }
    };

    const handleSpeechStart = () => {
      setIsSpeaking(true);
      setActiveUser(false);
      toast('AI is speaking...');
    };

    const handleSpeechEnd = () => {
      setIsSpeaking(false);
      setActiveUser(true);
    };

    const handleTrackStarted = (track) => {
      if (track.kind === "video") {
        console.log("Video track received from Tavus");
        setRemoteVideoStream(new MediaStream([track]));
      }
    };

    const handleCallStart = () => {
      toast('Call started...');
      setStart(true);
      setCallStatus("active");
    };

    const handleCallEnd = () => {
      console.log("Call ended event received");
      if (hasGeneratedFeedback.current) {
        console.log("Feedback already generated/in-progress, skipping.");
        return;
      }
      toast('Call has ended. Generating feedback...');
      setCallStatus("feedbacking");
      setStart(false);
      setIsGeneratingFeedback(true);
      GenerateFeedback();
    };

    const handleError = (error) => {
      console.error("Vapi Error Details:", JSON.stringify(error, null, 2) || error);
      toast.error("Voice connection error. Please refresh and try again.");
      setStart(false);
      setCallStatus("idle");
    };

    vapi.on("message", handleMessage);
    vapi.on("call-start", handleCallStart);
    vapi.on("speech-start", handleSpeechStart);
    vapi.on("speech-end", handleSpeechEnd);
    vapi.on("track-started", handleTrackStarted);
    vapi.on("call-end", handleCallEnd);
    vapi.on("error", handleError);

    return () => {
      vapi.off("message", handleMessage);
      vapi.off("call-start", handleCallStart);
      vapi.off("speech-start", handleSpeechStart);
      vapi.off("speech-end", handleSpeechEnd);
      vapi.off("track-started", handleTrackStarted);
      vapi.off("call-end", handleCallEnd);
      vapi.off("error", handleError);
    };
  }, [vapi]);

  const GenerateFeedback = async () => {
    if (hasGeneratedFeedback.current) return;
    hasGeneratedFeedback.current = true;

    if (!interviewInfo) {
      toast.error("Interview data missing. Please restart the interview.");
      router.replace(`/interview/${interview_id}`);
      return;
    }

    // Use captured conversation or provide a minimal fallback
    const rawTranscript = conversation.current || [{ role: "info", content: "Transcript was not captured during this interview session." }];

    try {
      const result = await axios.post("/api/ai-feedback", {
        conversation: rawTranscript,
      });

      const rawContent = result?.data?.content || "";
      console.log("Raw AI Feedback:", rawContent);

      // Robust JSON extraction using regex
      const jsonMatch = rawContent.match(/```json\s*([\s\S]*?)\s*```/) || rawContent.match(/\{[\s\S]*\}/);
      const cleanedContent = jsonMatch ? (jsonMatch[1] || jsonMatch[0]).trim() : rawContent.trim();

      let parsedFeedback = null;
      let parseError = false;

      try {
        parsedFeedback = JSON.parse(cleanedContent);
      } catch (e) {
        console.error("JSON Parse Error. Content was:", cleanedContent);
        parseError = true;
        // Fallback: Create a basic feedback structure if parsing fails
        parsedFeedback = {
          feedback: {
            rating: { TechnicalSkills: 0, Communication: 0, ProblemSolving: 0, Experience: 0, Behavioral: 0, Thinking: 0 },
            summary: "Feedback generation encountered a formatting error. Raw transcript is available.",
            Recommendation: "Re-evaluate",
            RecommendationMessage: "The AI was unable to parse the feedback automatically. Please review the transcript manually.",
            rawContent: cleanedContent // Store raw content for manual review
          }
        };
      }

      // Fetch interviewer_id from users table using interviewer_email
      let interviewer_id = null;
      if (interviewInfo?.interviewer_email) {
        const { data: userData } = await supabase
          .from('users')
          .select('id')
          .eq('email', interviewInfo.interviewer_email)
          .single();
        if (userData) interviewer_id = userData.id;
      }

      const { error: insertError } = await supabase
        .from("interview_results")
        .insert([
          {
            fullname: interviewInfo?.candidate_name || "Unnamed Candidate",
            email: interviewInfo?.useremail || "no-email@candidate.com",
            interview_id: interview_id,
            conversation_transcript: {
              ...parsedFeedback,
              raw_transcript: rawTranscript,
            },
            recommendations: parsedFeedback?.feedback?.Recommendation || "Pending Review",
            completed_at: new Date().toISOString(),
            candidate_id: interviewInfo?.candidate_id,
            resume_url: interviewInfo?.resume_url,
            interviewer_id: interviewer_id,
            recruiter_email: interviewInfo?.interviewer_email,
            status: "completed"
          },
        ]);

      if (insertError) {
        console.error("Supabase insert error:", insertError);
        throw new Error("Insert failed");
      }

      // After saving feedback, generate new questions for the next candidate
      try {
        const aiResult = await axios.post("/api/ai-model", {
          jobposition: interviewInfo?.jobposition,
          jobdescription: interviewInfo?.jobdescription,
          duration: interviewInfo?.duration,
          type: interviewInfo?.type,
        });
        const rawContent = aiResult?.data?.content || aiResult?.data?.Content;
        let newQuestions = null;
        if (rawContent) {
          const match = rawContent.match(/```json\s*([\s\S]*?)\s*```/);
          if (match && match[1]) {
            newQuestions = JSON.parse(match[1].trim());
          }
        }
        if (newQuestions) {
          // Update the interview's questionList in Supabase
          await supabase
            .from('interviews')
            .update({ questionlist: newQuestions })
            .eq('interview_id', interview_id);
        }
      } catch (e) {
        console.error("Failed to generate or update new questions for next candidate", e);
      }

      toast.success("Feedback generated successfully!");
      // Clear localStorage to avoid stale data
      if (typeof window !== 'undefined') {
        localStorage.removeItem('interviewInfo');
      }
      router.replace("/interview/" + interviewInfo?.interview_id + "/completed");
    } catch (error) {
      console.error("Feedback generation failed:", error);
      toast.error("Failed to generate feedback");
    } finally {
      setIsGeneratingFeedback(false);
    }
  };

  const stopInterview = () => {
    vapi.stop();
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] flex flex-col">
      {/* Zoom Header */}
      <header className="bg-[#121212] px-6 py-3 flex justify-between items-center border-b border-gray-800">
        <div className="flex items-center gap-3">
          <div className="bg-red-500 w-3 h-3 rounded-full animate-pulse" />
          <h1 className="text-gray-200 font-medium text-sm md:text-base flex items-center gap-2">
            Zoom Meeting: {interviewInfo?.jobposition || "AI"} Interview
          </h1>
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 bg-[#1f1f1f] px-3 py-1.5 rounded-lg border border-gray-700">
            <Timer className="text-gray-400 w-4 h-4" />
            <span className="font-mono text-sm font-semibold text-gray-300">
              <TimmerComponent start={start} />
            </span>
          </div>
          <div className="hidden md:block bg-[#1f1f1f] px-3 py-1.5 rounded-lg border border-gray-700 text-xs text-gray-400">
            ID: {interview_id?.slice(0, 8)}...
          </div>
        </div>
      </header>

      {/* Main View Area — Side-by-side Zoom layout */}
      <main className="flex-1 relative p-4 flex items-center justify-center overflow-hidden">
        <div className="relative w-full max-w-6xl h-full max-h-[700px] flex gap-4 items-stretch">

          {/* LEFT PANEL — AI Interviewer */}
          <div className="flex-1 bg-[#121212] rounded-2xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col items-center justify-center relative min-h-[400px]">
            {/* Background gradient */}
            <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0a] via-[#0f1729] to-[#0a0a1a]" />

            {/* Speaking glow behind avatar */}
            <div className={`absolute inset-0 transition-all duration-700 ${isSpeaking ? 'opacity-100' : 'opacity-0'}`}>
              <div className="absolute inset-0 bg-blue-500/5 animate-pulse" />
            </div>

            {/* Avatar + ring container */}
            <div className="relative z-10 flex flex-col items-center gap-6">
              <div className="relative flex items-center justify-center">
                {/* Animated blue rings when speaking */}
                {isSpeaking && (
                  <>
                    <div className="absolute rounded-full border-2 border-blue-400/70 animate-ping"
                      style={{ width: '200px', height: '200px', animationDuration: '1.2s' }} />
                    <div className="absolute rounded-full border-2 border-blue-500/50 animate-ping"
                      style={{ width: '230px', height: '230px', animationDuration: '1.6s', animationDelay: '0.2s' }} />
                    <div className="absolute rounded-full border border-blue-300/30 animate-ping"
                      style={{ width: '260px', height: '260px', animationDuration: '2s', animationDelay: '0.4s' }} />
                  </>
                )}

                {/* Solid ring border — blue when speaking, gray when idle */}
                <div className={`relative rounded-full overflow-hidden transition-all duration-500 ${isSpeaking
                  ? 'ring-4 ring-blue-400 ring-offset-4 ring-offset-[#121212] shadow-[0_0_40px_rgba(59,130,246,0.5)]'
                  : 'ring-2 ring-gray-600 ring-offset-2 ring-offset-[#121212]'
                  }`}
                  style={{ width: '160px', height: '160px' }}>
                  <Image
                    src="/interviewer.png"
                    alt="AI Interviewer"
                    fill
                    className="object-cover"
                    priority
                  />
                </div>
              </div>

              {/* Name + status */}
              <div className="flex flex-col items-center gap-2">
                <h2 className="text-white font-bold text-lg tracking-wide">AI Interviewer</h2>
                {isSpeaking ? (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-500/15 rounded-full border border-blue-500/40">
                    <div className="flex gap-0.5 items-end h-4">
                      <div className="w-1 bg-blue-400 rounded-full animate-[bounce_0.5s_infinite]" style={{ height: '8px' }} />
                      <div className="w-1 bg-blue-400 rounded-full animate-[bounce_0.6s_infinite_0.1s]" style={{ height: '14px' }} />
                      <div className="w-1 bg-blue-400 rounded-full animate-[bounce_0.5s_infinite_0.2s]" style={{ height: '10px' }} />
                      <div className="w-1 bg-blue-400 rounded-full animate-[bounce_0.7s_infinite_0.3s]" style={{ height: '16px' }} />
                      <div className="w-1 bg-blue-400 rounded-full animate-[bounce_0.5s_infinite_0.4s]" style={{ height: '8px' }} />
                    </div>
                    <span className="text-xs font-semibold text-blue-300 uppercase tracking-wider">Speaking</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-800/60 rounded-full border border-gray-700/50">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                    <span className="text-xs text-gray-400 uppercase tracking-wider">Listening</span>
                  </div>
                )}
              </div>
            </div>

            {/* Subtitles at bottom of left panel */}
            <div className="absolute bottom-4 left-4 right-4 z-20">
              <div className={`p-3 rounded-xl backdrop-blur-md bg-black/60 border border-white/10 transition-all duration-300 ${subtitles ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
                <p className="text-center text-white text-sm font-medium leading-relaxed italic">{subtitles}</p>
              </div>
            </div>
          </div>

          {/* RIGHT PANEL — Candidate Webcam */}
          <div className="flex-1 bg-[#121212] rounded-2xl overflow-hidden shadow-2xl border border-gray-800 flex flex-col items-center justify-center relative min-h-[400px]">
            {localStream && isCameraOn ? (
              <video
                autoPlay
                muted
                playsInline
                ref={(el) => { if (el) el.srcObject = localStream; }}
                className="w-full h-full object-cover mirror-mode"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-[#0a0a0a] to-[#1a1a1a] gap-4">
                <div className="w-24 h-24 rounded-full bg-gray-800 flex items-center justify-center text-gray-300 font-bold text-4xl border-2 border-gray-700">
                  {userProfile.name.charAt(0).toUpperCase()}
                </div>
                <p className="text-gray-500 text-sm">{isCameraOn ? 'Connecting camera...' : 'Camera Off'}</p>
              </div>
            )}

            {/* Name label */}
            <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-lg">
              <span className="text-white text-sm font-medium">{userProfile.name} <span className="text-gray-400 text-xs">(You)</span></span>
            </div>

            {/* Mic status indicator */}
            {!isMicOn && (
              <div className="absolute top-4 right-4 bg-red-600/80 backdrop-blur-sm p-2 rounded-full">
                <MicOff className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

        </div>
      </main>


      {/* Zoom Control Bar */}
      < footer className="bg-[#121212] px-6 py-4 flex justify-between items-center border-t border-gray-800" >
        <div className="flex items-center gap-1 md:gap-4">
          <button
            onClick={() => setIsMicOn(!isMicOn)}
            className={`p-3 rounded-lg transition-all flex flex-col items-center gap-1 group w-16 ${isMicOn ? "hover:bg-[#2e2e2e] text-gray-300" : "text-red-500 hover:bg-red-500/10"}`}
          >
            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
            <span className="text-[10px] font-medium uppercase tracking-tight">{isMicOn ? "Mute" : "Unmute"}</span>
          </button>

          <button
            onClick={toggleCamera}
            className={`p-3 rounded-lg transition-all flex flex-col items-center gap-1 group w-16 ${isCameraOn ? "hover:bg-[#2e2e2e] text-gray-300" : "text-red-500 hover:bg-red-500/10"}`}
          >
            {isCameraOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
            <span className="text-[10px] font-medium uppercase tracking-tight">{isCameraOn ? "Stop Video" : "Start Video"}</span>
          </button>
        </div>

        <div className="flex items-center gap-2">
          {callStatus === "idle" ? (
            <button
              onClick={handleStartCall}
              className="px-6 py-2 rounded-lg bg-blue-600 text-white hover:bg-blue-700 shadow-lg transition-all flex items-center gap-2 font-bold text-sm"
            >
              Join Interview
            </button>
          ) : callStatus === "connecting" ? (
            <div className="flex items-center gap-2 bg-[#1f1f1f] px-6 py-2 rounded-lg border border-blue-500/50">
              <Loader2Icon className="animate-spin text-blue-500 w-4 h-4" />
              <span className="text-blue-500 font-bold text-sm">Connecting...</span>
            </div>
          ) : (
            <div className="hidden md:flex items-center gap-4">
              <button className="text-gray-400 hover:bg-[#2e2e2e] p-2 rounded-lg flex flex-col items-center gap-1 w-16">
                <Settings className="w-4 h-4" />
                <span className="text-[10px]">Security</span>
              </button>
              <button className="text-gray-400 hover:bg-[#2e2e2e] p-2 rounded-lg flex flex-col items-center gap-1 w-16">
                <MoreHorizontal className="w-4 h-4" />
                <span className="text-[10px]">More</span>
              </button>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {(callStatus === "active" || callStatus === "connecting") && (
            <AlertConfirmation stopInterview={stopInterview}>
              <button className="px-5 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 font-bold text-sm transition-all shadow-lg active:scale-95">
                End Interview
              </button>
            </AlertConfirmation>
          )}
        </div>
      </footer >

      {/* Feedback Overlay */}
      {
        isGeneratingFeedback && (
          <div className="fixed inset-0 bg-black/90 backdrop-blur-xl flex items-center justify-center z-50">
            <div className="bg-[#1a1a1a] rounded-2xl p-8 max-w-md w-full text-center border border-gray-800 shadow-2xl">
              <div className="relative w-20 h-20 mx-auto mb-6">
                <div className="absolute inset-0 rounded-full border-4 border-blue-600/20 border-t-blue-600 animate-spin" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">Analyzing Interview</h2>
              <p className="text-gray-400 mb-6">Our AI is synthesizing your conversation to generate detailed feedback. Please don't close this window.</p>
              <div className="w-full bg-gray-800 h-1.5 rounded-full overflow-hidden">
                <div className="bg-blue-600 h-full animate-[loading_2s_ease-in-out_infinite]" />
              </div>
            </div>
          </div>
        )
      }

      <style jsx>{`
        .mirror-mode {
          transform: rotateY(180deg);
        }
        @keyframes loading {
          0% { width: 0%; transform: translateX(-100%); }
          50% { width: 100%; transform: translateX(0%); }
          100% { width: 0%; transform: translateX(100%); }
        }
      `}</style>
    </div >
  );
}

export default StartInterview;