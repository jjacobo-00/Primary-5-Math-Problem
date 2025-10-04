import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Initialize Supabase Client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);

// Initialize Google Gemini AI Client
const ai = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY });

interface MathProblem {
  problem_text: string;
  final_answer: number;
}

export async function POST(req: Request) {
  try {
    // 1. **AI Generation Prompt**
    const systemInstruction = `You are an expert math problem generator for Primary 5 (age 10-11) students. 
      Your task is to generate a challenging but solvable word problem.
      The problem must focus on one of the following topics: fractions, decimals, percentages, or basic algebra.
      Your output must be a single JSON object with the keys "problem_text" (string) and "final_answer" (number). 
      The final_answer must be the exact numerical solution to the problem. Do not include any explanations or extra text.
      `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: "Generate a new Primary 5 math word problem.",
      config: {
        systemInstruction: systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: "object",
          properties: {
            problem_text: {
              type: "string",
              description: "The math word problem description.",
            },
            final_answer: {
              type: "number",
              description: "The exact numerical answer to the problem.",
            },
          },
          required: ["problem_text", "final_answer"],
        },
      },
    });

    const jsonString = response.text.trim().replace(/```json|```/g, "");
    const problemData: MathProblem = JSON.parse(jsonString);

    if (
      !problemData.problem_text ||
      typeof problemData.final_answer !== "number"
    ) {
      return NextResponse.json(
        { error: "Invalid response from AI model" },
        { status: 500 }
      );
    }

    const { data: session, error: dbError } = await supabase
      .from("math_problem_sessions")
      .insert({
        problem_text: problemData.problem_text,
        correct_answer: problemData.final_answer,
      })
      .select("id, problem_text")
      .single();

    if (dbError) {
      console.error("Supabase Error:", dbError);
      return NextResponse.json(
        { error: "Could not save problem session" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      sessionId: session.id,
      problem_text: session.problem_text,
    });
  } catch (error) {
    console.error("Problem Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate math problem" },
      { status: 500 }
    );
  }
}
