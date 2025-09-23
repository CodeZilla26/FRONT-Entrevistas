// Ejemplo simple para probar la conexión con OpenAI/OpenRouter
import { testAIConnection, generateInterviewQuestions } from './src/lib/openai.js';

async function testConnection() {
  console.log('🔄 Probando conexión con OpenRouter...\n');
  
  const result = await testAIConnection();
  
  if (result.success) {
    console.log('✅ Conexión exitosa!');
    console.log('📝 Respuesta:', result.message);
  } else {
    console.log('❌ Error de conexión:', result.message);
    return;
  }
  
  console.log('\n' + '='.repeat(50) + '\n');
  
  // Probar generación de preguntas
  console.log('🧠 Generando preguntas de entrevista...\n');
  
  const questionsResult = await generateInterviewQuestions({
    position: 'Desarrollador Frontend React',
    description: 'Buscamos un desarrollador con experiencia en React, TypeScript, Next.js y Tailwind CSS. Debe tener conocimientos en APIs REST, manejo de estado con hooks, y experiencia trabajando en equipos ágiles.',
    questionCount: 3
  });
  
  if (questionsResult.success) {
    console.log('✅ Preguntas generadas exitosamente:\n');
    questionsResult.questions.forEach((question, index) => {
      console.log(`${index + 1}. ${question}\n`);
    });
  } else {
    console.log('❌ Error generando preguntas:', questionsResult.error);
  }
}

// Ejecutar el test
testConnection().catch(console.error);
