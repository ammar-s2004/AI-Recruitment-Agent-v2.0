"use client";
import { useUser } from "@/app/provider";
import { Button } from "@/components/ui/button";
import { supabase } from "@/services/supabaseClient";
import { Video, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import InterviewCard from "../dashboard/_components/interviewcard";
import { useRouter } from "next/navigation";

function ScheduledInterview() {
  const router = useRouter();
  const { user } = useUser();
  const [interviewList, setinterviewList] = useState(null);

  useEffect(() => {
    user && GetInterviewList();
  }, [user]);
  const GetInterviewList = async () => {
    try {
      const result = await supabase
        .from("interviews")
        .select(`
        jobposition,
        duration,
        interview_id,
        interview_results (
          email,
          conversation_transcript,
          completed_at
        )
      `)
        .eq("useremail", user?.email)
        .order("id", { ascending: false });

      if (result.error) {
        console.error("Supabase Error:", result.error);
        setinterviewList([]);
        return;
      }

      console.log(result);
      // Filter for scheduled interviews (no results yet or explicitly scheduled)
      // I'll relax this to show everything if desired, but for now let's just fix the hang
      const filteredData = result.data?.filter(interview => (interview.interview_results?.length || 0) === 0) || [];
      setinterviewList(filteredData);
    } catch (err) {
      console.error("Fetch Error:", err);
      setinterviewList([]);
    }
  };

  return (
    <div className="mt-5" >
      <h2 className="font-bold text-2xl mb-4" >Interview List with feedback</h2>
      {!interviewList ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-gray-500 animate-pulse">Loading scheduled interviews...</p>
        </div>
      ) : interviewList.length === 0 ? (
        <div className="p-5 flex flex-col items-center gap-3 text-center text-gray-500 bg-white border rounded-xl shadow-sm">
          <Video className="text-primary h-10 w-10" />
          <h2 className="text-base">No pending interviews scheduled</h2>
          <Button
            className="cursor-pointer"
            onClick={() => router.push("/recruiter/dashboard/create-interview")}
          >
            + Create New Interview
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
          {interviewList.map((interview, index) => (
            <InterviewCard
              interview={interview}
              key={index}
              viewDetail={true}
              onDelete={GetInterviewList}
            />
          ))}
        </div>
      )}
    </div>
  )
}

export default ScheduledInterview;
