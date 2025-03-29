import { NextRequest, NextResponse } from 'next/server';
import dbConnect from "@/lib/mongoose";
import Group from '@/models/Group';
import { UserRole } from '@/models/User';
import mongoose from 'mongoose';

// GET route to fetch all groups for a specific user ID
export async function GET(req: NextRequest) {
  try {
    const token = req.headers.get('authorization');
    
    if (!token) {
      return NextResponse.json({ error: 'Authorization token is required' }, { status: 401 });
    }
    
    const payload = JSON.parse(atob(token.split(".")[1]));
    const userId = payload.id || payload.sub || payload.userId;

    if (!userId) {
      return NextResponse.json({ error: 'User ID not found in token' }, { status: 400 });
    }

    await dbConnect();

    // Convert userId to ObjectId and handle potential errors
    let objectId;
    try {
      objectId = new mongoose.Types.ObjectId(userId);
    } catch {
      return NextResponse.json({ error: 'Invalid user ID format' }, { status: 400 });
    }

    // Log query params for debugging
    console.log('Finding groups for userId:', userId);

    // Find groups where the user is a participant with more reliable query
    const groups = await Group.find({
      'participants.userId': objectId
    })
    .populate('participants.userId', 'username email')
    .populate('createdBy', 'username')
    .lean();

    console.log(`Found ${groups.length} groups for user`);
    
    return NextResponse.json(groups);
  } catch (error) {
    console.error('Error fetching groups:', error);
    return NextResponse.json({ error: 'Failed to fetch groups' }, { status: 500 });
  }
}

// POST route to create a new group with the teacher as the only participant
export async function POST(req: NextRequest) {
  try {
    const { name, teacherId } = await req.json();
    
    if (!name || !teacherId) {
      return NextResponse.json({ error: 'Group name and teacher ID are required' }, { status: 400 });
    }

    await dbConnect();

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^\w ]+/g, '')
      .replace(/ +/g, '-') + '-' + Date.now().toString().slice(-4);

    // Create a new group with the teacher as a participant
    const newGroup = await Group.create({
      name,
      slug,
      createdBy: teacherId,
      participants: [
        {
          userId: teacherId,
          role: UserRole.TEACHER
        }
      ]
    });
    console.log("teacherId", teacherId);
    await newGroup.save();
    console.log("Group created:", newGroup);
    return NextResponse.json(newGroup, { status: 201 });
  } catch (error) {
    console.error('Error creating group:', error);
    return NextResponse.json({ error: 'Failed to create group' }, { status: 500 });
  }
} 