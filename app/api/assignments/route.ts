import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Assignment from "@/models/Assignment";
import Group from "@/models/Group";
import User from "@/models/User";
import { verifyAuth } from "@/lib/auth";
import { UserRole } from "@/models/User";
import { Types } from "mongoose";

// GET /api/assignments
// Get all assignments for a user (based on their groups)
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const auth = verifyAuth(request);
    
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Get all groups where the user is a participant
    const groups = await Group.find({
      "participants.userId": auth.userId,
    });
    
    if (!groups.length) {
      return NextResponse.json({ assignments: [] });
    }
    
    const groupIds = groups.map(group => group._id);
    
    // Get all assignments for these groups
    const assignments = await Assignment.find({
      groupId: { $in: groupIds }
    })
    .populate({
      path: 'groupId',
      model: Group,
      select: 'name slug'
    })
    .populate({
      path: 'createdBy',
      model: User,
      select: 'username email _id'
    })
    .sort({ createdAt: -1 });
    
    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Error getting assignments:", error);
    return NextResponse.json(
      { error: "Error getting assignments" },
      { status: 500 }
    );
  }
}

// POST /api/assignments
// Create a new assignment
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const auth = verifyAuth(request);
    
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const body = await request.json();
    const { title, description, groupId, deadline } = body;
    
    // Validate required fields
    if (!title || !description || !groupId) {
      return NextResponse.json(
        { error: "Title, description, and groupId are required" },
        { status: 400 }
      );
    }
    
    // Check if the group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }
    
    // Check if the user is a teacher in this group
    const isTeacher = group.participants.some(
      (p: { userId: Types.ObjectId; role: UserRole }) => 
        p.userId.toString() === auth.userId && p.role === UserRole.TEACHER
    );
    
    if (!isTeacher) {
      return NextResponse.json(
        { error: "Only teachers can create assignments" },
        { status: 403 }
      );
    }
    
    // Create the assignment
    const newAssignment = new Assignment({
      title,
      description,
      groupId,
      deadline: deadline || null,
      createdBy: auth.userId,
      submissions: []
    });
    
    await newAssignment.save();
    
    // Populate createdBy and groupId fields
    const populatedAssignment = await Assignment.findById(newAssignment._id)
      .populate({
        path: 'groupId',
        model: Group,
        select: 'name slug'
      })
      .populate({
        path: 'createdBy',
        model: User,
        select: 'username email _id'
      });
    
    return NextResponse.json(
      { assignment: populatedAssignment },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating assignment:", error);
    return NextResponse.json(
      { error: "Error creating assignment" },
      { status: 500 }
    );
  }
}
