// app/page.tsx

"use client";

import { useState, useCallback } from "react";
// Assuming you have a globals.css or similar for styling
// import "./globals.css";

interface SubmissionResult {
  isCorrect: boolean;
  feedback: string;
  correctAnswer?: number;
}

export default function MathProblemGenerator() {
  const [sessionId, setSessionId] = useState<number | null>(null);
  const [problemText, setProblemText] = useState<string | null>(null);
  const [userAnswer, setUserAnswer] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [submissionResult, setSubmissionResult] =
    useState<SubmissionResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  // 1. INITIALIZE SCORES AS NUMBERS
  const [correctScore, setCorrectScore] = useState<number>(0);
  const [wrongScore, setWrongScore] = useState<number>(0);

  const resetState = () => {
    setSessionId(null);
    setProblemText(null);
    setUserAnswer("");
    setSubmissionResult(null);
    setError(null);
  };

  const generateProblem = async () => {
    resetState();
    setLoading(true);

    try {
      const response = await fetch("/api/math-problem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const data = await response.json();
      setSessionId(data.sessionId);
      setProblemText(data.problem_text);
    } catch (err) {
      console.error("Generate Problem Error:", err);
      setError("Failed to generate problem. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const submitAnswer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sessionId || loading || !userAnswer.trim()) return;

    setLoading(true);
    setSubmissionResult(null);

    try {
      const response = await fetch("/api/math-problem/submit", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, userAnswer }),
      });

      if (!response.ok)
        throw new Error(`HTTP error! status: ${response.status}`);

      const result: SubmissionResult = await response.json();
      setSubmissionResult(result);

      // 2. UPDATE SCORES BASED ON RESULT
      if (result.isCorrect) {
        setCorrectScore((prev) => prev + 1);
      } else {
        setWrongScore((prev) => prev + 1);
      }
      // END SCORE UPDATE
    } catch (err) {
      console.error("Submit Answer Error:", err);
      setError(
        "Failed to submit answer and get feedback. Please check your network."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative container mx-auto p-4 max-w-2xl">
      {/* === LOADING OVERLAY === */}
      {loading && (
        <div className="absolute inset-0 bg-white/80 flex flex-col items-center justify-center z-50 rounded-lg">
          <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mb-3"></div>
          <p className="text-gray-700 font-semibold">
            {problemText ? "Submitting answer..." : "Generating problem..."}
          </p>
        </div>
      )}

      <h1 className="text-3xl font-bold text-center mb-8">
        Primary 5 Math Practice 🧠
      </h1>

      {/* 3. DISPLAY SCORES */}
      <div className="flex justify-around bg-gray-50 p-3 mb-6 rounded-lg shadow-inner">
        <div className="text-center">
          <p className="text-sm text-gray-500 font-medium">Correct</p>
          <p className="text-3xl font-extrabold text-green-600">
            {correctScore}
          </p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 font-medium">Incorrect</p>
          <p className="text-3xl font-extrabold text-red-600">{wrongScore}</p>
        </div>
        <div className="text-center">
          <p className="text-sm text-gray-500 font-medium">Total</p>
          <p className="text-3xl font-extrabold text-blue-600">
            {correctScore + wrongScore}
          </p>
        </div>
      </div>
      {/* END SCORE DISPLAY */}

      {/* Problem Generation */}
      <div className="mb-8">
        <button
          onClick={generateProblem}
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-4 rounded transition duration-200 disabled:opacity-50"
        >
          Generate New Problem
        </button>
      </div>

      {/* Display Error */}
      {error && (
        <p className="text-red-500 text-center mb-4 p-3 bg-red-100 border border-red-400 rounded">
          {error}
        </p>
      )}

      {/* Problem + Submission */}
      {problemText && (
        <div className="bg-white p-6 shadow-lg rounded-lg border border-gray-200 relative">
          <h2 className="text-xl font-semibold mb-4">Problem:</h2>
          <p className="text-gray-700 mb-6">{problemText}</p>

          <form onSubmit={submitAnswer}>
            <div className="flex items-center space-x-4">
              <input
                type="number"
                step="any"
                value={userAnswer}
                onChange={(e) => setUserAnswer(e.target.value)}
                placeholder="Your Answer"
                disabled={loading || !!submissionResult}
                className="flex-grow text-black p-3 border border-gray-300 rounded focus:ring-blue-500 focus:border-blue-500"
                required
              />
              <button
                type="submit"
                disabled={loading || !!submissionResult || !userAnswer.trim()}
                className="bg-green-500 hover:bg-green-600 text-white font-bold py-3 px-6 rounded transition duration-200 disabled:opacity-50"
              >
                Submit Answer
              </button>
            </div>
          </form>

          {/* Feedback */}
          {submissionResult && (
            <div
              className={`mt-6 p-4 rounded-lg ${
                submissionResult.isCorrect
                  ? "bg-green-100 border-green-400"
                  : "bg-red-100 border-red-400"
              } border-l-4`}
            >
              <p className="font-bold mb-2 text-lg">
                {submissionResult.isCorrect
                  ? "✅ Correct! Great Job!"
                  : "❌ Try Again! Here's some feedback."}
              </p>
              <p className="text-gray-800">{submissionResult.feedback}</p>
              {submissionResult.correctAnswer && (
                <p className="mt-3 text-sm font-semibold">
                  The correct answer was:{" "}
                  <span className="text-blue-600">
                    {submissionResult.correctAnswer}
                  </span>
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {!problemText && !loading && !error && (
        <div className="text-center text-gray-500 mt-16 p-8 border-dashed border-2 border-gray-300 rounded-lg">
          <p className="text-lg">Click to generate math problem</p>
        </div>
      )}
    </div>
  );
}
