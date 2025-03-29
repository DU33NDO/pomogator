"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import api from "@/utils/api";
interface User {
  _id: string;
  username: string;
  email: string;
}

interface Group {
  _id: string;
  name: string;
  slug: string;
  createdBy: User;
  participants: {
    userId: User;
    role: string;
  }[];
}

export default function TeamsPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchGroups = async () => {
      try {
        if (typeof window !== 'undefined') {
          const token = localStorage.getItem("accessToken");
          if (token) {
            const payload = JSON.parse(atob(token.split(".")[1]));
            if (payload.userId) {
              console.log("payload", payload);
              const response = await api.get(`/groups?userId=${payload.userId}`);
              setGroups(response.data);
            }
          }
        }
      } catch (err) {
        setError("Error loading groups");
        console.error("Error fetching groups:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchGroups();
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">Loading...</div>
      </div>
    );

  if (error)
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl text-red-500">Error: {error}</div>
      </div>
    );

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      <h1 className="text-3xl font-bold mb-8">My Teams</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {groups.map((group) => (
          <Link
            href={`/teams/${group.slug}/chat`}
            key={group._id}
            className="block bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 overflow-hidden border border-gray-200 hover:-translate-y-1 transform transition-transform"
          >
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-3 text-gray-800">
                {group.name}
              </h2>
              <div className="space-y-2">
                <p className="text-gray-600 text-sm flex items-center">
                  <span className="material-icons-outlined text-base mr-2">
                    person
                  </span>
                  Created by: {group.createdBy.username}
                </p>
                <p className="text-gray-600 text-sm flex items-center">
                  <span className="material-icons-outlined text-base mr-2">
                    group
                  </span>
                  {group.participants.length}{" "}
                  {group.participants.length === 1 ? "member" : "members"}
                </p>
              </div>
              <div className="mt-4 flex justify-end">
                <span className="text-blue-600 text-sm hover:text-blue-800">
                  Open Chat →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {groups.length === 0 && (
        <div className="text-center py-12">
          <p className="text-gray-500 text-lg">No teams found</p>
        </div>
      )}
    </div>
  );
}
