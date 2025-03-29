"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import api from "@/lib/api";
import Link from "next/link";
import { useParams } from "next/navigation";

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

  useEffect(() => {
    const fetchAssignments = async () => {
      try {
        const response = await api.get(`/groups/${params.id}/assignments`);
        setAssignments(response.data.assignments);
      } catch (error) {
        console.error("Error fetching assignments:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role === "STUDENT") {
      fetchAssignments();
    }
  }, [params.id, user]);

  if (user?.role !== "STUDENT") {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Only students can view assignments.</p>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading assignments...</p>
      </div>
    );
  }

  const hasSubmitted = (assignment: Assignment) => {
    return assignment.submissions.some((sub) => sub.userId === user?.id);
  };

  const isDeadlinePassed = (deadline: string) => {
    return new Date(deadline) < new Date();
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Assignments</h1>

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
            </div>

            <div className="mt-4 flex justify-end">
              {hasSubmitted(assignment) ? (
                <span className="text-green-600 text-sm">✓ Submitted</span>
              ) : isDeadlinePassed(assignment.deadline) ? (
                <span className="text-red-600 text-sm">Deadline passed</span>
              ) : (
                <Link href={`/assignments/${assignment._id}/submit`}>
                  <Button
                    variant="default"
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    Submit Assignment
                  </Button>
                </Link>
              )}
            </div>

            {hasSubmitted(assignment) && (
              <div className="mt-2 text-sm text-gray-500">
                Submitted on:{" "}
                {new Date(
                  assignment.submissions.find((sub) => sub.userId === user?.id)
                    ?.submittedAt || ""
                ).toLocaleString()}
              </div>
            )}
          </div>
        ))}

        {assignments.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No assignments available for this group.
          </div>
        )}
      </div>
    </div>
  );
}
