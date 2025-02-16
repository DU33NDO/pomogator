import { NextResponse } from "next/server";
import { Storage } from "@google-cloud/storage";
import { writeFile, unlink } from "fs/promises";
import path from "path";
import { Readable } from "stream";

const storage = new Storage({
  keyFilename: process.env.GOOGLE_CLOUD_KEYFILE,
});
const bucketName = process.env.GOOGLE_CLOUD_BUCKET!;
const bucket = storage.bucket(bucketName);

export async function GET() {
  try {
    const [files] = await bucket.getFiles();
    const fileList = files.map((file) => ({
      name: file.name,
      url: `https://storage.googleapis.com/${bucketName}/${file.name}`,
    }));

    return NextResponse.json(fileList);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to list files" },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as Blob;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `uploads/${Date.now()}-${file.name}`;
    const fileStream = bucket.file(fileName).createWriteStream();

    await new Promise((resolve, reject) => {
      Readable.from(buffer)
        .pipe(fileStream)
        .on("finish", resolve)
        .on("error", reject);
    });

    return NextResponse.json({
      url: `https://storage.googleapis.com/${bucketName}/${fileName}`,
    });
  } catch (error) {
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { fileName } = await req.json();

    if (!fileName) {
      return NextResponse.json(
        { error: "File name required" },
        { status: 400 }
      );
    }

    await bucket.file(fileName).delete();
    return NextResponse.json({ message: "File deleted" });
  } catch (error) {
    return NextResponse.json({ error: "Deletion failed" }, { status: 500 });
  }
}
