import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Assignment from "@/models/Assignment";
import Group from "@/models/Group";
import { verifyAuth } from "@/lib/auth";
import { Types } from "mongoose";
import { UserRole } from "@/models/User";

// POST /api/assignments/[id]/ai-feedback
// Update an assignment with AI-generated feedback
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
    const { aiMarkScheme } = body;
    
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
        { error: "Only teachers can update assignment feedback" },
        { status: 403 }
      );
    }
    
    // Update the assignment with the AI mark scheme
    assignment.aiMarkScheme = aiMarkScheme;
    await assignment.save();
    
    return NextResponse.json({
      message: "Assignment updated with AI feedback"
    });
  } catch (error) {
    console.error("Error updating assignment with AI feedback:", error);
    return NextResponse.json(
      { error: "Error updating assignment with AI feedback" },
      { status: 500 }
    );
  }
} 