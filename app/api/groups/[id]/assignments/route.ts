import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/mongoose";
import Assignment from '@/models/Assignment';
import Group from '@/models/Group';
import { verifyAuth } from "@/lib/auth";
import { UserRole } from '@/models/User';
import mongoose, { Types } from 'mongoose';

// Interface for participant type
interface Participant {
  userId: Types.ObjectId;
  role: UserRole;
}

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
    
    const groupId = await params.id;
    
    // Validate the groupId
    if (!groupId) {
      return NextResponse.json({ error: "Group ID is required" }, { status: 400 });
    }
    
    // Find group by id or slug depending on the input format
    let group;
    
    // Check if groupId is a valid ObjectId
    const isValidObjectId = mongoose.Types.ObjectId.isValid(groupId);
    
    if (isValidObjectId) {
      group = await Group.findById(groupId);
    } else {
      // If not a valid ObjectId, try finding by slug
      group = await Group.findOne({ slug: groupId });
    }
    
    if (!group) {
      return NextResponse.json({ error: "Group not found" }, { status: 404 });
    }
    
    // Check if the user is a participant in this group
    const isParticipant = group.participants.some(
      (p: Participant) => p.userId.toString() === auth.userId
    );
    
    if (!isParticipant) {
      return NextResponse.json({ 
        error: "You are not a participant in this group" 
      }, { status: 403 });
    }
    
    // Get all assignments for this group
    const assignments = await Assignment.find({ groupId: group._id })
      .populate({
        path: 'groupId',
        model: Group,
        select: 'name slug'
      })
      .populate({
        path: 'createdBy',
        select: 'username email _id'
      })
      .sort({ createdAt: -1 });
    
    return NextResponse.json({ assignments });
  } catch (error) {
    console.error("Error getting group assignments:", error);
    return NextResponse.json(
      { error: "Error fetching group assignments" },
      { status: 500 }
    );
  }
}
