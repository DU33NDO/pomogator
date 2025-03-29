import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { verifyAuth } from "@/lib/auth";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const formData = await request.formData();
    const action = formData.get("action") as string;
    const text = formData.get("text") as string;
    const file = formData.get("file") as File | null;

    let contentText = text || "";

    if (file) {
      contentText = await processFile(file);
    }

    if (action === "summarize") {
      const summary = await generateTaskSummary(contentText);
      return NextResponse.json({ summary });
    } else if (action === "evaluate") {
      const descriptor = formData.get("descriptor") as string;
      const evaluation = await evaluateWork(descriptor, contentText);
      return NextResponse.json({ evaluation });
    }

    return NextResponse.json(
      { error: "Invalid action specified" },
      { status: 400 }
    );
  } catch (error) {
    console.error("AI processing error:", error);
    return NextResponse.json(
      { error: "Error processing request" },
      { status: 500 }
    );
  }
}

async function generateTaskSummary(content: string): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful academic assistant. Summarize the following content in clear bullet points, highlighting the key aspects and requirements.",
      },
      {
        role: "user",
        content,
      },
    ],
    temperature: 0.7,
    max_tokens: 1000,
  });

  return response.choices[0].message.content || "No summary generated";
}

async function evaluateWork(
  descriptor: string,
  submission: string
): Promise<string> {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content:
          "You are a helpful academic evaluator. Compare the submitted work against the task description and provide a detailed analysis.",
      },
      {
        role: "user",
        content: `Task Description:\n${descriptor}\n\nSubmitted Work:\n${submission}`,
      },
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  return response.choices[0].message.content || "No evaluation generated";
}

async function processFile(file: File): Promise<string> {
  const buffer = Buffer.from(await file.arrayBuffer());

  if (file.name.endsWith(".pdf")) {
    throw new Error("PDF processing not implemented");
  } else if (file.name.endsWith(".doc") || file.name.endsWith(".docx")) {
    throw new Error("Word document processing not implemented");
  }

  return buffer.toString("utf-8");
}
