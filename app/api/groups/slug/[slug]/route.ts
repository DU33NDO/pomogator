import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Group from "@/models/Group";
import User from "@/models/User";
import Assignment from "@/models/Assignment";
import { verifyAuth } from "@/lib/auth";
import { Participant } from "@/types";

// GET /api/groups/slug/[slug]
// Get a specific group by slug
export async function GET(
  request: NextRequest,
  { params }: { params: { slug: string } }
) {
  try {
    await dbConnect();
    const auth = verifyAuth(request);
    
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    const { slug } = params;
    
    if (!slug) {
      return NextResponse.json(
        { error: "Group slug is required" },
        { status: 400 }
      );
    }
    
    // Find the group by slug
    const group = await Group.findOne({ slug })
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
      (p: Participant & { userId: { _id: { toString: () => string } } }) => 
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