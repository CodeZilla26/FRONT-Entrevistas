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
  questionCount = 10
}: GenerateQuestionsParams): Promise<AIResponse> {
  try {
    const prompt = `Genera ${questionCount} preguntas de entrevista para:
Posición: ${position}
Descripción: ${description}

Formato JSON requerido:
{
  "questions": [
    {
      "text": "pregunta aquí",
      "time": 3,
      "points": 10
    }
  ]
}

Tiempo: 2-8 minutos por pregunta
Puntos: 5-20 según complejidad
Responde SOLO con JSON válido:`;

    const completion = await openai.chat.completions.create({
      model: "google/gemma-2-9b-it:free",
      messages: [
        {
          role: "system",
          content: "Eres un generador de preguntas de entrevista. SIEMPRE respondes únicamente con JSON válido, sin texto adicional, explicaciones o comentarios. Tu respuesta debe empezar con { y terminar con }."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1500,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No se recibió respuesta de la IA');
    }

    // Procesar la respuesta JSON
    let parsedResponse;
    try {
      // Limpiar la respuesta por si tiene texto extra
      let cleanResponse = response.trim();
      
      // Buscar JSON en la respuesta
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      } else {
        // Si no encuentra JSON, intentar extraer desde el primer {
        const startIndex = cleanResponse.indexOf('{');
        const endIndex = cleanResponse.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
          cleanResponse = cleanResponse.substring(startIndex, endIndex + 1);
        }
      }
      
      parsedResponse = JSON.parse(cleanResponse);
    } catch (error) {
      console.error('Error parsing JSON:', error);
      console.error('Respuesta completa de la IA:', response);
      throw new Error('La IA no devolvió un JSON válido. Respuesta: ' + response.substring(0, 300));
    }

    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new Error('La respuesta no contiene un array de preguntas válido');
    }

    // Validar y mapear las preguntas
    const questions: GeneratedQuestion[] = parsedResponse.questions.map((q: any, index: number) => {
      if (!q.text || typeof q.text !== 'string') {
        throw new Error(`Pregunta ${index + 1} no tiene texto válido`);
      }
      if (!q.time || typeof q.time !== 'number' || q.time < 1 || q.time > 10) {
        throw new Error(`Pregunta ${index + 1} no tiene tiempo válido (debe ser 1-10 minutos)`);
      }
      if (!q.points || typeof q.points !== 'number' || q.points < 1 || q.points > 25) {
        throw new Error(`Pregunta ${index + 1} no tiene puntos válidos (debe ser 1-25 puntos)`);
      }

      return {
        text: q.text.trim(),
        time: Math.round(q.time * 60), // Convertir minutos a segundos
        points: Math.round(q.points)
      };
    });

    if (questions.length === 0) {
      throw new Error('No se generaron preguntas válidas');
    }

    return { questions, success: true };

  } catch (error) {
    console.error('Error generando preguntas:', error);
    
    // Fallback: generar preguntas básicas si la IA falla
    const fallbackQuestions: GeneratedQuestion[] = Array.from({ length: Math.min(questionCount, 5) }, (_, i) => ({
      text: `Pregunta ${i + 1} para ${position}: Describe tu experiencia relevante para esta posición.`,
      time: 180, // 3 minutos
      points: 10
    }));
    
    return {
      questions: fallbackQuestions,
      success: false,
      error: `Error de IA (usando preguntas de respaldo): ${error instanceof Error ? error.message : 'Error desconocido'}`
    };
  }
}

/**
 * Función de ejemplo para probar la conexión
 */
export async function testAIConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const completion = await openai.chat.completions.create({
      model: "google/gemma-2-9b-it:free",
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
    console.log('[REGENERATE DEBUG] Datos recibidos:', {
      position,
      description: description.substring(0, 100),
      existingQuestions: existingQuestions.length,
      indicesToRegenerate
    });

    // Normalizar a objetos GeneratedQuestion
    const existingObjs = existingQuestions.map((q) => 
      typeof q === 'string' 
        ? { text: q, points: 10, time: 180 } // Valores por defecto si es string
        : q
    );

    console.log('[REGENERATE DEBUG] Objetos normalizados:', existingObjs.map(q => ({ 
      text: q.text.substring(0, 50), 
      points: q.points, 
      time: q.time 
    })));
    
    const questionsToKeep = existingObjs
      .map((q, i) => !indicesToRegenerate.includes(i) ? `${i + 1}. ${q.text} (${q.points} pts, ${Math.round(q.time / 60)} min)` : null)
      .filter(Boolean)
      .join('\n');

    const prompt = `Regenera ${indicesToRegenerate.length} preguntas diferentes para:
Posición: ${position}
Descripción: ${description}

Preguntas existentes que se mantienen:
${questionsToKeep}

Genera ${indicesToRegenerate.length} preguntas nuevas y diferentes.

Formato JSON requerido:
{
  "questions": [
    {
      "text": "nueva pregunta aquí",
      "time": 4,
      "points": 12
    }
  ]
}

Tiempo: 2-8 minutos, Puntos: 5-20
Responde SOLO con JSON válido:`;

    const completion = await openai.chat.completions.create({
      model: "google/gemma-2-9b-it:free",
      messages: [
        {
          role: "system",
          content: "Eres un generador de preguntas de entrevista. SIEMPRE respondes únicamente con JSON válido, sin texto adicional, explicaciones o comentarios. Tu respuesta debe empezar con { y terminar con }."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.3,
      max_tokens: 1200,
    });

    const response = completion.choices[0]?.message?.content;
    
    if (!response) {
      throw new Error('No se recibió respuesta de la IA');
    }

    console.log('[REGENERATE DEBUG] Respuesta de la IA:', response.substring(0, 500));

    // Procesar la respuesta JSON
    let parsedResponse;
    try {
      // Limpiar la respuesta por si tiene texto extra
      let cleanResponse = response.trim();
      
      // Buscar JSON en la respuesta
      const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
      if (jsonMatch) {
        cleanResponse = jsonMatch[0];
      } else {
        // Si no encuentra JSON, intentar extraer desde el primer {
        const startIndex = cleanResponse.indexOf('{');
        const endIndex = cleanResponse.lastIndexOf('}');
        if (startIndex !== -1 && endIndex !== -1 && endIndex > startIndex) {
          cleanResponse = cleanResponse.substring(startIndex, endIndex + 1);
        }
      }
      
      parsedResponse = JSON.parse(cleanResponse);
    } catch (error) {
      console.error('Error parsing JSON en regeneración:', error);
      console.error('Respuesta completa de la IA:', response);
      throw new Error('La IA no devolvió un JSON válido para regeneración. Respuesta: ' + response.substring(0, 300));
    }

    if (!parsedResponse.questions || !Array.isArray(parsedResponse.questions)) {
      throw new Error('La respuesta de regeneración no contiene un array de preguntas válido');
    }

    if (parsedResponse.questions.length !== indicesToRegenerate.length) {
      throw new Error(`Se esperaban ${indicesToRegenerate.length} preguntas, pero se recibieron ${parsedResponse.questions.length}`);
    }

    // Validar y mapear las preguntas regeneradas
    const newQuestions: GeneratedQuestion[] = parsedResponse.questions.map((q: any, index: number) => {
      if (!q.text || typeof q.text !== 'string') {
        throw new Error(`Pregunta regenerada ${index + 1} no tiene texto válido`);
      }
      if (!q.time || typeof q.time !== 'number' || q.time < 1 || q.time > 10) {
        throw new Error(`Pregunta regenerada ${index + 1} no tiene tiempo válido (debe ser 1-10 minutos)`);
      }
      if (!q.points || typeof q.points !== 'number' || q.points < 1 || q.points > 25) {
        throw new Error(`Pregunta regenerada ${index + 1} no tiene puntos válidos (debe ser 1-25 puntos)`);
      }

      return {
        text: q.text.trim(),
        time: Math.round(q.time * 60), // Convertir minutos a segundos
        points: Math.round(q.points)
      };
    });

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
