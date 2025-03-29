import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import User from "@/models/User";
import Group from "@/models/Group";
import { UserRole } from "@/models/User";

export async function GET() {
  try {
    await dbConnect();
    const students = await User.find({ role: UserRole.STUDENT })
      .select("-password")
      .populate({
        path: 'groupIds',
        model: Group,
        options: { strictPopulate: false }
      });
    
    return NextResponse.json(students);
  } catch (error) {
    console.error("Error fetching students:", error);
    return NextResponse.json(
      { error: "Error fetching students" },
      { status: 500 }
    );
  }
}
