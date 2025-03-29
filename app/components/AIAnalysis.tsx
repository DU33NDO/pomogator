"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import axios from "axios";

export default function AIAnalysis() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>("");
  const [text, setText] = useState("");
  const [descriptor, setDescriptor] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = async (action: "summarize" | "evaluate") => {
    try {
      setLoading(true);
      const formData = new FormData();
      formData.append("action", action);
      formData.append("text", text);

      if (file) {
        formData.append("file", file);
      }

      if (action === "evaluate") {
        formData.append("descriptor", descriptor);
      }

      const response = await axios.post("/api/ai", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setResult(
        action === "summarize"
          ? response.data.summary
          : response.data.evaluation
      );
    } catch (error) {
      console.error("Error:", error);
      setResult("Error processing request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-4">
      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Task Analysis</h2>

        <div className="space-y-2">
          <label className="block text-sm font-medium">
            Enter text or upload a file
          </label>
          <Textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Enter task text here..."
            className="min-h-[100px]"
          />

          <input
            type="file"
            accept=".pdf,.doc,.docx,.txt"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
            className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-violet-50 file:text-violet-700 hover:file:bg-violet-100"
          />
        </div>

        <Button
          onClick={() => handleSubmit("summarize")}
          disabled={loading || (!text && !file)}
        >
          {loading ? "Processing..." : "Generate Summary"}
        </Button>
      </div>

      <div className="space-y-2">
        <h2 className="text-lg font-semibold">Work Evaluation</h2>

        <div className="space-y-2">
          <label className="block text-sm font-medium">Task Description</label>
          <Textarea
            value={descriptor}
            onChange={(e) => setDescriptor(e.target.value)}
            placeholder="Enter task description..."
            className="min-h-[100px]"
          />
        </div>

        <Button
          onClick={() => handleSubmit("evaluate")}
          disabled={loading || !descriptor || (!text && !file)}
        >
          {loading ? "Processing..." : "Evaluate Work"}
        </Button>
      </div>

      {result && (
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h3 className="font-semibold mb-2">Result:</h3>
          <div className="whitespace-pre-wrap">{result}</div>
        </div>
      )}
    </div>
  );
}
