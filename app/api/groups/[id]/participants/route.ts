import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Group from "@/models/Group";
import User from "@/models/User";
import { verifyAuth } from "@/lib/auth";
import mongoose from "mongoose";
import { UserRole } from "@/models/User";
import { Participant } from "@/types";

// POST /api/groups/[id]/participants
// Add a participant to a group
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
    
    const groupId = params.id;
    
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json(
        { error: "Invalid group ID format" },
        { status: 400 }
      );
    }
    
    // Get the group
    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }
    
    // Check if user is a teacher in this group
    const isTeacherInGroup = group.participants.some(
      (p: Participant) => p.userId.toString() === auth.userId && p.role === UserRole.TEACHER
    );
    
    if (!isTeacherInGroup) {
      return NextResponse.json(
        { error: "Only teachers in this group can add participants" },
        { status: 403 }
      );
    }
    
    const { username, role } = await request.json();
    
    if (!username || !role) {
      return NextResponse.json(
        { error: "Username and role are required" },
        { status: 400 }
      );
    }
    
    if (role !== UserRole.TEACHER && role !== UserRole.STUDENT) {
      return NextResponse.json(
        { error: "Invalid role. Must be 'TEACHER' or 'STUDENT'" },
        { status: 400 }
      );
    }
    
    // Find the user by username
    const user = await User.findOne({ username });
    if (!user) {
      return NextResponse.json(
        { error: "User not found" },
        { status: 404 }
      );
    }
    
    // Check if user is already in the group
    const isAlreadyInGroup = group.participants.some(
      (p: Participant) => p.userId.toString() === user._id.toString()
    );
    
    if (isAlreadyInGroup) {
      return NextResponse.json(
        { error: "User is already in this group" },
        { status: 409 }
      );
    }
    
    // Add the user to the group
    group.participants.push({
      userId: user._id,
      role: role as UserRole
    });
    
    await group.save();
    
    // Return the updated group with populated participants
    const updatedGroup = await Group.findById(groupId)
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
    
    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error("Error adding participant:", error);
    return NextResponse.json(
      { error: "Error adding participant to group" },
      { status: 500 }
    );
  }
}

// DELETE /api/groups/[id]/participants
// Remove a participant from a group
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
    
    const groupId = params.id;
    
    if (!mongoose.Types.ObjectId.isValid(groupId)) {
      return NextResponse.json(
        { error: "Invalid group ID format" },
        { status: 400 }
      );
    }
    
    // Get the group
    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }
    
    // Check if user is a teacher in this group
    const isTeacherInGroup = group.participants.some(
      (p: Participant) => p.userId.toString() === auth.userId && p.role === UserRole.TEACHER
    );
    
    if (!isTeacherInGroup) {
      return NextResponse.json(
        { error: "Only teachers in this group can remove participants" },
        { status: 403 }
      );
    }
    
    const { userId } = await request.json();
    
    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }
    
    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return NextResponse.json(
        { error: "Invalid user ID format" },
        { status: 400 }
      );
    }
    
    // Don't allow removing the creator of the group
    if (group.createdBy.toString() === userId) {
      return NextResponse.json(
        { error: "Cannot remove the creator of the group" },
        { status: 403 }
      );
    }
    
    // Remove the user from the group
    group.participants = group.participants.filter(
      (p: Participant) => p.userId.toString() !== userId
    );
    
    await group.save();
    
    // Return the updated group with populated participants
    const updatedGroup = await Group.findById(groupId)
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
    
    return NextResponse.json(updatedGroup);
  } catch (error) {
    console.error("Error removing participant:", error);
    return NextResponse.json(
      { error: "Error removing participant from group" },
      { status: 500 }
    );
  }
} 