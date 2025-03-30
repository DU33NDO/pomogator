import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Assignment from "@/models/Assignment";
import Group from "@/models/Group";
import User from "@/models/User";
import { verifyAuth } from "@/lib/auth";
import { Types } from "mongoose";
import { UserRole } from "@/models/User";

// GET /api/assignments/[id]
// Get a specific assignment by ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const auth = verifyAuth(request);
    
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = await params;
    
    // Validate assignment ID
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid assignment ID format" },
        { status: 400 }
      );
    }
    
    // Find the assignment
    const assignment = await Assignment.findById(id)
      .populate({
        path: 'groupId',
        model: Group,
        select: 'name slug _id'
      })
      .populate({
        path: 'createdBy',
        model: User,
        select: 'username email _id'
      });
    
    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }
    
    // Get the group to check if the user is a participant
    const group = await Group.findById(assignment.groupId);
    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }
    
    // Check if the user is a participant in the group
    const participant = group.participants.find(
      (p: { userId: Types.ObjectId; role: UserRole }) => 
        p.userId.toString() === auth.userId
    );
    
    if (!participant) {
      return NextResponse.json(
        { error: "You are not a participant in this group" },
        { status: 403 }
      );
    }
    
    // If the user is a student, return the assignment without submissions from other students
    if (participant.role === UserRole.STUDENT) {
      // Find only this student's submission
      const userSubmission = assignment.submissions.filter(
        (s: { userId: string | Types.ObjectId }) => 
          s.userId.toString() === auth.userId
      );
      
      // Create a copy of the assignment to modify
      const assignmentForStudent = {
        ...assignment.toObject(),
        submissions: userSubmission
      };
      
      return NextResponse.json(assignmentForStudent);
    }
    
    // For teachers, return the full assignment with all submissions
    return NextResponse.json(assignment);
  } catch (error) {
    console.error("Error getting assignment:", error);
    return NextResponse.json(
      { error: "Error getting assignment details" },
      { status: 500 }
    );
  }
}

// DELETE /api/assignments/[id]
// Delete an assignment
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await dbConnect();
    const auth = verifyAuth(request);
    
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id } = params;
    
    // Validate assignment ID
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid assignment ID format" },
        { status: 400 }
      );
    }
    
    // Find the assignment
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }
    
    // Get the group to check if the user is a teacher
    const group = await Group.findById(assignment.groupId);
    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }
    
    // Check if the user is a teacher in the group
    const isTeacher = group.participants.some(
      (p: { userId: Types.ObjectId; role: UserRole }) => 
        p.userId.toString() === auth.userId && p.role === UserRole.TEACHER
    );
    
    if (!isTeacher) {
      return NextResponse.json(
        { error: "Only teachers can delete assignments" },
        { status: 403 }
      );
    }
    
    // Check if the user is the creator of the assignment
    if (assignment.createdBy.toString() !== auth.userId) {
      return NextResponse.json(
        { error: "Only the creator can delete this assignment" },
        { status: 403 }
      );
    }
    
    // Delete the assignment
    await Assignment.findByIdAndDelete(id);
    
    return NextResponse.json(
      { message: "Assignment deleted successfully" }
    );
  } catch (error) {
    console.error("Error deleting assignment:", error);
    return NextResponse.json(
      { error: "Error deleting assignment" },
      { status: 500 }
    );
  }
} 