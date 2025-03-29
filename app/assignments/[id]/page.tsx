"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { Upload } from "lucide-react";

interface Assignment {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  submissions: {
    userId: string;
    content: string;
    fileUrl?: string;
    submittedAt: string;
  }[];
}

export default function AssignmentPage() {
  const { user } = useAuth();
  const params = useParams();
  const [assignment, setAssignment] = useState<Assignment | null>(null);
  const [answer, setAnswer] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [aiSummary, setAiSummary] = useState("");

  useEffect(() => {
    fetchAssignment();
  }, [params.id]);

  const fetchAssignment = async () => {
    try {
      const response = await api.get(`/assignments/${params.id}`);
      setAssignment(response.data);

      const userSubmission = response.data.submissions.find(
        (sub: any) => sub.userId === user?.id
      );
      if (userSubmission) {
        setAnswer(userSubmission.content || "");
      }
    } catch (error) {
      console.error("Error fetching assignment:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileUpload = async (file: File) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      // Upload to Google Cloud Storage
      const response = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return response.data.fileUrl;
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;

    setSubmitting(true);
    try {
      let fileUrl = "";
      if (file) {
        fileUrl = await handleFileUpload(file);
      }

      await api.post(`/assignments/${params.id}/submissions`, {
        content: answer,
        fileUrl,
      });

      await fetchAssignment();
    } catch (error) {
      console.error("Error submitting assignment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleAiAnalysis = async () => {
    setAiLoading(true);
    try {
      const response = await api.post("/ai", {
        action: "summarize",
        content: assignment?.description,
      });
      setAiSummary(response.data.summary);
    } catch (error) {
      console.error("Error getting AI summary:", error);
    } finally {
      setAiLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading assignment...</p>
      </div>
    );
  }

  if (user?.role !== "STUDENT") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">
          Only students can view and submit assignments.
        </p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-start mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{assignment?.title}</h1>
          <p className="text-gray-600">
            Due: {new Date(assignment?.deadline || "").toLocaleString()}
          </p>
        </div>

        <div className="flex space-x-4">
          <Button
            onClick={handleAiAnalysis}
            variant="outline"
            disabled={aiLoading}
          >
            {aiLoading ? "Analyzing..." : "AI Analysis"}
          </Button>

          <Button
            onClick={handleSubmit}
            disabled={submitting || !answer.trim()}
          >
            {submitting ? "Submitting..." : "Submit Assignment"}
          </Button>
        </div>
      </div>

      {aiSummary && (
        <div className="bg-blue-50 p-4 rounded-lg mb-6">
          <h3 className="font-semibold mb-2">AI Analysis:</h3>
          <div className="text-sm text-gray-700 whitespace-pre-wrap">
            {aiSummary}
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Assignment Description</h2>
        <p className="text-gray-700 whitespace-pre-wrap">
          {assignment?.description}
        </p>
      </div>

      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold mb-4">Your Answer</h2>

        <Textarea
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          placeholder="Write your answer here..."
          className="min-h-[200px] mb-4"
        />

        <div className="flex items-center space-x-4">
          <input
            type="file"
            id="file-upload"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <label
            htmlFor="file-upload"
            className="flex items-center space-x-2 px-4 py-2 border rounded-lg cursor-pointer hover:bg-gray-50"
          >
            <Upload className="h-5 w-5" />
            <span>{file ? file.name : "Upload File"}</span>
          </label>
          {file && (
            <button
              onClick={() => setFile(null)}
              className="text-red-500 text-sm hover:text-red-700"
            >
              Remove
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
