import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Google Gemini AI Client
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

export async function POST(req: Request) {
  try {
    const { sessionId, userAnswer } = await req.json();

    if (!sessionId || typeof userAnswer === "undefined") {
      return NextResponse.json(
        { error: "Missing session ID or user answer" },
        { status: 400 }
      );
    }

    const { data: sessionData, error: sessionError } = await supabase
      .from("math_problem_sessions")
      .select("problem_text, correct_answer")
      .eq("id", sessionId)
      .single();

    if (sessionError || !sessionData) {
      console.error("Supabase Error:", sessionError);
      return NextResponse.json(
        { error: "Problem session not found" },
        { status: 404 }
      );
    }

    const { problem_text, correct_answer } = sessionData;
    const isCorrect = Math.abs(parseFloat(userAnswer) - correct_answer) < 0.001; // Allow for small floating point errors
    const correctnessText = isCorrect ? "correct" : "incorrect";

    const prompt = `
      Generate personalized and encouraging feedback for a Primary 5 student (age 10-11) who attempted a math problem.
      
      Problem: ${problem_text}
      User's Answer: ${userAnswer}
      Correct Answer: ${correct_answer}
      Result: The user's answer was ${correctnessText}.

      If the answer is correct, give a short praise and a brief, elegant summary of why they succeeded.
      If the answer is incorrect, be supportive. Gently explain *what* the problem was asking for, suggest a possible area they might have made a mistake (like 'check your steps for calculating the remainder' or 'make sure you converted the fraction correctly'), and then provide the correct final answer.
      Your feedback should be about 2-4 sentences long. Do not use markdown (like **bold** or *italics*).
    `;

    const aiResponse = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
    });
    const feedback = aiResponse.text.trim();

    const { error: submissionError } = await supabase
      .from("math_problem_submissions")
      .insert({
        session_id: sessionId,
        user_answer: userAnswer,
        is_correct: isCorrect,
        feedback_text: feedback,
      });

    if (submissionError)
      console.error("Supabase Submission Error:", submissionError);

    return NextResponse.json({
      isCorrect,
      feedback,
      correctAnswer: isCorrect ? undefined : correct_answer, // Only show correct answer if they were wrong
    });
  } catch (error) {
    console.error("Submission/Feedback Error:", error);
    return NextResponse.json(
      { error: "Failed to submit answer and generate feedback" },
      { status: 500 }
    );
  }
}
