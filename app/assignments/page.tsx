"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function AssignmentsPage() {
  const [files, setFiles] = useState<{ name: string; url: string }[]>([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const res = await fetch("/api/files");
    const data = await res.json();
    setFiles(data);
  };

  const handleFileUpload = async () => {
    if (!selectedFile) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);

    const res = await fetch("/api/files", {
      method: "POST",
      body: formData,
    });

    if (res.ok) {
      fetchFiles();
      setSelectedFile(null);
    }

    setUploading(false);
  };

  const handleDelete = async (fileName: string) => {
    await fetch("/api/files", {
      method: "DELETE",
      body: JSON.stringify({ fileName }),
      headers: { "Content-Type": "application/json" },
    });

    fetchFiles();
  };

  return (
    <div className="min-h-screen bg-gray-100 mt-16">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Assignments & File Upload</h1>

        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="mb-4"
          />
          <Button
            onClick={handleFileUpload}
            disabled={!selectedFile || uploading}
          >
            {uploading ? "Uploading..." : "Upload File"}
          </Button>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Uploaded Files</h2>
          <ul>
            {files.map((file) => (
              <li
                key={file.name}
                className="flex justify-between items-center mb-2"
              >
                <a
                  href={file.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500"
                >
                  {file.name}
                </a>
                <Button
                  onClick={() => handleDelete(file.name)}
                  variant="destructive"
                >
                  Delete
                </Button>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
