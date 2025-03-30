"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";

interface Submission {
  content: string;
  fileUrl?: string;
  fileName?: string;
  submittedAt: string;
  feedback?: string;
  userId: {
    username: string;
    email: string;
  };
}

interface Assignment {
  _id: string;
  title: string;
  aiMarkScheme?: string;
}

export default function SubmissionPage() {
  const { user } = useAuth();
  const params = useParams();
  const [submission, setSubmission] = useState<Submission | null>(null);
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [editedFeedback, setEditedFeedback] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchData();
  }, [params.id, params.userId]);

  const fetchData = async () => {
    try {
      // Fetch both assignment and submission data
      const [assignmentRes, submissionRes] = await Promise.all([
        api.get(`/assignments/${params.id}`),
        api.get(`/assignments/${params.id}/submissions/${params.userId}`),
      ]);

      setAssignment(assignmentRes.data);
      setSubmission(submissionRes.data);
      setEditedFeedback(submissionRes.data.feedback || "");
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFeedback = async () => {
    setSaving(true);
    try {
      await api.post(
        `/assignments/${params.id}/submissions/${params.userId}/feedback`,
        {
          feedback: editedFeedback,
        }
      );
      await fetchData(); // Refresh data
    } catch (error) {
      console.error("Error saving feedback:", error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading submission...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      <div className="grid grid-cols-2 gap-6">
        {/* Student's Submission */}
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">
              Submission by {submission?.userId.username}
            </h2>
            <p className="text-sm text-gray-500 mb-4">
              Submitted on:{" "}
              {new Date(submission?.submittedAt || "").toLocaleString()}
            </p>
          </div>

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold mb-4">Student's Answer</h3>
            <div className="whitespace-pre-wrap text-gray-700">
              {submission?.content}
            </div>

            {submission?.fileUrl && (
              <div className="mt-4">
                <a
                  href={submission.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:underline"
                >
                  Download: {submission.fileName}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* AI Feedback and Teacher's Edit */}
        <div className="space-y-6">
          {assignment?.aiMarkScheme && (
            <div className="bg-white rounded-lg shadow-md p-6">
              <h3 className="font-semibold mb-4">AI Mark Scheme</h3>
              <div className="text-gray-700 mb-6 whitespace-pre-wrap">
                {assignment.aiMarkScheme}
              </div>
            </div>
          )}

          <div className="bg-white rounded-lg shadow-md p-6">
            <h3 className="font-semibold mb-4">Teacher's Feedback</h3>
            <Textarea
              value={editedFeedback}
              onChange={(e) => setEditedFeedback(e.target.value)}
              className="min-h-[200px] mb-4"
              placeholder="Add your feedback here..."
            />

            <Button
              onClick={handleSaveFeedback}
              disabled={saving}
              className="w-full"
            >
              {saving ? "Saving..." : "Save Feedback"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
