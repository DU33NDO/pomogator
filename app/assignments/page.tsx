"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

const classes = [
  { id: "1", name: "Math 101" },
  { id: "2", name: "Algebra II" },
  { id: "3", name: "Geometry" },
];

export default function AssignmentsPage() {
  const [files, setFiles] = useState<
    {
      task_id: string;
      file: string;
      teacherName: string;
      groupName: string;
      deadline: string;
      description: string;
    }[]
  >([]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedClass, setSelectedClass] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    fetchFiles();
  }, []);

  const fetchFiles = async () => {
    const res = await fetch("/api/assignments");
    const data = await res.json();
    setFiles(data);
  };

  const handleFileUpload = async () => {
    if (!selectedFile || !selectedClass || !teacherName || !deadline) return;
    setUploading(true);

    const formData = new FormData();
    formData.append("file", selectedFile);
    formData.append("groupName", selectedClass);
    formData.append("teacherName", teacherName);
    formData.append("deadline", deadline);
    formData.append("description", description);

    try {
      const res = await axios.post("/api/assignments", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      if (res.status === 200) {
        fetchFiles();
        setSelectedFile(null);
        setSelectedClass("");
        setTeacherName("");
        setDeadline("");
        setDescription("");
      }
    } catch (error) {
      console.error("Upload error:", error);
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async (taskId: string) => {
    try {
      await axios.delete(`/api/assignments/${taskId}`);
      fetchFiles();
    } catch (error) {
      console.error("Error deleting assignment:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 mt-16">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold mb-6">Assignments & File Upload</h1>
        <div className="bg-white p-6 rounded-lg shadow-md mb-6">
          <label className="block text-sm font-medium text-gray-700">
            Select Class
          </label>
          <Select value={selectedClass} onValueChange={setSelectedClass}>
            <SelectTrigger>
              <SelectValue placeholder="Select a class" />
            </SelectTrigger>
            <SelectContent>
              {classes.map((cls) => (
                <SelectItem key={cls.id} value={cls.name}>
                  {cls.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <label className="block text-sm font-medium text-gray-700 mt-4">
            Teacher Name
          </label>
          <Input
            value={teacherName}
            onChange={(e) => setTeacherName(e.target.value)}
          />
          <label className="block text-sm font-medium text-gray-700 mt-4">
            Deadline
          </label>
          <Input
            type="date"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
          <label className="block text-sm font-medium text-gray-700 mt-4">
            Assignment Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="min-h-[100px]"
          />
          <input
            type="file"
            onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
            className="mt-4"
          />
          <Button
            onClick={handleFileUpload}
            disabled={!selectedFile || uploading}
            className="mt-4"
          >
            {uploading ? "Uploading..." : "Upload File"}
          </Button>
        </div>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Uploaded Assignments</h2>
          <ul>
            {files.map((file) => (
              <li
                key={file.task_id}
                className="flex justify-between items-center mb-2"
              >
                <div>
                  <a
                    href={file.file}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-500"
                  >
                    {file.description}
                  </a>
                  <p className="text-sm text-gray-600">
                    {file.teacherName} | {file.groupName} | Due: {file.deadline}
                  </p>
                </div>
                <Button
                  onClick={() => handleDelete(file.task_id)}
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
