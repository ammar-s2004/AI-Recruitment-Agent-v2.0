import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ArrowLeft, Calendar, Clock, Copy, Key, Linkedin, List, Mail, Phone, Plus } from 'lucide-react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { supabase } from '@/services/supabaseClient';

const InterviewLink = ({ interview_id, formData }) => {
  const router = useRouter();
  const [interviewCode, setInterviewCode] = useState('');
  const [loading, setLoading] = useState(true);

  // Fetch the interview code from database
  useEffect(() => {
    const fetchInterviewCode = async () => {
      try {
        const { data, error } = await supabase
          .from('interviews')
          .select('interview_code')
          .eq('interview_id', interview_id)
          .single();

        if (error) {
          console.error('Error fetching interview code:', error);
          toast.error('Failed to load interview code');
          return;
        }

        if (data?.interview_code) {
          setInterviewCode(data.interview_code);
        }
      } catch (err) {
        console.error('Error:', err);
      } finally {
        setLoading(false);
      }
    };

    if (interview_id) {
      fetchInterviewCode();
    }
  }, [interview_id]);

  // Get candidate portal URL
  const rawUrl = process.env.NEXT_PUBLIC_HOST_URL || 'http://localhost:3000';
  const baseUrl = rawUrl.replace(/\/$/, '');
  const candidatePortalUrl = `${baseUrl}/candidate/join-interview`;

  const expiresAt = () => {
    const creationDate = formData?.created_at ? new Date(formData.created_at) : new Date();
    const futureDate = new Date(creationDate.getTime() + 30 * 24 * 60 * 60 * 1000);
    const options = { year: 'numeric', month: 'long', day: 'numeric' };
    return futureDate.toLocaleDateString('en-US', options);
  };

  const onCopyCode = async () => {
    if (!interviewCode) {
      toast.error('Interview code not available');
      return;
    }
    await navigator.clipboard.writeText(interviewCode);
    toast.success('Interview code copied!');
  };

  const shareVia = (platform) => {
    const interviewTitle = formData?.jobposition || 'AI Interview';
    const emailSubject = `Invitation to ${interviewTitle}`;
    const emailBody = `Dear Candidate,

I hope this message finds you well. I am pleased to invite you to participate in an AI-powered ${interviewTitle}.

Your Interview Code: ${interviewCode}

To join the interview:
1. Visit the candidate portal: ${candidatePortalUrl}
2. Log in with your account
3. Enter your interview code: ${interviewCode}

Please ensure you complete the interview before ${expiresAt()}. If you have any questions or require assistance, feel free to reach out.

Looking forward to your responses!

Best regards,
`;

    const defaultMessage = `Join my ${interviewTitle} interview with code: ${interviewCode}. Visit ${candidatePortalUrl} to get started!`;

    let shareUrl = '';

    switch (platform) {
      case 'email': {
        const candidateEmail = formData?.candidateEmail || '';
        shareUrl = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(candidateEmail)}&su=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
        window.open(shareUrl, '_blank');
        toast.success("Opening Gmail compose...");
        break;
      }
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(candidatePortalUrl)}`;
        window.open(shareUrl, '_blank', 'width=600,height=400');
        break;
      case 'whatsapp':
        shareUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(defaultMessage)}`;
        window.open(shareUrl, '_blank');
        break;
      default:
        break;
    }
  };

  if (loading) {
    return (
      <div className='flex items-center justify-center py-20'>
        <div className='animate-spin rounded-full h-12 w-12 border-b-2 border-primary'></div>
      </div>
    );
  }

  return (
    <div className='flex flex-col items-center justify-center space-y-10'>
      <div className='flex flex-col items-center'>
        <Image
          src={'/tick3.png'}
          alt='success_icon'
          width={200}
          height={300}
          className='size-[50px]'
        />
        <h2 className='font-bold text-lg mt-3'>Your AI Interview is Ready!</h2>
        <p className='mt-3 text-muted-foreground'>Share this code with candidates to start the interview process</p>
      </div>

      <div className='bg-white shadow rounded-lg p-7 w-full border-2 border-primary/20'>
        <div className='flex items-center justify-between'>
          <h2 className='font-bold flex items-center gap-2'>
            <Key className='size-5 text-primary' />
            Interview Code
          </h2>
          <h2 className='text-primary bg-blue-50 rounded-xl text-sm px-2 py-1'>Valid for 30 days</h2>
        </div>

        {/* Large Interview Code Display */}
        <div className='flex flex-col items-center py-8 bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl mt-5 border-2 border-dashed border-primary/30'>
          <p className='text-sm text-gray-600 mb-2'>Candidate Interview Code</p>
          <h1 className='text-5xl font-bold text-primary tracking-widest font-mono'>
            {interviewCode}
          </h1>
          <Button onClick={onCopyCode} className='mt-5' size='lg'>
            <Copy className='size-4 mr-2' />
            Copy Code
          </Button>
        </div>

        <div className='mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg'>
          <h3 className='font-semibold text-sm text-amber-800 mb-2'>📋 Instructions for Candidate</h3>
          <ol className='text-sm text-amber-900 space-y-1 list-decimal ml-4'>
            <li>Visit the candidate portal and log in</li>
            <li>Click "Join Interview"</li>
            <li>Enter code: <span className='font-mono font-bold'>{interviewCode}</span></li>
            <li>Complete the interview before {expiresAt()}</li>
          </ol>
        </div>

        <hr className='my-7' />

        <div className='flex items-center space-x-5'>
          <h2 className='flex items-center gap-2 text-sm text-gray-500'>
            <Clock className='size-4' />
            {formData.duration || '30 min'}
          </h2>
          <h2 className='flex items-center gap-2 text-sm text-gray-500'>
            <List className='size-4' />
            {formData?.questionlist?.interviewQuestions?.length || '10'} Questions
          </h2>
          <h2 className='flex items-center gap-2 text-sm text-gray-500'>
            <Calendar className='size-4' />
            Valid Till: {expiresAt()}
          </h2>
        </div>
      </div>

      <div className='w-full bg-white p-5 rounded-lg'>
        <h2 className='font-bold'>Share via</h2>
        <div className='grid grid-cols-3 gap-5 mt-5'>
          <Button variant='outline' onClick={() => shareVia('email')} className="flex items-center gap-2">
            <Mail className='size-4' /> Email
          </Button>
          <Button variant='outline' onClick={() => shareVia('linkedin')} className="flex items-center gap-2">
            <Linkedin className='size-4' /> LinkedIn
          </Button>
          <Button variant='outline' onClick={() => shareVia('whatsapp')} className="flex items-center gap-2">
            <Phone className='size-4' /> WhatsApp
          </Button>
        </div>
      </div>

      <div className='grid grid-cols-2 gap-5 w-full'>
        <Button
          variant='outline'
          onClick={() => router.push('/recruiter/dashboard')}
          className='flex items-center gap-2'
        >
          <ArrowLeft className='size-4' /> Back to Dashboard
        </Button>
        <Button
          onClick={() => router.push('/recruiter/dashboard/create-interview')}
          className='flex items-center gap-2'
        >
          <Plus className='size-4' /> Create New Interview
        </Button>
      </div>
    </div>
  );
};

export default InterviewLink;