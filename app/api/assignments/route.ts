import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@prisma/client";
import { Storage } from "@google-cloud/storage";
import { v4 as uuidv4 } from "uuid";

const prisma = new PrismaClient();
const storage = new Storage();
const bucketName = process.env.GOOGLE_CLOUD_BUCKET_NAME!;

export async function GET() {
  try {
    const assignments = await prisma.assignment.findMany();
    return NextResponse.json(assignments);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch assignments" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    if (!file || !(file instanceof File)) {
      console.log("File is missing or invalid:", file);
      return NextResponse.json(
        { error: "Invalid file upload" },
        { status: 400 }
      );
    }
    const teacherName = formData.get("teacherName") as string;
    const groupName = formData.get("groupName") as string;
    const deadline = formData.get("deadline") as string;
    const description = formData.get("description") as string;

    if (!file || !teacherName || !groupName || !deadline) {
      console.log(
        `FILE: ${file}; Teacher: ${teacherName}; Group: ${groupName}; Deadline: ${deadline}; Description: ${description}`
      );
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 }
      );
    }

    const fileBuffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${uuidv4()}-${file.name}`;
    const bucket = storage.bucket(bucketName);
    const blob = bucket.file(fileName);

    await blob.save(fileBuffer, {
      contentType: file.type,
      resumable: false,
    });

    const fileUrl = `https://storage.googleapis.com/${bucketName}/${fileName}`;

    const newAssignment = await prisma.assignment.create({
      data: {
        file: fileUrl,
        teacherName,
        groupName,
        deadline: new Date(deadline),
        description,
      },
    });

    return NextResponse.json(newAssignment, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to create assignment" },
      { status: 500 }
    );
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) {
      return NextResponse.json(
        { error: "Missing assignment ID" },
        { status: 400 }
      );
    }

    const assignment = await prisma.assignment.findUnique({ where: { id } });
    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    const fileName = assignment.file.split("/").pop();
    const bucket = storage.bucket(bucketName);
    const blob = bucket.file(fileName!);
    await blob.delete();

    await prisma.assignment.delete({ where: { id } });

    return NextResponse.json({ message: "Assignment deleted successfully" });
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to delete assignment" },
      { status: 500 }
    );
  }
}
