"use client";
import { useUser } from "@/app/provider";
import { Button } from "@/components/ui/button";
import { supabase } from "@/services/supabaseClient";
import { Video, Loader2 } from "lucide-react";
import React, { useEffect, useState } from "react";
import InterviewCard from "../dashboard/_components/interviewcard";
import { useRouter } from "next/navigation";

function AllInterview() {
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
        .order('id', { ascending: false });

      if (error) {
        console.error("Supabase Error:", error);
        setInterviewList([]); // Set empty list on error to stop loading
        return;
      }

      console.log(Interviews);
      setInterviewList(Interviews || []);
    } catch (err) {
      console.error("Fetch Error:", err);
      setInterviewList([]);
    }
  };

  return (
    <div className="my-5">
      <h2 className="font-bold text-2xl mb-4">All Created Interviews</h2>

      {!InterviewList ? (
        <div className="flex flex-col items-center justify-center p-20 gap-3">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="text-gray-500 animate-pulse">Loading interviews...</p>
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
        <div className="grid grid-cols-2 xl:grid-cols-3 gap-5">
          {InterviewList.map((interview, index) => (
            <InterviewCard
              interview={interview}
              key={index}
              onDelete={GetInterviewList}
            />
          ))}
        </div>
      )}
    </div>
  );
}
export default AllInterview;
