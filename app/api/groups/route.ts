import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Group from "@/models/Group";
import User from "@/models/User";
import { verifyAuth } from "@/lib/auth";
import { UserRole } from "@/models/User";

// GET /api/groups
// Get all groups the user is a participant in
export async function GET(request: NextRequest) {
  try {
    await dbConnect();
    const auth = verifyAuth(request);
    
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Find all groups where the user is a participant
    const groups = await Group.find({ 
      "participants.userId": auth.userId 
    }).populate({
      path: 'participants.userId',
      model: 'User',
      select: 'username email _id role'
    }).populate({
      path: 'createdBy',
      model: 'User',
      select: 'username email _id'
    });
    
    return NextResponse.json(groups);
  } catch (error) {
    console.error("Error fetching groups:", error);
    return NextResponse.json(
      { error: "Error fetching groups" },
      { status: 500 }
    );
  }
}

// POST /api/groups
// Create a new group
export async function POST(request: NextRequest) {
  try {
    await dbConnect();
    const auth = verifyAuth(request);
    
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    // Only teachers can create groups
    const user = await User.findById(auth.userId);
    if (!user || user.role !== UserRole.TEACHER) {
      return NextResponse.json(
        { error: "Only teachers can create groups" },
        { status: 403 }
      );
    }
    
    const { name } = await request.json();
    
    if (!name || typeof name !== 'string' || name.trim() === '') {
      return NextResponse.json(
        { error: "Valid group name is required" },
        { status: 400 }
      );
    }
    
    // Create a new group with the creator as the first participant
    const newGroup = await Group.create({ 
      name: name.trim(),
      createdBy: auth.userId,
      participants: [{ 
        userId: auth.userId,
        role: UserRole.TEACHER
      }],
      // Slug is generated automatically in the pre-save hook
      slug: ''
    });
    
    try {
      // Populate the participants and creator fields
      const populatedGroup = await Group.findById(newGroup._id)
        .populate({
          path: 'participants.userId',
          model: 'User',
          select: 'username email _id role'
        })
        .populate({
          path: 'createdBy',
          model: 'User',
          select: 'username email _id'
        });
      
      return NextResponse.json(populatedGroup, { status: 201 });
    } catch (populateError) {
      console.error("Error populating group:", populateError);
      // Return the unpopulated group instead of failing completely
      return NextResponse.json(newGroup, { status: 201 });
    }
  } catch (error) {
    console.error("Error creating group:", error);
    return NextResponse.json(
      { error: "Error creating group" },
      { status: 500 }
    );
  }
}
