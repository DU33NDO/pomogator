"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import Link from "next/link";
import { Brain } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import LoadingBars from "@/components/LoadingBar";

interface Submission {
  userId: {
    _id: string;
    username: string;
    email: string;
  };
  content: string;
  submittedAt: string;
  status: "pending" | "submitted" | "graded";
}

interface Assignment {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  submissions: Submission[];
  aiMarkScheme?: string;
}

export default function SubmissionsPage() {
  const { user } = useAuth();
  const params = useParams();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [markScheme, setMarkScheme] = useState("");
  const [markSchemeFile, setMarkSchemeFile] = useState<File | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    fetchAssignmentWithSubmissions();
  }, [params.id]);

  const fetchAssignmentWithSubmissions = async () => {
    try {
      const response = await api.get(`/assignments/${params.id}/submissions`);
      setAssignment(response.data);
    } catch (error) {
      console.error("Error fetching submissions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAIAnalysis = async () => {
    setIsAnalyzing(true);
    try {
      let formData = new FormData();
      formData.append("action", "evaluate");

      if (markSchemeFile) {
        formData.append("file", markSchemeFile);
      }
      if (markScheme) {
        formData.append("text", markScheme);
      }

      const aiResponse = await api.post("/api/ai", formData);

      await api.post(`/assignments/${params.id}/ai-feedback`, {
        aiMarkScheme: aiResponse.data.evaluation,
      });

      await fetchAssignmentWithSubmissions();

      setIsAIModalOpen(false);
      setMarkScheme("");
      setMarkSchemeFile(null);
    } catch (error) {
      console.error("AI Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  if (loading) {
    return <LoadingBars />;
  }

  if (user?.role !== "TEACHER") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Only teachers can view submissions.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 relative">
      <div className="fixed left-8 top-24">
        <Button
          className="bg-purple-600 hover:bg-purple-700 text-white flex items-center gap-2"
          size="lg"
          onClick={() => setIsAIModalOpen(true)}
        >
          <Brain className="w-5 h-5" />
          AI Analyze
        </Button>
      </div>

      <div className="container mx-auto px-4 max-w-4xl">
        <div className="mb-8">
          <h1 className="text-2xl font-bold mb-2">{assignment?.title}</h1>

          <p className="text-gray-600">
            Total Submissions: {assignment?.submissions.length || 0}
          </p>
        </div>

        <div className="grid gap-4">
          {assignment?.submissions.map((submission) => (
            <div
              key={submission.userId._id}
              className="bg-white rounded-lg shadow-md p-6 flex items-center justify-between"
            >
              <div className="space-y-1">
                <h3 className="font-semibold">{submission.userId.username}</h3>
                <p className="text-sm text-gray-500">
                  {submission.userId.email}
                </p>
                <p className="text-sm text-gray-500">
                  Submitted: {new Date(submission.submittedAt).toLocaleString()}
                </p>
                <span
                  className={`inline-block px-2 py-1 text-xs rounded ${
                    submission.status === "graded"
                      ? "bg-green-100 text-green-800"
                      : submission.status === "submitted"
                      ? "bg-blue-100 text-blue-800"
                      : "bg-yellow-100 text-yellow-800"
                  }`}
                >
                  {(submission.status || "unknown").charAt(0).toUpperCase() +
                    (submission.status || "unknown").slice(1)}
                </span>
              </div>

              <Link
                href={`/assignments/${params.id}/submissions/${submission.userId._id}`}
              >
                <Button variant="outline" className="hover:bg-gray-100">
                  View Submission
                </Button>
              </Link>
            </div>
          ))}

          {(!assignment?.submissions ||
            assignment.submissions.length === 0) && (
            <div className="text-center py-8 bg-white rounded-lg shadow-md">
              <p className="text-gray-500">No submissions yet.</p>
            </div>
          )}
        </div>
      </div>

      <Dialog open={isAIModalOpen} onOpenChange={setIsAIModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>AI Analysis Setup</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mark Scheme Text
              </label>
              <Textarea
                value={markScheme}
                onChange={(e) => setMarkScheme(e.target.value)}
                placeholder="Enter mark scheme or grading criteria..."
                className="min-h-[100px]"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Or Upload Mark Scheme File
              </label>
              <input
                type="file"
                onChange={(e) => setMarkSchemeFile(e.target.files?.[0] || null)}
                className="w-full"
                accept=".pdf,.doc,.docx,.txt"
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setIsAIModalOpen(false)}>
                Cancel
              </Button>
              <Button
                onClick={handleAIAnalysis}
                disabled={isAnalyzing || (!markScheme && !markSchemeFile)}
              >
                {isAnalyzing ? "Analyzing..." : "Start Analysis"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
