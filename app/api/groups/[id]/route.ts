import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Group from "@/models/Group";
import User from "@/models/User";
import Assignment from "@/models/Assignment";
import { verifyAuth } from "@/lib/auth";
import { Types } from "mongoose";
import { UserRole } from "@/models/User";

// GET /api/groups/[id]
// Get a specific group by ID
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
    
    // Validate group ID
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid group ID format" },
        { status: 400 }
      );
    }
    
    // Find the group by ID
    const group = await Group.findById(id)
      .populate({
        path: 'participants.userId',
        model: User,
        select: 'username email _id role'
      })
      .populate({
        path: 'createdBy',
        model: User,
        select: 'username email _id'
      });
    
    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }
    
    // Check if the user is a participant in the group
    const isParticipant = group.participants.some(
      (p: { userId: { _id: { toString: () => string } } }) => 
        p.userId._id.toString() === auth.userId
    );
    
    if (!isParticipant) {
      return NextResponse.json(
        { error: "You are not a participant in this group" },
        { status: 403 }
      );
    }
    
    // Get all assignments for this group
    const assignments = await Assignment.find({ groupId: group._id })
      .populate({
        path: 'createdBy',
        model: User,
        select: 'username email _id'
      })
      .sort({ createdAt: -1 });
    
    return NextResponse.json({
      group,
      assignments
    });
  } catch (error) {
    console.error("Error getting group:", error);
    return NextResponse.json(
      { error: "Error getting group details" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id]
// Delete a group
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
    
    // Validate group ID
    if (!Types.ObjectId.isValid(id)) {
      return NextResponse.json(
        { error: "Invalid group ID format" },
        { status: 400 }
      );
    }
    
    // Find the group
    const group = await Group.findById(id);
    
    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }
    
    // Check if the user is the creator of the group
    if (group.createdBy.toString() !== auth.userId) {
      return NextResponse.json(
        { error: "Only the creator can delete this group" },
        { status: 403 }
      );
    }
    
    // Delete all assignments for this group
    await Assignment.deleteMany({ groupId: id });
    
    // Delete the group
    await Group.findByIdAndDelete(id);
    
    return NextResponse.json(
      { message: "Group and all its assignments deleted successfully" }
    );
  } catch (error) {
    console.error("Error deleting group:", error);
    return NextResponse.json(
      { error: "Error deleting group" },
      { status: 500 }
    );
  }
} 