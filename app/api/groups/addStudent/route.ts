import { NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function POST(request: Request) {
  try {
    const { groupId, studentId } = await request.json();
    const updatedUser = await prisma.user.update({
      where: { id: studentId },
      data: { groupId },
    });
    return NextResponse.json(updatedUser);
  } catch (error) {
    console.error("Error adding student to group:", error);
    return NextResponse.json(
      { error: "Error adding student to group" },
      { status: 500 }
    );
  }
}
