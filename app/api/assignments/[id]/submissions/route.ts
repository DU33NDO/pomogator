import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Assignment from "@/models/Assignment";
import Group from "@/models/Group";
import User from "@/models/User";
import { verifyAuth } from "@/lib/auth";
import { Types } from "mongoose";
import { UserRole } from "@/models/User";

// GET /api/assignments/[id]/submissions
// Get all submissions for a specific assignment
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
    
    const { id } = params;
    
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
        path: 'submissions.userId',
        model: User,
        select: 'username email _id'
      });
    
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
    
    // For students, return only their submission
    if (participant.role === UserRole.STUDENT) {
      const userSubmission = assignment.submissions.filter(
        (s: { userId: { _id: { toString: () => string } } }) => 
          s.userId._id.toString() === auth.userId
      );
      
      return NextResponse.json({ submissions: userSubmission });
    }
    
    // For teachers, return all submissions
    return NextResponse.json({ submissions: assignment.submissions });
  } catch (error) {
    console.error("Error getting submissions:", error);
    return NextResponse.json(
      { error: "Error getting submissions" },
      { status: 500 }
    );
  }
}

// POST /api/assignments/[id]/submissions
// Submit an assignment
export async function POST(
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
    
    const body = await request.json();
    const { content, fileName, fileUrl } = body;
    
    // Validate required fields
    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
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
    
    // Get the group for this assignment
    const group = await Group.findById(assignment.groupId);
    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }
    
    // Check if the user is a student in the group
    const isStudent = group.participants.some(
      (p: { userId: Types.ObjectId; role: UserRole }) => 
        p.userId.toString() === auth.userId && p.role === UserRole.STUDENT
    );
    
    if (!isStudent) {
      return NextResponse.json(
        { error: "Only students can submit assignments" },
        { status: 403 }
      );
    }
    
    // Check if the user has already submitted
    const existingSubmissionIndex = assignment.submissions.findIndex(
      (s: { userId: { toString: () => string } }) => 
        s.userId.toString() === auth.userId
    );
    
    const submission = {
      userId: auth.userId,
      content,
      fileName: fileName || null,
      fileUrl: fileUrl || null,
      submittedAt: new Date()
    };
    
    // Update or add submission
    if (existingSubmissionIndex !== -1) {
      assignment.submissions[existingSubmissionIndex] = submission;
    } else {
      assignment.submissions.push(submission);
    }
    
    await assignment.save();
    
    // Populate the user details in the submission
    const updatedAssignment = await Assignment.findById(id)
      .populate({
        path: 'submissions.userId',
        model: User,
        select: 'username email _id'
      });
    
    // Find the user's submission in the updated assignment
    const userSubmission = updatedAssignment.submissions.find(
      (s: { userId: { _id: { toString: () => string } } }) => 
        s.userId._id.toString() === auth.userId
    );
    
    return NextResponse.json(
      { submission: userSubmission },
      { status: existingSubmissionIndex !== -1 ? 200 : 201 }
    );
  } catch (error) {
    console.error("Error submitting assignment:", error);
    return NextResponse.json(
      { error: "Error submitting assignment" },
      { status: 500 }
    );
  }
} 