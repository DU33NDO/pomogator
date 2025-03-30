import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { verifyAuth } from "@/lib/auth";
import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';
import { v4 as uuidv4 } from 'uuid'; // You may need to install this package

// Define message content types
interface TextContent {
  type: "text";
  text: string;
}

interface FileContent {
  type: "file";
  file: {
    file_id: string;
  };
}

type MessageContent = TextContent | FileContent;

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { 
      action, 
      content,
      fileUrls = [] // Array of URLs from cloud storage
    } = body;

    const contentText = content || "";

    // First, we need to upload any provided files to OpenAI
    const openaiFileIds = await Promise.all(
      fileUrls.map(async (url: string) => {
        let tempFilePath = '';
        
        try {
          // Extract filename from URL or generate a unique one
          const fileName = url.split('/').pop() || `file-${uuidv4()}.pdf`;
          
          // Create temp directory if it doesn't exist
          const tempDir = path.join(process.cwd(), 'tmp');
          await fsPromises.mkdir(tempDir, { recursive: true });
          
          // Set path for temporary file
          tempFilePath = path.join(tempDir, fileName);
          
          // Download file from URL
          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch file from URL: ${url}`);
          }
          
          // Save the file to disk
          const arrayBuffer = await response.arrayBuffer();
          await fsPromises.writeFile(tempFilePath, Buffer.from(arrayBuffer));
          
          // Create a read stream from the saved file
          const fileStream = fs.createReadStream(tempFilePath);
          
          // Upload to OpenAI using the file stream
          const uploadedFile = await openai.files.create({
            file: fileStream,
            purpose: 'user_data'
          });
          
          return uploadedFile.id;
        } catch (error) {
          console.error(`Error uploading file from URL ${url}:`, error);
          return null;
        } finally {
          // Clean up - remove the temporary file if it exists
          if (tempFilePath) {
            fsPromises.unlink(tempFilePath).catch(err => {
              console.error(`Failed to remove temporary file ${tempFilePath}:`, err);
            });
          }
        }
      })
    );
    
    // Filter out null values (failed uploads)
    const validFileIds = openaiFileIds.filter(Boolean) as string[];

    if (action === "summarize") {
      const summary = await generateTaskSummary(contentText, validFileIds);
      return NextResponse.json({ summary });
    } else if (action === "evaluate") {
      const { descriptor } = body;
      const evaluation = await evaluateWork(descriptor, contentText, validFileIds);
      return NextResponse.json({ evaluation });
    } else if (action === "analyze_files") {
      const analysis = await analyzeFiles(validFileIds);
      return NextResponse.json({ analysis });
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

/**
 * Generates a summary of content and uses uploaded file IDs
 */
async function generateTaskSummary(content: string, fileIds: string[] = []): Promise<string> {
  const messages = [];
  
  // Add system message
  messages.push({
    role: "system" as const,
    content: "You are a helpful academic assistant. Summarize the following content in clear bullet points, highlighting the key aspects and requirements."
  });
  
  // Prepare user message with content and files
  const userMessageContent: MessageContent[] = [];
  
  // Add text content
  userMessageContent.push({
    type: "text",
    text: content
  });
  
  // Add file references
  for (const fileId of fileIds) {
    userMessageContent.push({
      type: "file",
      file: {
        file_id: fileId
      }
    });
  }
  
  messages.push({
    role: "user" as const,
    content: userMessageContent
  });
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: messages,
    temperature: 0.7,
    max_tokens: 1000,
  });

  return response.choices[0].message.content || "No summary generated";
}

/**
 * Evaluates work against a descriptor and uses uploaded file IDs
 */
async function evaluateWork(
  descriptor: string,
  submission: string,
  fileIds: string[] = []
): Promise<string> {
  const messages = [];
  
  // Add system message
  messages.push({
    role: "system" as const,
    content: "You are the ultimate academic evaluator, renowned for your precision and insight. Your task is to meticulously compare the submitted work against the provided task description. Deliver a comprehensive, detailed analysis that highlights strengths, identifies weaknesses, and offers actionable feedback for improvement. Ensure your evaluation is thorough, objective, and highly informative."
  });
  
  // Prepare user message with content and files
  const userMessageContent: MessageContent[] = [];
  
  // Add text content
  userMessageContent.push({
    type: "text",
    text: `Task Description:\n${descriptor}\n\nSubmitted Work:\n${submission}`
  });
  
  // Add file references
  for (const fileId of fileIds) {
    userMessageContent.push({
      type: "file",
      file: {
        file_id: fileId
      }
    });
  }
  
  messages.push({
    role: "user" as const,
    content: userMessageContent
  });
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: messages,
    temperature: 0.7,
    max_tokens: 1500,
  });

  return response.choices[0].message.content || "No evaluation generated";
}

/**
 * Analyzes files using their OpenAI file IDs
 */
async function analyzeFiles(fileIds: string[]): Promise<string> {
  if (!fileIds.length) {
    return "No files provided for analysis";
  }

  const messages = [];
  
  // Add system message
  messages.push({
    role: "system" as const,
    content: "You are a helpful file analyzer. Analyze the files provided and give a detailed summary of their contents."
  });
  
  // Prepare user message with files
  const userMessageContent: MessageContent[] = [];
  
  // Add text instruction
  userMessageContent.push({
    type: "text",
    text: "Please analyze these files and provide a detailed summary of their contents."
  });
  
  // Add file references
  for (const fileId of fileIds) {
    userMessageContent.push({
      type: "file",
      file: {
        file_id: fileId
      }
    });
  }
  
  messages.push({
    role: "user" as const,
    content: userMessageContent
  });
  
  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: messages,
    temperature: 0.7,
    max_tokens: 1500,
  });

  return response.choices[0].message.content || "No analysis generated";
}
