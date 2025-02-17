import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import jwt from "jsonwebtoken";
import jwtDecode from "jwt-decode";
import bcrypt from "bcryptjs";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();

const verifyAuth = (request: NextRequest) => {
  try {
    const token = request.headers.get("authorization")?.split(" ")[1];
    if (!token) return null;

    return jwt.verify(token, process.env.JWT_SECRET || "your-secret-key") as {
      userId: string;
      role: string;
    };
  } catch (error) {
    return null;
  }
};

export async function GET(req: NextRequest) {
  const auth = verifyAuth(req);
  if (!auth) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { group: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    if (user.role === "TEACHER") {
      const assignments = await prisma.assignment.findMany({
        where: { teacherId: userId },
        include: {
          group: true,
          teacher: {
            select: { username: true },
          },
        },
        orderBy: { createdAt: "desc" },
      });
      return NextResponse.json(assignments);
    }

    if (user.role === "STUDENT" && user.groupId) {
      const assignments = await prisma.assignment.findMany({
        where: { groupId: user.groupId },
        include: {
          group: true,
          teacher: {
            select: { username: true },
          },
        },
        orderBy: { deadline: "asc" },
      });
      return NextResponse.json(assignments);
    }

    return NextResponse.json([]);
  } catch (error) {
    console.error("Error fetching assignments:", error);
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const auth = verifyAuth(request);
  if (!auth || auth.role !== "TEACHER") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await request.json();
    const { teacherId, groupId, deadline, description } = body;

    console.log("Received data:", {
      teacherId,
      groupId,
      deadline,
      description,
    });

    if (!teacherId || !groupId || !deadline || !description) {
      return NextResponse.json(
        {
          error: "Missing required fields",
          received: { teacherId, groupId, deadline, description },
        },
        { status: 400 }
      );
    }

    // Create new assignment
    const newAssignment = await prisma.assignment.create({
      data: {
        teacherId,
        groupId,
        deadline: new Date(deadline),
        description,
      },
      include: {
        group: true,
        teacher: {
          select: { username: true },
        },
      },
    });

    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error) {
    console.error("Assignment creation error:", error);
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}
