"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import axios from "axios";

interface Assignment {
  _id: string;
  title: string;
  description: string;
  deadline: string;
  submissions: {
    userId: string;
    content: string;
    submittedAt: string;
    status: "pending" | "submitted" | "graded";
  }[];
}

export default function TeamAssignments() {
  const { user } = useAuth();
  const params = useParams();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const token = localStorage.getItem("accessToken");

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [deadline, setDeadline] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAssignments();
  }, [params.id]);

  const fetchAssignments = async () => {
    try {
      const groupId = params.id;
      const response = await api.get(`/groups/${groupId}/assignments`);
      setAssignments(response.data.assignments);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAssignment = async () => {
    if (!title || !description || !deadline) return;

    setSubmitting(true);
    try {
      const payload = {
        title,
        description,
        groupId: params.id,
        deadline: new Date(deadline).toISOString(),
      };
      console.log(`CHECK: GROUP ID=${params.id}`);

      await axios.post("/api/assignments", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      await fetchAssignments();
      setIsModalOpen(false);
      resetForm();
    } catch (error) {
      console.error("Error creating assignment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setDeadline("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading assignments...</p>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Assignments</h1>
        {user?.role === "TEACHER" && (
          <Button
            onClick={() => setIsModalOpen(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            Create Assignment
          </Button>
        )}
      </div>

      <div className="space-y-6">
        {assignments.map((assignment) => (
          <div
            key={assignment._id}
            className="bg-white rounded-lg shadow-md p-6 relative"
          >
            <div className="mb-4">
              <h2 className="text-xl font-semibold mb-2">{assignment.title}</h2>
              <p className="text-gray-600 mb-4">{assignment.description}</p>

              <div className="text-sm text-gray-500">
                Deadline: {new Date(assignment.deadline).toLocaleString()}
              </div>

              <div className="text-sm text-gray-500 mt-1">
                Submissions: {assignment.submissions.length}
              </div>
            </div>

            <div className="mt-4 flex justify-end">
              {user?.role === "TEACHER" ? (
                <Link href={`/assignments/${assignment._id}/submissions`}>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    Check Submissions
                  </Button>
                </Link>
              ) : (
                <>
                  {assignment.submissions.some(
                    (sub) => sub.userId === user?.id
                  ) ? (
                    <span className="text-green-600 text-sm">✓ Submitted</span>
                  ) : new Date(assignment.deadline) < new Date() ? (
                    <span className="text-red-600 text-sm">
                      Deadline passed
                    </span>
                  ) : (
                    <Link href={`/assignments/${assignment._id}`}>
                      <Button
                        variant="default"
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        Submit Assignment
                      </Button>
                    </Link>
                  )}
                </>
              )}
            </div>
          </div>
        ))}

        {assignments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No assignments available for this group.
          </div>
        )}
      </div>

      <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>Create New Assignment</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Title
              </label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Assignment title..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="min-h-[100px]"
                placeholder="Enter assignment description..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Deadline
              </label>
              <Input
                type="datetime-local"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
              />
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateAssignment}
                disabled={!title || !description || !deadline || submitting}
              >
                {submitting ? "Creating..." : "Create Assignment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
