import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Group from "@/models/Group";
import mongoose from "mongoose";

export async function POST(request: Request) {
  try {
    await dbConnect();
    const { groupId, studentId } = await request.json();
    
    if (!groupId || !studentId) {
      return NextResponse.json(
        { error: "Group ID and Student ID are required" },
        { status: 400 }
      );
    }
    
    // Validate ObjectIds
    if (!mongoose.Types.ObjectId.isValid(groupId) || !mongoose.Types.ObjectId.isValid(studentId)) {
      return NextResponse.json(
        { error: "Invalid Group ID or Student ID format" },
        { status: 400 }
      );
    }
    
    // Check if group exists
    const group = await Group.findById(groupId);
    if (!group) {
      return NextResponse.json(
        { error: "Group not found" },
        { status: 404 }
      );
    }
    
    const updatedUser = await User.findByIdAndUpdate(
      studentId,
      { $pull: { groupIds: groupId } },
      { new: true }
    )
    .select("-password")
    .populate({
      path: 'groupIds',
      model: Group,
      options: { strictPopulate: false }
    });
    
    if (!updatedUser) {
      return NextResponse.json(
        { error: "Student not found" },
        { status: 404 }
      );
    }
    
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error removing student from group:", error);
    return NextResponse.json(
      { error: "Error removing student from group" },
      { status: 500 }
    );
  }
} 