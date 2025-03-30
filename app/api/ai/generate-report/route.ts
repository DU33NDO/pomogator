import { NextRequest, NextResponse } from "next/server";
import OpenAI from "openai";
import { verifyAuth } from "@/lib/auth";
import dbConnect from "@/lib/mongoose";
import Assignment from "@/models/Assignment";
import { Types } from "mongoose";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(request: NextRequest) {
  try {
    const auth = verifyAuth(request);
    if (!auth) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Process the request data - try FormData first, fallback to JSON
    let action: string;
    let assignmentId: string;
    let markScheme: string = "";
    let markSchemeFile: File | null = null;

    try {
      // Try to parse as FormData
      const formData = await request.formData();
      action = formData.get("action") as string;
      assignmentId = formData.get("assignmentId") as string;
      const markSchemeText = formData.get("text") as string || "";
      markSchemeFile = formData.get("file") as File | null;
      markScheme = markSchemeText;
    } catch (error) {
      // If FormData parsing fails, try to parse as JSON
      console.log("FormData parsing failed, trying JSON:", error);
      try {
        const clonedRequest = request.clone();
        const jsonData = await clonedRequest.json();
        action = jsonData.action;
        assignmentId = jsonData.assignmentId;
        markScheme = jsonData.text || "";
      } catch (jsonError) {
        console.error("JSON parsing also failed:", jsonError);
        return NextResponse.json(
          { error: "Invalid request format: must be FormData or JSON" },
          { status: 400 }
        );
      }
    }

    if (!action || !assignmentId) {
      return NextResponse.json(
        { error: "Missing required fields: action and assignmentId" },
        { status: 400 }
      );
    }

    if (action !== "evaluate") {
      return NextResponse.json(
        { error: "Invalid action specified" },
        { status: 400 }
      );
    }

    if (!Types.ObjectId.isValid(assignmentId)) {
      return NextResponse.json(
        { error: "Invalid assignment ID" },
        { status: 400 }
      );
    }

    // Connect to the database
    await dbConnect();

    // Get the assignment with all submissions
    const assignment = await Assignment.findById(assignmentId).populate({
      path: 'submissions.userId',
      select: 'username email _id'
    });

    if (!assignment) {
      return NextResponse.json(
        { error: "Assignment not found" },
        { status: 404 }
      );
    }

    // Extract mark scheme
    if (markSchemeFile) {
      const fileContent = await markSchemeFile.text();
      markScheme += "\n" + fileContent;
    }

    // If no submissions, return early
    if (!assignment.submissions || assignment.submissions.length === 0) {
      return NextResponse.json(
        { evaluation: "No submissions to evaluate" },
        { status: 200 }
      );
    }

    // Process each submission with OpenAI
    const evaluationPromises = assignment.submissions.map(async (submission: {
      _id: Types.ObjectId;
      userId: {
        _id: Types.ObjectId;
        username: string;
        email: string;
      };
      content: string;
      feedback: string;
      status: string;
    }) => {
      // Generate feedback using OpenAI
      const feedback = await generateSubmissionFeedback(
        assignment.title,
        assignment.description,
        markScheme,
        submission.content,
        submission.userId.username
      );

      // Update the submission with the feedback
      submission.feedback = feedback;
      submission.status = 'graded';
      
      return {
        submissionId: submission._id,
        userId: submission.userId._id,
        username: submission.userId.username,
        feedback
      };
    });

    // Wait for all evaluations to complete
    const evaluationResults = await Promise.all(evaluationPromises);

    // Save the updated assignment
    await assignment.save();

    // Prepare the evaluation summary for the aiMarkScheme
    const evaluationSummary = `# AI Feedback for Assignment: ${assignment.title}

## Summary
- ${evaluationResults.length} submissions evaluated
- Generated on: ${new Date().toLocaleString()}

## Individual Results
${evaluationResults.map(result => `- ${result.username}: Feedback generated`).join('\n')}

Use the "View Submission" button to see detailed feedback for each student.`;

    return NextResponse.json({
      evaluation: evaluationSummary,
      results: evaluationResults
    });

  } catch (error) {
    console.error("Error generating reports:", error);
    return NextResponse.json(
      { error: "Error generating reports" },
      { status: 500 }
    );
  }
}

/**
 * Generate feedback for a submission using OpenAI
 */
async function generateSubmissionFeedback(
  assignmentTitle: string,
  assignmentDescription: string,
  markScheme: string,
  submissionContent: string,
  studentName: string
): Promise<string> {
  const systemPrompt = `You are an expert educational assessment AI. Your task is to evaluate a student's submission against a provided mark scheme and generate detailed, constructive feedback.
  
The feedback should:
1. Begin with a brief, personalized introduction addressing the student by name
2. Include a structured checklist of criteria from the mark scheme and how well the student met each one
3. Highlight specific strengths with concrete examples from their submission
4. Identify areas for improvement with actionable suggestions
5. End with an encouraging summary that motivates further learning

IMPORTANT FORMATTING REQUIREMENTS:
- Use proper Markdown formatting throughout your response
- Use ## for section headings 
- Use **bold** for important terms, criteria names, and scores
- Use bullet points (- ) for lists
- Use > blockquotes for direct quotes from the student's work
- Include emojis where appropriate to make the feedback engaging (✅, ⭐, 📝, etc.)
- Format any scoring as **Score: X/Y points**
- Create visually distinct sections with horizontal rules (---)
  
Be specific, objective, and supportive in your assessment. Use clear language that helps the student understand both what they did well and how they can improve.`;

  const userPrompt = `# Assignment
Title: ${assignmentTitle}
Description: ${assignmentDescription}

# Mark Scheme
${markScheme}

# Student Submission
Student: ${studentName}
Content: ${submissionContent}

Please evaluate this submission against the mark scheme and provide detailed, structured feedback with proper Markdown formatting.`;

  const response = await openai.chat.completions.create({
    model: "gpt-4o",
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 1500,
  });

  return response.choices[0].message.content || "No feedback generated";
}
