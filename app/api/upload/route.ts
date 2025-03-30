import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/auth";
import { writeFile } from "fs/promises";
import { join } from "path";
import { randomUUID } from "crypto";

// POST /api/upload
// Upload a file to local storage
export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json(
        { error: "No file provided" },
        { status: 400 }
      );
    }

    // Create unique filename
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    
    // Generate a unique filename with original extension
    const originalName = file.name;
    const fileExt = originalName.split('.').pop() || '';
    const uniqueFilename = `${randomUUID()}.${fileExt}`;
    
    // Save to public/storage directory
    const storagePath = join(process.cwd(), "public", "storage", uniqueFilename);
    await writeFile(storagePath, buffer);
    
    // Return path that can be accessed from browser
    const fileUrl = `/storage/${uniqueFilename}`;
    
    return NextResponse.json({ 
      fileUrl,
      fileName: originalName
    });
  } catch (error) {
    console.error("Error uploading file:", error);
    return NextResponse.json(
      { error: "Error uploading file" },
      { status: 500 }
    );
  }
} 