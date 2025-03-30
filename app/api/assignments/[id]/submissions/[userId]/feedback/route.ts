import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Assignment from "@/models/Assignment";
import Group from "@/models/Group";
import { verifyAuth } from "@/lib/auth";
import { Types } from "mongoose";
import { UserRole } from "@/models/User";

// POST /api/assignments/[id]/submissions/[userId]/feedback
// Update feedback and grade for a specific submission
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    await dbConnect();
    const auth = verifyAuth(request);
    
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { id, userId } = params;
    
    // Validate IDs
    if (!Types.ObjectId.isValid(id) || !Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Invalid ID format" },
        { status: 400 }
      );
    }
    
    const body = await request.json();
    const { feedback, grade } = body;
    
    // Find the assignment
    const assignment = await Assignment.findById(id);
    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }
    
    // Get the group for this assignment
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
        { error: "Only teachers can provide feedback" },
        { status: 403 }
      );
    }
    
    // Find the student's submission
    const submissionIndex = assignment.submissions.findIndex(
      (s: { userId: { toString: () => string } }) => 
        s.userId.toString() === userId
    );
    
    if (submissionIndex === -1) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }
    
    // Update the feedback and grade
    assignment.submissions[submissionIndex].feedback = feedback;
    
    if (grade !== undefined) {
      assignment.submissions[submissionIndex].grade = grade;
    }
    
    // Set the status to graded
    assignment.submissions[submissionIndex].status = 'graded';
    
    // Save the updated assignment
    await assignment.save();
    
    return NextResponse.json({
      message: "Feedback and grade updated successfully"
    });
  } catch (error) {
    console.error("Error updating feedback:", error);
    return NextResponse.json(
      { error: "Error updating feedback" },
      { status: 500 }
    );
  }
} 