import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Assignment from "@/models/Assignment";
import Group from "@/models/Group";
import User from "@/models/User";
import { verifyAuth } from "@/lib/auth";
import { Types } from "mongoose";
import { UserRole } from "@/models/User";

// GET /api/assignments/[id]/submissions/[userId]
// Get a specific submission
export async function GET(
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
    
    // Find the submission
    const submission = assignment.submissions.find(
      (s: { userId: { toString: () => string } }) => 
        s.userId.toString() === userId
    );
    
    if (!submission) {
      return NextResponse.json(
        { error: "Submission not found" },
        { status: 404 }
      );
    }
    
    // Students can only view their own submissions
    if (participant.role === UserRole.STUDENT && auth.userId !== userId) {
      return NextResponse.json(
        { error: "You can only view your own submissions" },
        { status: 403 }
      );
    }
    
    // Populate user data
    const user = await User.findById(userId).select('username email _id');
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Clone the submission to avoid modifying the original
    const populatedSubmission = {
      ...submission.toObject(),
      userId: user,
    };
    
    return NextResponse.json(populatedSubmission);
  } catch (error) {
    console.error("Error getting submission:", error);
    return NextResponse.json(
      { error: "Error getting submission" },
      { status: 500 }
    );
  }
} 