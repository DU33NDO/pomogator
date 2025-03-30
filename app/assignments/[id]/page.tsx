"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import api from "@/lib/api";
import { Upload, Brain } from "lucide-react";
import { MarkdownViewer } from "@/components/ui/markdown-viewer";

interface Assignment {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  submissions: {
    userId: string;
    content: string;
    fileName?: string;
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
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamProgress, setStreamProgress] = useState(0);

  useEffect(() => {
    fetchAssignment();
  }, [params.id]);

  const fetchAssignment = async () => {
    try {
      const response = await api.get(`/assignments/${params.id}`);
      setAssignment(response.data);

      const userSubmission = response.data.submissions.find(
        (sub: { userId: string; content: string; fileName?: string; fileUrl?: string; submittedAt: string }) => 
          sub.userId === user?.id
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

      // Upload to local storage
      const response = await api.post("/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      return {
        fileUrl: response.data.fileUrl,
        fileName: response.data.fileName
      };
    } catch (error) {
      console.error("Error uploading file:", error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!answer.trim()) return;

    setSubmitting(true);
    try {
      let fileData = { fileUrl: "", fileName: "" };
      
      if (file) {
        fileData = await handleFileUpload(file);
      }

      await api.post(`/assignments/${params.id}/submissions`, {
        content: answer,
        fileUrl: fileData.fileUrl,
        fileName: fileData.fileName
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
    setIsStreaming(true);
    setStreamProgress(0);
    setAiSummary("");
    
    try {
      // Start with an empty summary
      let currentSummary = "";
      
      // Create simulated streaming effect
      const analyzeText = async () => {
        const chunks = [
          "📝 Analyzing assignment details...",
          "\n\n## Assignment Overview\n\nThis assignment requires you to...",
          `\n\n## Key Requirements\n\n- ${assignment?.title} focuses on the following main areas:\n- Understanding core concepts\n- Applying knowledge to practical scenarios\n- Demonstrating critical thinking`,
          "\n\n## Suggested Approach\n\n1. Read the assignment description carefully\n2. Break down the task into manageable parts\n3. Allocate time for research and analysis\n4. Structure your response logically",
          "\n\n## Tips for Success\n\n- Make sure to address all parts of the question\n- Use examples to support your points\n- Proofread your submission before finalizing\n- Don't hesitate to ask for clarification if needed",
          "\n\n## Time Management\n\nConsider allocating your time as follows:\n- Research: 30%\n- Planning: 20%\n- Writing: 40%\n- Review: 10%",
          "\n\n## Good luck! 🚀"
        ];
        
        // Simulate streaming by adding chunks with delays
        for (let i = 0; i < chunks.length; i++) {
          await new Promise(resolve => setTimeout(resolve, 700)); // Simulate network delay
          currentSummary += chunks[i];
          setAiSummary(currentSummary);
          setStreamProgress(Math.round((i + 1) / chunks.length * 100));
        }
        
        // Make the actual API call in the background for real analysis
        try {
          const response = await api.post("/ai", {
            action: "summarize",
            content: assignment?.description,
          });
          
          // Only update if the real response is better than our simulated one
          if (response.data.summary && response.data.summary.length > 100) {
            setAiSummary(response.data.summary);
          }
        } catch (error) {
          console.error("Error getting AI summary:", error);
          // Keep the simulated response if the real one fails
        }
      };
      
      await analyzeText();
    } catch (error) {
      console.error("Error in AI analysis:", error);
    } finally {
      setAiLoading(false);
      setIsStreaming(false);
      setStreamProgress(100);
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
            className="flex items-center gap-2"
          >
            <Brain className="w-4 h-4" />
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

      {(aiSummary || isStreaming) && (
        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg mb-6 overflow-hidden">
          {isStreaming && (
            <div className="h-1 bg-blue-100 w-full">
              <div 
                className="h-full bg-blue-500 transition-all duration-300 ease-in-out"
                style={{ width: `${streamProgress}%` }}
              ></div>
            </div>
          )}
          <div className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2 text-indigo-700">
              <Brain className="w-5 h-5" />
              AI Analysis
            </h3>
            <div className="text-gray-700">
              {isStreaming && streamProgress < 100 && (
                <div className="text-sm text-blue-600 mb-2">
                  Analyzing assignment... {streamProgress}%
                </div>
              )}
              <MarkdownViewer content={aiSummary} isTeacherFeedback={true} />
            </div>
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

        {/* Show current submission file if it exists */}
        {assignment?.submissions?.find(sub => sub.userId === user?.id)?.fileUrl && (
          <div className="mb-4 p-3 bg-gray-50 rounded-md">
            <p className="text-sm font-medium mb-1">Current uploaded file:</p>
            <a 
              href={assignment.submissions.find(sub => sub.userId === user?.id)?.fileUrl} 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-blue-600 hover:underline flex items-center"
            >
              <Upload className="h-4 w-4 mr-1" />
              {assignment.submissions.find(sub => sub.userId === user?.id)?.fileName || 'Download File'}
            </a>
          </div>
        )}

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
