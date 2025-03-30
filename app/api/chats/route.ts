import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';
import Chat from '@/models/Chat';
import User from '@/models/User';
import dbConnect from "@/lib/mongoose";
import { verifyAuth } from "@/lib/auth";

// Get all chats for the current user
export async function GET(req: Request) {
  try {
    // Connect to the database
    await dbConnect();

    // Verify authentication
    const authData = await verifyAuth(req as NextRequest);
    
    if (!authData) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const userId = authData.userId;
    
    // Find all chats where the current user is a participant
    const chats = await Chat.find({ participants: userId })
      .populate({
        path: 'participants',
        select: 'username email role',
        model: User
      })
      .sort({ lastUpdated: -1 });
    
    return NextResponse.json({ success: true, chats });
    
  } catch (error) {
    console.error('Error fetching chats:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch chats' }, { status: 500 });
  }
}

// Create a new chat
export async function POST(req: Request) {
  try {
    console.log('POST /api/chats - Create new chat request received');
    
    // Connect to the database
    await dbConnect();
    console.log('Database connected');

    // Verify authentication
    const authData = await verifyAuth(req as NextRequest);
    console.log('Auth data:', authData);
    
    if (!authData) {
      console.log('Authentication failed');
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }
    
    const currentUserId = authData.userId;
    console.log('Current user ID:', currentUserId);
    
    // Parse request body
    const body = await req.json();
    console.log('Request body:', body);
    
    const { participantId } = body;
    
    if (!participantId) {
      console.log('Participant ID is missing');
      return NextResponse.json({ success: false, error: 'Participant ID is required' }, { status: 400 });
    }
    
    console.log('Participant ID:', participantId);
    
    // Check if user exists
    const participantUser = await User.findById(participantId);
    
    if (!participantUser) {
      console.log('Participant user not found');
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }
    
    console.log('Participant user found:', participantUser.username);
    
    // Check if chat already exists between users
    const existingChat = await Chat.findOne({
      participants: { $all: [currentUserId, participantId] }
    });
    
    if (existingChat) {
      console.log('Existing chat found between users');
      
      // Populate participants
      await existingChat.populate({
        path: 'participants',
        select: 'username email role',
        model: User
      });
      
      return NextResponse.json({ success: true, chat: existingChat });
    }
    
    console.log('Creating new chat between users');
    
    // Create new chat
    const newChat = await Chat.create({
      participants: [currentUserId, participantId],
      messages: [],
      lastUpdated: new Date()
    });
    
    console.log('New chat created with ID:', newChat._id);
    
    // Populate participants
    await newChat.populate({
      path: 'participants',
      select: 'username email role',
      model: User
    });
    
    console.log('Successfully populated participants');
    
    return NextResponse.json({ success: true, chat: newChat }, { status: 201 });
    
  } catch (error) {
    console.error('Error creating chat:', error);
    return NextResponse.json({ success: false, error: 'Failed to create chat' }, { status: 500 });
  }
} 