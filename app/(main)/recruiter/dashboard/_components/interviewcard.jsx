import { Button } from "@/components/ui/button";
import { ArrowRight, Copy, Send, Trash2 } from "lucide-react";
import moment from "moment";
import React, { useState } from "react";
import { toast } from "sonner";
import Link from "next/link";
import { supabase } from "@/services/supabaseClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

function InterviewCard({ interview, viewDetail = false, onDelete }) {
  const [showDeleteAlert, setShowDeleteAlert] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const copyCode = async () => {
    try {
      const code = interview?.interview_code;
      if (!code) {
        toast.error('Interview code not available');
        return;
      }
      await navigator.clipboard.writeText(code);
      toast.success("Interview code copied!");
    } catch (err) {
      toast.error("Failed to copy code");
      console.error("Failed to copy: ", err);
    }
  };

  const onSend = () => {
    const code = interview?.interview_code || 'N/A';
    const jobPosition = interview?.jobposition || 'Interview';
    const rawUrl = process.env.NEXT_PUBLIC_HOST_URL || 'http://localhost:3000';
    const baseUrl = rawUrl.replace(/\/$/, '');
    const candidatePortalUrl = `${baseUrl}/candidate/join-interview`;
    const candidateEmail = interview?.invited_candidate_email || '';

    const emailBody = `Hi,\n\nYou have been invited for an AI-powered ${jobPosition}.\n\nYour Interview Code: ${code}\n\nTo join the interview:\n1. Visit the candidate portal: ${candidatePortalUrl}\n2. Log in with your account\n3. Enter your interview code: ${code}\n\nBest regards`;

    const subject = `AI Interview Invitation - ${jobPosition}`;
    const gmailUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(candidateEmail)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(emailBody)}`;
    window.open(gmailUrl, '_blank');
    toast.success("Opening Gmail compose...");
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      // Delete interview results first (if any)
      const { error: resultsError } = await supabase
        .from('interview_results')
        .delete()
        .eq('interview_id', interview.interview_id);

      if (resultsError) {
        console.error('Error deleting interview results:', resultsError);
      }

      // Delete the interview
      const { error: interviewError } = await supabase
        .from('interviews')
        .delete()
        .eq('interview_id', interview.interview_id);

      if (interviewError) {
        throw interviewError;
      }

      toast.success("Interview deleted successfully!");
      setShowDeleteAlert(false);

      // Call the onDelete callback to refresh the list
      if (onDelete) {
        onDelete();
      }
    } catch (error) {
      console.error('Error deleting interview:', error);
      toast.error("Failed to delete interview. Please try again.");
    } finally {
      setDeleting(false);
    }
  };

  return (
    <>
      <div className="p-4 sm:p-6 bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-all duration-200 w-full dark:bg-gray-800 dark:border-gray-700">
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
          <div className="flex items-start gap-3 w-full">
            <div className="h-3 w-3 bg-blue-500 rounded-full mt-1.5 flex-shrink-0 dark:bg-blue-400" />
            <div className="flex-1 min-w-0">
              <h2 className="text-base sm:text-lg font-semibold text-gray-900 dark:text-white truncate">
                {interview?.jobposition || "Untitled Interview Position"}
              </h2>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-1">
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                  {moment(interview?.created_at).format("DD MMM YYYY")}
                </span>
                <span className="text-xs text-gray-300 dark:text-gray-500">•</span>
                <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-300">
                  {interview?.duration}
                </span>
                <span className="text-xs sm:text-sm bg-gray-100 px-2 py-0.5 rounded-full text-gray-700 dark:bg-gray-700 dark:text-gray-200">
                  {interview['interview_results']?.length || 0} candidate{interview['interview_results']?.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2 self-start sm:self-auto mt-2 sm:mt-0">
            <span className={`px-2 py-1 text-xs font-medium rounded-full whitespace-nowrap overflow-hidden text-ellipsis max-w-[120px] ${(interview['interview_results']?.length || 0) === 0
              ? "bg-amber-50 text-amber-600 dark:bg-amber-900/40 dark:text-amber-200"
              : "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-200"
              }`}>
              {(interview['interview_results']?.length || 0) === 0 ? "Awaiting Candidates" : `${interview['interview_results']?.length} Interviewed`}
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteAlert(true)}
              className="p-1 h-8 w-8 text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
            >
              <Trash2 size={16} />
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col gap-3 mt-4 sm:mt-6">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              className="flex-1 flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:border-gray-600 dark:text-gray-200 py-2 text-sm sm:text-base"
              onClick={copyCode}
            >
              <Copy size={16} className="text-gray-600 dark:text-gray-300" />
              <span>Copy Code</span>
            </Button>
            <Button
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-700 dark:hover:bg-blue-800 py-2 text-sm sm:text-base"
              onClick={onSend}
            >
              <Send size={16} className="text-white" />
              <span>Send</span>
            </Button>
          </div>

          {/* New Feedback/Results Button - Always show if result exists */}
          {(interview['interview_results']?.length || 0) > 0 && (
            <Link href={`/recruiter/scheduled-interview/${interview?.interview_id}/details`} passHref legacyBehavior>
              <Button
                as="a"
                className="w-full gap-2 bg-indigo-50 border-indigo-200 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:border-indigo-800 dark:text-indigo-300 dark:hover:bg-indigo-900/40 py-2 text-sm sm:text-base transition-colors"
                variant="outline"
              >
                View Feedback & Results
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          )}
        </div>
      </div>

      {/* Delete Alert Dialog */}
      <AlertDialog open={showDeleteAlert} onOpenChange={setShowDeleteAlert}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Interview</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete the interview for <strong>{interview?.jobposition}</strong>?
              This action cannot be undone and will permanently remove:
              <ul className="list-disc list-inside mt-2 space-y-1">
                <li>The interview link</li>
                <li>All candidate responses ({interview['interview_results']?.length || 0} candidates)</li>
                <li>All feedback and ratings</li>
              </ul>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </>
              ) : (
                "Delete Interview"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default InterviewCard;