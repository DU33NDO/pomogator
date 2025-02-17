"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import axios from "axios";
import jwt from "jsonwebtoken";
import jwtDecode from "jwt-decode";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/contexts/AuthContext";

interface Group {
  id: string;
  name: string;
}

interface Assignment {
  id: string;
  description: string;
  deadline: string;
  teacherId: string;
  groupId: string;
  teacher: {
    username: string;
  };
  group: {
    name: string;
  };
}

interface User {
  id: string;
  email: string;
  role: string;
}

interface AuthContextType {
  user: User | null;
  login: (accessToken: string, refreshToken: string) => void;
  logout: () => void;
}

export default function AssignmentsPage() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);

  // Form states
  const [selectedGroup, setSelectedGroup] = useState("");
  const [deadline, setDeadline] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const initializePage = async () => {
      if (user) {
        await fetchAssignments();
        if (user.role === "TEACHER") {
          await fetchGroups();
        }
      }
      setLoading(false);
    };

    initializePage();
  }, [user]);

  const fetchAssignments = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get(`/api/assignments?userId=${user?.id}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setAssignments(response.data);
    } catch (error) {
      console.error("Error fetching assignments:", error);
    }
  };

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      const response = await axios.get("/api/groups", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      setGroups(response.data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const handleSubmit = async () => {
    if (!selectedGroup || !deadline || !description || !user) {
      console.log("Missing required data:", {
        selectedGroup,
        deadline,
        description,
      });
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem("accessToken");
      const formattedDeadline = new Date(deadline).toISOString();

      // Get the decoded token to get the user's ID
      const decodedToken = jwt.decode(token as string) as {
        userId: string;
      } | null;
      const teacherId = decodedToken?.userId;

      if (!teacherId) {
        console.error("Teacher ID not found in token");
        return;
      }

      const payload = {
        teacherId,
        groupId: selectedGroup,
        deadline: formattedDeadline,
        description,
      };

      console.log("Sending payload:", payload);

      const response = await axios.post("/api/assignments", payload, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });

      if (response.status === 201) {
        await fetchAssignments();
        // Reset form
        setSelectedGroup("");
        setDeadline("");
        setDescription("");
      }
    } catch (error) {
      console.error("Submission error:", error);
      if (axios.isAxiosError(error)) {
        console.error("Error details:", error.response?.data);
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (assignmentId: string) => {
    try {
      const token = localStorage.getItem("accessToken");
      await axios.delete(`/api/assignments/${assignmentId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      await fetchAssignments();
    } catch (error) {
      console.error("Error deleting assignment:", error);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        Loading...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Assignments</h1>

        {user?.role === "TEACHER" && (
          <div className="bg-white rounded-lg shadow-md p-6 mb-8">
            <h2 className="text-xl font-semibold mb-6">
              Create New Assignment
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Select Group
                </label>
                <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose a group" />
                  </SelectTrigger>
                  <SelectContent>
                    {groups.map((group) => (
                      <SelectItem key={group.id} value={group.id}>
                        {group.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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

              <Button
                onClick={handleSubmit}
                disabled={
                  !selectedGroup || !deadline || !description || submitting
                }
                className="w-full"
              >
                {submitting ? "Creating..." : "Create Assignment"}
              </Button>
            </div>
          </div>
        )}

        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-6">
            {user?.role === "TEACHER"
              ? "Published Assignments"
              : "Your Assignments"}
          </h2>

          {assignments.length === 0 ? (
            <p className="text-gray-500 text-center py-4">
              No assignments found.
            </p>
          ) : (
            <ul className="space-y-4">
              {assignments.map((assignment) => (
                <li
                  key={assignment.id}
                  className="flex justify-between items-center p-4 border rounded-lg hover:bg-gray-50"
                >
                  <div className="space-y-1">
                    <p className="font-medium">{assignment.description}</p>
                    <p className="text-sm text-gray-600">
                      Group: {assignment.group.name} | Due:{" "}
                      {new Date(assignment.deadline).toLocaleString()}
                    </p>
                  </div>

                  {user?.role === "TEACHER" && (
                    <Button
                      onClick={() => handleDelete(assignment.id)}
                      variant="destructive"
                      size="sm"
                    >
                      Delete
                    </Button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
