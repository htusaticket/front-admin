"use client";

import { motion } from "framer-motion";
import { CheckCircle2, Mic, Calendar, User, Search, Filter, MessageSquare } from "lucide-react";
import { useState } from "react";
import { ReviewSubmissionModal } from "@/components/corrections/ReviewSubmissionModal";

interface Submission {
    id: number;
    studentName: string;
    challengeTitle: string;
    challengeDescription: string;
    submittedAt: string;
    status: 'Pending' | 'Reviewed';
    audioUrl?: string; 
}

// Mock Data
const MOCK_SUBMISSIONS: Submission[] = [
  {
    id: 1,
    studentName: "John Doe",
    challengeTitle: "Listen to Podcast #4",
    challengeDescription: "Listen to the daily audio and summarize the key takeaways.",
    submittedAt: "2024-02-15 10:30 AM",
    status: "Pending"
  },
  {
    id: 2,
    studentName: "Jane Smith",
    challengeTitle: "Elevator Pitch Practice",
    challengeDescription: "Record a 30-second elevator pitch for the new product.",
    submittedAt: "2024-02-15 11:15 AM",
    status: "Pending"
  },
  {
    id: 3,
    studentName: "Mike Johnson",
    challengeTitle: "Objection Handling",
    challengeDescription: "Respond to the 'It's too expensive' objection.",
    submittedAt: "2024-02-14 02:45 PM",
    status: "Reviewed"
  }
];

export default function CorrectionsPage() {
  const [activeTab, setActiveTab] = useState<'Pending' | 'Reviewed'>('Pending');
  const [submissions, setSubmissions] = useState<Submission[]>(MOCK_SUBMISSIONS);
  const [selectedSubmission, setSelectedSubmission] = useState<Submission | null>(null);
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false);

  const filteredSubmissions = submissions.filter(s => s.status === activeTab);

  const handleReviewClick = (submission: Submission) => {
      setSelectedSubmission(submission);
      setIsReviewModalOpen(true);
  };

  const handleSubmitFeedback = (id: number, feedback: string) => {
      console.log(`Submitting feedback for ${id}: ${feedback}`);
      // Update mock state
      setSubmissions(submissions.map(s => 
          s.id === id ? { ...s, status: 'Reviewed' } : s
      ));
      setIsReviewModalOpen(false);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold text-brand-primary">
            Corrections Zone
          </h1>
          <p className="mt-2 text-lg text-gray-600">
            Review and provide feedback on student submissions.
          </p>
        </div>
      </div>

      {/* Tabs & Filters */}
      <div className="flex items-center justify-between border-b border-gray-200">
          <div className="flex gap-6">
              <button 
                onClick={() => setActiveTab('Pending')}
                className={`pb-4 text-sm font-bold transition-all relative ${
                    activeTab === 'Pending' ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                  Pending Review
                  {activeTab === 'Pending' && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
                  )}
                  <span className="ml-2 bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
                      {submissions.filter(s => s.status === 'Pending').length}
                  </span>
              </button>
              <button 
                onClick={() => setActiveTab('Reviewed')}
                className={`pb-4 text-sm font-bold transition-all relative ${
                    activeTab === 'Reviewed' ? 'text-brand-primary' : 'text-gray-500 hover:text-gray-700'
                }`}
              >
                  History
                  {activeTab === 'Reviewed' && (
                      <motion.div layoutId="activeTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
                  )}
              </button>
          </div>
          
          <div className="pb-2">
              <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input 
                    type="text" 
                    placeholder="Search students..." 
                    className="pl-9 pr-4 py-2 rounded-xl border border-gray-200 text-sm outline-none focus:border-brand-primary w-64"
                  />
              </div>
          </div>
      </div>

      {/* List */}
      <div className="grid gap-4">
          {filteredSubmissions.length === 0 ? (
              <div className="text-center py-12 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
                  <CheckCircle2 className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500 font-medium">No {activeTab.toLowerCase()} submissions found.</p>
              </div>
          ) : (
              filteredSubmissions.map((submission) => (
                  <motion.div 
                    key={submission.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center justify-between bg-white p-6 rounded-2xl border border-gray-200 shadow-sm hover:shadow-md transition-all"
                  >
                      <div className="flex items-center gap-6">
                          {/* Avatar Initials */}
                          <div className="h-12 w-12 rounded-full bg-blue-50 text-blue-600 font-bold text-lg flex items-center justify-center">
                              {submission.studentName.charAt(0)}
                          </div>
                          
                          <div className="space-y-1">
                              <h3 className="font-bold text-gray-900">{submission.challengeTitle}</h3>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                  <User className="h-3.5 w-3.5" />
                                  <span>{submission.studentName}</span>
                                  <span className="text-gray-300">•</span>
                                  <Calendar className="h-3.5 w-3.5" />
                                  <span>{submission.submittedAt}</span>
                              </div>
                          </div>
                      </div>

                      <div className="flex items-center gap-4">
                           <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-50 rounded-lg border border-gray-100">
                               <Mic className="h-4 w-4 text-purple-500" />
                               <span className="text-xs font-semibold text-gray-600">Audio Submission</span>
                           </div>
                           
                           {submission.status === 'Pending' ? (
                               <button 
                                 onClick={() => handleReviewClick(submission)}
                                 className="flex items-center gap-2 px-6 py-2.5 bg-brand-primary text-white rounded-xl font-bold hover:bg-brand-primary/90 transition-all shadow-lg shadow-brand-primary/20"
                               >
                                   <MessageSquare className="h-4 w-4" />
                                   Review
                               </button>
                           ) : (
                               <span className="flex items-center gap-2 px-4 py-2 text-green-600 font-bold bg-green-50 rounded-xl border border-green-100">
                                   <CheckCircle2 className="h-4 w-4" />
                                   Reviewed
                               </span>
                           )}
                      </div>
                  </motion.div>
              ))
          )}
      </div>

      <ReviewSubmissionModal
         isOpen={isReviewModalOpen}
         onClose={() => setIsReviewModalOpen(false)}
         submission={selectedSubmission}
         onSubmitFeedback={handleSubmitFeedback}
      />
    </div>
  );
}
