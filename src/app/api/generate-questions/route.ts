import { NextRequest, NextResponse } from 'next/server';
import { generateInterviewQuestions, regenerateSpecificQuestions } from '@/lib/openai';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { position, description, questionCount, regenerateMode, existingQuestions, indicesToRegenerate } = body;

    if (!position || !description) {
      return NextResponse.json(
        { error: 'Position and description are required' },
        { status: 400 }
      );
    }

    let result;

    if (regenerateMode && existingQuestions && indicesToRegenerate) {
      // Modo regeneración selectiva
      result = await regenerateSpecificQuestions({
        position,
        description,
        existingQuestions,
        indicesToRegenerate
      });
    } else {
      // Modo generación completa
      result = await generateInterviewQuestions({
        position,
        description,
        questionCount: questionCount || 10
      });
    }

    if (!result.success) {
      return NextResponse.json(
        { error: result.error || 'Failed to generate questions' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      questions: result.questions,
      success: true
    });

  } catch (error) {
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
