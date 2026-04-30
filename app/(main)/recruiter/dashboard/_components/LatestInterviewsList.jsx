"use client";
import { Video, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { useRouter } from "next/navigation";
import { supabase } from "@/services/supabaseClient";
import { useUser } from "@/app/provider";
import InterviewCard from "./interviewcard";
import { toast } from "sonner";

function LatestInterviewsList() {
  const router = useRouter();

  const [InterviewList, setInterviewList] = useState(null);
  const { user } = useUser();

  useEffect(() => {
    user && GetInterviewList();
  }, [user]);

  const GetInterviewList = async () => {
    try {
      let { data: Interviews, error } = await supabase
        .from("interviews")
        .select("*, interview_results(*)")
        .eq("useremail", user?.email)
        .order('id', { ascending: false })
        .limit(6);

      if (error) {
        console.error("Supabase Error:", error);
        setInterviewList([]);
        return;
      }

      console.log(Interviews);
      setInterviewList(Interviews || []);
    } catch (err) {
      console.error("Fetch Error:", err);
      setInterviewList([]);
    }
  };

  const handleInterviewDelete = () => {
    // Refresh the interview list after deletion
    GetInterviewList();
  };

  return (
    <div className="my-5">
      <h2 className="font-bold text-2xl mb-4">Previously Created Interviews</h2>

      {!InterviewList ? (
        <div className="flex flex-col items-center justify-center p-10 gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-gray-500 text-sm animate-pulse">Loading recent interviews...</p>
        </div>
      ) : InterviewList.length === 0 ? (
        <div className="p-5 flex flex-col items-center gap-3 text-center text-gray-500 bg-white border rounded-xl shadow-sm">
          <Video className="text-primary h-10 w-10" />
          <h2 className="text-base">You don't have any interview created</h2>
          <Button
            className="cursor-pointer"
            onClick={() => router.push("/recruiter/dashboard/create-interview")}
          >
            + Create New Interview
          </Button>
        </div>
      ) : (
        InterviewList &&
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
          {InterviewList.map((interview, index) => (
            <InterviewCard
              interview={interview}
              key={index}
              onDelete={handleInterviewDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}

export default LatestInterviewsList;