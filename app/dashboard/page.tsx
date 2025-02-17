"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import axios from "axios";
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

interface Group {
  id: string;
  name: string;
}

interface Student {
  id: string;
  username: string;
  email: string;
  groupId: string | null;
  group: {
    name: string;
  } | null;
}

export default function DashboardPage() {
  const [groups, setGroups] = useState<Group[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroup, setSelectedGroup] = useState("");
  const [selectedStudent, setSelectedStudent] = useState("");
  const router = useRouter();

  useEffect(() => {
    fetchGroups();
    fetchStudents();
  }, []);

  const fetchGroups = async () => {
    try {
      const response = await axios.get("/api/groups");
      setGroups(response.data);
    } catch (error) {
      console.error("Error fetching groups:", error);
    }
  };

  const fetchStudents = async () => {
    try {
      const response = await axios.get("/api/students");
      setStudents(response.data);
    } catch (error) {
      console.error("Error fetching students:", error);
    }
  };

  const handleCreateGroup = async () => {
    try {
      await axios.post("/api/groups", { name: newGroupName });
      setNewGroupName("");
      fetchGroups();
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  const handleAddStudentToGroup = async () => {
    try {
      await axios.post("/api/groups/addStudent", {
        groupId: selectedGroup,
        studentId: selectedStudent,
      });
      fetchGroups();
      fetchStudents();
    } catch (error) {
      console.error("Error adding student to group:", error);
    }
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
              <li key={group.id} className="bg-white p-4 rounded-lg shadow">
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
                    <SelectItem key={group.id} value={group.id}>
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
                  {students
                    .filter((student) => !student.groupId) // Only show students without a group
                    .map((student) => (
                      <SelectItem key={student.id} value={student.id}>
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
            <ul className="space-y-2">
              {students.map((student) => (
                <li key={student.id} className="bg-white p-4 rounded-lg shadow">
                  <p className="font-medium">{student.username}</p>
                  <p className="text-sm text-gray-600">{student.email}</p>
                  <p className="text-sm text-gray-600">
                    Group: {student.group ? student.group.name : "Not assigned"}
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
