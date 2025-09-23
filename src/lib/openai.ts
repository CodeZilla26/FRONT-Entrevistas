import OpenAI from 'openai';
import { OPENROUTER_API_KEY, OPENROUTER_BASE_URL, OPENROUTER_REFERER, OPENROUTER_TITLE } from '@/server/config';

const openai = new OpenAI({
  baseURL: OPENROUTER_BASE_URL,
  apiKey: OPENROUTER_API_KEY,
  defaultHeaders: {
    'HTTP-Referer': OPENROUTER_REFERER,
    'X-Title': OPENROUTER_TITLE,
  },
});

export interface GenerateQuestionsParams {
  position: string;
  description: string;
  questionCount?: number;
}

export interface GeneratedQuestion {
  text: string;
  points: number;
  time: number; // seconds
}

export interface AIResponse {
  questions: GeneratedQuestion[];
  success: boolean;
  error?: string;
}

/**
 * Genera preguntas de entrevista usando IA
 */
export async function generateInterviewQuestions({
  position,
  description,
  questionCount = 5
}: GenerateQuestionsParams): Promise<AIResponse> {
  try {
    const prompt = `
Eres un experto reclutador de recursos humanos. Tu tarea es generar ${questionCount} preguntas específicas y relevantes para una entrevista de trabajo.

INFORMACIÓN DEL PUESTO:
- Posición: ${position}
- Descripción y requisitos: ${description}

INSTRUCCIONES:
1. Genera exactamente ${questionCount} preguntas específicas para esta posición
2. Las preguntas deben evaluar tanto habilidades técnicas como blandas
3. Adapta las preguntas al nivel y tipo de puesto descrito
4. Incluye preguntas situacionales y de experiencia
5. Haz preguntas que permitan al candidato demostrar su conocimiento y experiencia

FORMATO DE RESPUESTA:
Responde ÚNICAMENTE con las preguntas numeradas, una por línea:
1. [Primera pregunta]
2. [Segunda pregunta]
3. [Tercera pregunta]
...

No incluyas explicaciones adicionales, solo las preguntas numeradas.
`;

    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat-v3.1:free",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 1000,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No se recibió respuesta de la IA');
    }

    // Procesar la respuesta para extraer las preguntas
    const textQuestions = response
      .split('\n')
      .filter(line => line.trim() && /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(question => question.length > 0);

    if (textQuestions.length === 0) {
      throw new Error('No se pudieron extraer preguntas válidas de la respuesta');
    }

    // Asignar puntos y tiempo por pregunta (heurística simple)
    const questions: GeneratedQuestion[] = textQuestions.map((text) => ({
      text,
      points: 10, // puedes ajustar lógica según complejidad
      time: 120,  // 2 minutos por pregunta por defecto
    }));

    return { questions, success: true };

  } catch (error) {
    console.error('Error generando preguntas:', error);
    
    return {
      questions: [],
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Función de ejemplo para probar la conexión
 */
export async function testAIConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat-v3.1:free",
      messages: [
        {
          role: "user",
          content: "Responde con exactamente estas palabras: 'Conexión exitosa con OpenRouter'"
        }
      ],
      max_tokens: 50,
    });

    const response = completion.choices[0]?.message?.content;
    
    return {
      success: true,
      message: response || 'Respuesta vacía pero conexión exitosa'
    };

  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}

/**
 * Regenera preguntas específicas basándose en las existentes
 */
export async function regenerateSpecificQuestions({
  position,
  description,
  existingQuestions,
  indicesToRegenerate
}: {
  position: string;
  description: string;
  existingQuestions: Array<string | GeneratedQuestion>;
  indicesToRegenerate: number[];
}): Promise<AIResponse> {
  try {
    // Normalizar a texto
    const existingTexts = existingQuestions.map((q) => typeof q === 'string' ? q : q.text);
    const questionsToKeep = existingTexts
      .map((q, i) => !indicesToRegenerate.includes(i) ? `${i + 1}. ${q}` : null)
      .filter(Boolean)
      .join('\n');

    const prompt = `
Eres un experto reclutador. Necesito que regeneres ÚNICAMENTE las preguntas específicas para una entrevista de trabajo.

INFORMACIÓN DEL PUESTO:
- Posición: ${position}
- Descripción: ${description}

PREGUNTAS ACTUALES QUE SE MANTIENEN:
${questionsToKeep}

INSTRUCCIONES:
1. Genera ${indicesToRegenerate.length} nuevas preguntas para reemplazar las posiciones: ${indicesToRegenerate.map(i => i + 1).join(', ')}
2. Las nuevas preguntas deben ser diferentes a las existentes
3. Mantén el mismo nivel de calidad y relevancia
4. Enfócate en aspectos no cubiertos por las preguntas que se mantienen

FORMATO DE RESPUESTA:
Responde ÚNICAMENTE con las nuevas preguntas numeradas:
1. [Nueva pregunta 1]
2. [Nueva pregunta 2]
...

No incluyas explicaciones, solo las preguntas numeradas.
`;

    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-chat-v3.1:free",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 800,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No se recibió respuesta de la IA');
    }

    const textQuestions = response
      .split('\n')
      .filter(line => line.trim() && /^\d+\./.test(line.trim()))
      .map(line => line.replace(/^\d+\.\s*/, '').trim())
      .filter(question => question.length > 0);

    const newQuestions: GeneratedQuestion[] = textQuestions.map((text) => ({
      text,
      points: 10,
      time: 120,
    }));

    return { questions: newQuestions, success: true };

  } catch (error) {
    console.error('Error regenerando preguntas:', error);
    
    return {
      questions: [],
      success: false,
      error: error instanceof Error ? error.message : 'Error desconocido'
    };
  }
}
