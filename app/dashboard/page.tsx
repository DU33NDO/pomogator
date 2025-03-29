"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MongoUser, MongoGroup } from "@/types";
import api from "@/lib/api";

export default function DashboardPage() {
  const [groups, setGroups] = useState<MongoGroup[]>([]);
  const [students, setStudents] = useState<MongoUser[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    fetchGroups();

    fetchStudents();
    
    // Get the current user's ID from the JWT token
    const token = localStorage.getItem("accessToken");
    if (token) {
      try {
        const payload = JSON.parse(atob(token.split(".")[1]));
        setUserId(payload.userId);
      } catch (error) {
        console.error("Error parsing JWT token:", error);
      }
    }
    
  }, []);

  const fetchGroups = async () => {
    try {
      const token = localStorage.getItem("accessToken");
      if (token) {
        const payload = JSON.parse(atob(token.split(".")[1]));
        if (payload.userId) {
          console.log("payload", payload);
          const response = await api.get(`/groups?userId=${payload.userId}`);
          setGroups(response.data);
        }
      }
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await api.get("/students");
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleCreateGroup = async () => {
    try {
      await api.post("/groups", { 
        name: newGroupName,
        teacherId: userId,
        participantId: selectedStudent || undefined 
      });
      setNewGroupName("");
      fetchGroups();
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  const handleAddStudentToGroup = async () => {
    try {
      await api.post(`/groups/${selectedGroup}/participants`, {
        username: students.find(s => s._id.toString() === selectedStudent)?.username,
        role: "STUDENT"
      });
      fetchGroups();
    } catch (error) {
      console.error("Error adding student to group:", error);
    }
  };

  const handleRemoveStudentFromGroup = async (studentId: string, groupId: string) => {
    try {
      await api.delete(`/groups/${groupId}/participants`, {
        data: { userId: studentId }
      });
      fetchGroups();
    } catch (error) {
      console.error("Error removing student from group:", error);
    }
  };

  // Find student groups by checking which groups have the student as a participant
  const getStudentGroups = (studentId: string) => {
    return groups.filter(group => 
      group.participants.some(p => {
        const userId = typeof p.userId === 'object' ? p.userId._id.toString() : p.userId.toString();
        return userId === studentId;
      })
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Groups section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Groups</h2>
          <ul className="space-y-2">
            {groups.map((group) => (
              <li key={group._id.toString()} className="bg-white p-4 rounded-lg shadow">
                {group.name}
              </li>
            ))}
          </ul>

          <Dialog>
            <DialogTrigger asChild>
              <Button className="mt-4">Create New Group</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Create New Group</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="groupName">Group Name</Label>
                  <Input
                    id="groupName"
                    value={newGroupName}
                    onChange={(e) => setNewGroupName(e.target.value)}
                  />
                </div>
                <Button onClick={handleCreateGroup}>Create Group</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Add Student to Group section */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Add Student to Group</h2>
          <div className="space-y-4">
            <div>
              <Label htmlFor="groupSelect">Select Group</Label>
              <Select value={selectedGroup} onValueChange={setSelectedGroup}>
                <SelectTrigger id="groupSelect">
                  <SelectValue placeholder="Select a group" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((group) => (
                    <SelectItem key={group._id.toString()} value={group._id.toString()}>
                      {group.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="studentSelect">Select Student</Label>
              <Select
                value={selectedStudent}
                onValueChange={setSelectedStudent}
              >
                <SelectTrigger id="studentSelect">
                  <SelectValue placeholder="Select a student" />
                </SelectTrigger>
                <SelectContent>
                  {students.map((student) => (
                    <SelectItem key={student._id.toString()} value={student._id.toString()}>
                      {student.username} ({student.email})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Button
              onClick={handleAddStudentToGroup}
              disabled={!selectedGroup || !selectedStudent}
            >
              Add to Group
            </Button>
          </div>

          {/* Display current students and their groups */}
          <div className="mt-8">
            <h3 className="text-xl font-semibold mb-4">Current Students</h3>
            <ul className="space-y-4">
              {students.map((student) => {
                // Get all groups where this student is a participant
                const studentGroups = getStudentGroups(student._id.toString());
                
                return (
                  <li key={student._id.toString()} className="bg-white p-6 rounded-lg shadow">
                    <div className="mb-2">
                      <p className="font-medium text-lg">{student.username}</p>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                    
                    <div>
                      <p className="font-medium mb-1">Groups:</p>
                      {studentGroups.length > 0 ? (
                        <ul className="space-y-1">
                          {studentGroups.map((group) => (
                            <li key={group._id.toString()} className="flex items-center justify-between bg-gray-50 px-3 py-2 rounded">
                              <span>{group.name}</span>
                              <Button 
                                variant="destructive" 
                                size="sm" 
                                onClick={() => handleRemoveStudentFromGroup(student._id.toString(), group._id.toString())}
                              >
                                Remove
                              </Button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p className="text-sm text-gray-500">Not assigned to any groups</p>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
