'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { toast } from 'sonner';
import { supabase } from '@/services/supabaseClient';
import { useUser } from '@/app/provider';
import { KeyRound, ArrowRight, Loader2 } from 'lucide-react';

export default function JoinInterviewWithCode() {
    const [interviewCode, setInterviewCode] = useState('');
    const [loading, setLoading] = useState(false);
    const router = useRouter();
    const { user } = useUser();

    const handleJoinInterview = async (e) => {
        e.preventDefault();

        if (!interviewCode.trim()) {
            toast.error('Please enter an interview code');
            return;
        }

        if (!user) {
            toast.error('Please log in to join an interview');
            router.push('/signin');
            return;
        }

        setLoading(true);

        try {
            // Fetch interview by code
            const { data: interviewData, error: fetchError } = await supabase
                .from('interviews')
                .select('interview_id, invited_candidate_email, jobposition, duration, type')
                .eq('interview_code', interviewCode.toUpperCase())
                .single();

            if (fetchError || !interviewData) {
                toast.error('Invalid interview code. Please check and try again.');
                setLoading(false);
                return;
            }

            // Check if there's an invited candidate email and if it matches
            if (interviewData.invited_candidate_email) {
                if (interviewData.invited_candidate_email !== user.email) {
                    toast.error('This interview is assigned to a different candidate.');
                    setLoading(false);
                    return;
                }
            }

            // Redirect to interview join page
            toast.success(`Joining ${interviewData.jobposition || 'your'} interview!`);
            router.push(`/interview/${interviewData.interview_id}`);
        } catch (error) {
            console.error('Error joining interview:', error);
            toast.error('Failed to join interview. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4">
            <Card className="w-full max-w-md p-8 space-y-6">
                <div className="flex flex-col items-center text-center space-y-2">
                    <div className="p-4 bg-primary/10 rounded-full">
                        <KeyRound className="w-12 h-12 text-primary" />
                    </div>
                    <h1 className="text-3xl font-bold">Join Interview</h1>
                    <p className="text-muted-foreground">
                        Enter the interview code provided by your recruiter
                    </p>
                </div>

                <form onSubmit={handleJoinInterview} className="space-y-4">
                    <div className="space-y-2">
                        <label htmlFor="code" className="text-sm font-medium">
                            Interview Code
                        </label>
                        <Input
                            id="code"
                            type="text"
                            placeholder="Enter 8-character code"
                            value={interviewCode}
                            onChange={(e) => setInterviewCode(e.target.value.toUpperCase())}
                            maxLength={8}
                            className="text-center text-2xl font-mono tracking-widest"
                            disabled={loading}
                            autoFocus
                        />
                        <p className="text-xs text-muted-foreground text-center">
                            Code is case-insensitive, e.g., ABC123XY
                        </p>
                    </div>

                    <Button
                        type="submit"
                        className="w-full"
                        size="lg"
                        disabled={loading || interviewCode.length !== 8}
                    >
                        {loading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Validating...
                            </>
                        ) : (
                            <>
                                Join Interview
                                <ArrowRight className="ml-2 h-4 w-4" />
                            </>
                        )}
                    </Button>
                </form>

                <div className="pt-4 border-t space-y-3">
                    <div className="text-sm text-muted-foreground space-y-2">
                        <p className="font-semibold text-gray-700">📋 Instructions:</p>
                        <ol className="list-decimal ml-5 space-y-1">
                            <li>Get your interview code from the recruiter</li>
                            <li>Enter the 8-character code above</li>
                            <li>Click "Join Interview" to start</li>
                        </ol>
                    </div>

                    <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-xs text-blue-800">
                            <strong>Note:</strong> You must be logged in with the email address that received the interview invitation.
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
}
