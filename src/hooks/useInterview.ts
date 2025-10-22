import { useState, useRef, useCallback, useEffect } from 'react';
import { InterviewState, PracticanteInterview, ApiErrorResponse } from '@/types';
import { useAuth } from '@/context/AuthContext';

export const useInterview = () => {
  const { getAuthFetch, isAuthenticated, user } = useAuth();
  
  const [state, setState] = useState<InterviewState>({
    currentQuestionIndex: 0,
    responseTimeLeft: 120,
    isRecording: false,
    isCompleted: false,
    mediaRecorder: null,
    stream: null,
    currentUtterance: null,
  });

  const [apiQuestions, setApiQuestions] = useState<string[]>([]);
  const [isLoadingQuestions, setIsLoadingQuestions] = useState(false);
  const [questionsError, setQuestionsError] = useState<string | null>(null);
  const [currentInterviewData, setCurrentInterviewData] = useState<PracticanteInterview | null>(null);
  const [interviewStartTime, setInterviewStartTime] = useState<number | null>(null);
  const [totalDurationMinutes, setTotalDurationMinutes] = useState<number>(0);

  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Función para cargar preguntas desde la API
  const loadQuestionsFromAPI = useCallback(async (): Promise<boolean> => {
    console.log('[useInterview] === INICIANDO CARGA DE PREGUNTAS ===');
    console.log('[useInterview] Estado inicial:', {
      isAuthenticated,
      userId: user?.id,
      userEmail: user?.email
    });

    if (!isAuthenticated || !user?.id) {
      console.log('[useInterview] Usuario no autenticado o sin ID');
      return false;
    }

    setIsLoadingQuestions(true);
    setQuestionsError(null);
    console.log('[useInterview] Cargando preguntas desde API...');
    console.log('[useInterview] Cargando preguntas para practicante:', user.id);
    
    try {
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/interview/listInterviewPracticante?practicanteId=${user.id}`;
      console.log('[useInterview] URL:', url);
      
      const res = await getAuthFetch(url, {
        method: 'GET'
      });

      console.log('[useInterview] Respuesta status:', res.status);
      console.log('[useInterview] Respuesta ok:', res.ok);
      console.log('[useInterview] Respuesta statusText:', res.statusText);

      if (res.ok) {
        const data: PracticanteInterview = await res.json();
        console.log('[useInterview] Datos recibidos:', data);
        
        // Guardar datos completos de la entrevista
        setCurrentInterviewData(data);
        
        // Extraer solo el texto de las preguntas
        const questions = data.questions.map(q => q.text);
        setApiQuestions(questions);
        console.log('[useInterview] Preguntas cargadas:', questions);
        console.log('[useInterview] Tiempos por pregunta:', data.questions.map(q => `${q.text.substring(0, 50)}... → ${q.time}s`));
        console.log('[useInterview] Interview ID guardado:', data.id);
        return true;
      } else {
        const errorData: ApiErrorResponse = await res.json().catch(() => ({
          code: 'UNKNOWN_ERROR',
          message: 'Error desconocido al cargar preguntas',
          details: [],
          timestamp: new Date().toISOString()
        }));

        console.error('[useInterview] Error del servidor:', {
          status: res.status,
          statusText: res.statusText,
          errorData,
          url
        });

        console.log('[useInterview] DEBUG - Analizando error:', {
          status: res.status,
          message: errorData.message,
          includesAlreadyDid: errorData.message?.includes('already did the interview'),
          fullErrorData: errorData
        });

        let errorMessage = 'Error al cargar preguntas';
        
        switch (res.status) {
          case 400:
            // Usuario ya completó la entrevista o no tiene entrevista asignada
            if (errorData.message?.includes('already did the interview')) {
              errorMessage = 'INTERVIEW_ALREADY_COMPLETED';
            } else if (errorData.message?.includes('no interview assigned')) {
              errorMessage = 'No tienes entrevistas asignadas';
            } else {
              errorMessage = errorData.message || 'No tienes entrevistas asignadas';
            }
            break;
          case 404:
            errorMessage = 'No tienes entrevistas asignadas';
            break;
          case 401:
            errorMessage = 'No autorizado';
            break;
          case 403:
            errorMessage = 'Sin permisos';
            break;
          default:
            errorMessage = errorData.message || 'No tienes entrevistas asignadas';
        }

        setQuestionsError(errorMessage);
        return false;
      }
    } catch (error) {
      console.error('[useInterview] Error de red:', error);
      console.log('[useInterview] DEBUG - Error capturado en catch:', {
        errorType: typeof error,
        errorMessage: error instanceof Error ? error.message : 'Unknown error',
        errorStack: error instanceof Error ? error.stack : 'No stack',
        fullError: error
      });
      
      // Verificar si es el error específico de entrevista ya realizada
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('User already did the interview')) {
        console.log('[useInterview] ✅ Detectado: Usuario ya completó la entrevista');
        setQuestionsError('INTERVIEW_ALREADY_COMPLETED');
      } else if (errorMessage.includes('no interview assigned')) {
        console.log('[useInterview] ✅ Detectado: Usuario no tiene entrevista asignada');
        setQuestionsError('No tienes entrevistas asignadas');
      } else {
        console.log('[useInterview] ❌ Error de conexión real');
        setQuestionsError('Error de conexión');
      }
      return false;
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [isAuthenticated, user?.id, user?.email, getAuthFetch]);

  const startTimer = useCallback(() => {
    setState(prev => ({ ...prev, responseTimeLeft: 120 }));
    
    timerRef.current = setInterval(() => {
      setState(prev => {
        const newTimeLeft = prev.responseTimeLeft - 1;
        if (newTimeLeft <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          return { ...prev, responseTimeLeft: 0 };
        }
        return { ...prev, responseTimeLeft: newTimeLeft };
      });
    }, 1000);
  }, []);

  const stopTimer = useCallback(() => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const speakQuestion = useCallback((questionText: string) => {
    if (typeof window === 'undefined') return;
    
    // Verificar si ya hay una síntesis en progreso
    if (window.speechSynthesis.speaking || window.speechSynthesis.pending) {
      return;
    }
    
    try {
      const utterance = new SpeechSynthesisUtterance(questionText);
      
      // Configurar voz en español si está disponible
      const voices = window.speechSynthesis.getVoices();
      const spanishVoice = voices.find(voice => 
        voice.lang.includes('es') || voice.name.includes('Spanish')
      );
      if (spanishVoice) {
        utterance.voice = spanishVoice;
      }
      
      utterance.rate = 0.9;
      utterance.pitch = 1.0;
      utterance.volume = 0.8;
      
      utterance.onend = () => {
        setState(prev => ({ ...prev, currentUtterance: null }));
      };
      
      utterance.onerror = () => {
        setState(prev => ({ ...prev, currentUtterance: null }));
      };
      
      setState(prev => ({ ...prev, currentUtterance: utterance }));
      window.speechSynthesis.speak(utterance);
      
    } catch (error) {
      console.error('Error al crear síntesis de voz:', error);
    }
  }, []);

  const stopSpeaking = useCallback(() => {
    if (typeof window === 'undefined') return;
    
    window.speechSynthesis.cancel();
    setState(prev => ({ ...prev, currentUtterance: null }));
  }, []);

  const nextQuestion = useCallback(() => {
    stopSpeaking();
    stopTimer();
    
    const nextIndex = state.currentQuestionIndex + 1;
    
    if (nextIndex >= apiQuestions.length) {
      setState(prev => ({ ...prev, isCompleted: true }));
      return;
    }
    
    setState(prev => ({ 
      ...prev, 
      currentQuestionIndex: nextIndex,
      responseTimeLeft: 120 
    }));
    
    startTimer();
    
    // Reproducir nueva pregunta después de un breve delay
    setTimeout(() => {
      speakQuestion(apiQuestions[nextIndex]);
    }, 200);
  }, [state.currentQuestionIndex, speakQuestion, stopSpeaking, stopTimer, startTimer, apiQuestions]);

  const startInterview = useCallback(async () => {
    try {
      // Primero cargar preguntas de la API
      console.log('[useInterview] Cargando preguntas antes de iniciar entrevista...');
      const questionsLoaded = await loadQuestionsFromAPI();
      
      if (!questionsLoaded || apiQuestions.length === 0) {
        console.error('[useInterview] No se pudieron cargar preguntas de la API');
        return false;
      }

      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: true 
      });
      
      const mediaRecorder = new MediaRecorder(stream);
      
      setState(prev => ({ 
        ...prev, 
        stream, 
        mediaRecorder, 
        isRecording: true 
      }));
      
      // Iniciar tracking de tiempo total de la entrevista
      const startTime = Date.now();
      setInterviewStartTime(startTime);
      console.log('[useInterview] Entrevista iniciada a las:', new Date(startTime).toLocaleTimeString());
      
      mediaRecorder.start();
      startTimer();
      
      // Reproducir primera pregunta de la API
      setTimeout(() => {
        speakQuestion(apiQuestions[0]);
      }, 300);
      
      return true;
    } catch (error) {
      console.error('Error al acceder a medios:', error);
      return false;
    }
  }, [startTimer, speakQuestion, loadQuestionsFromAPI, apiQuestions]);

  const finishInterview = useCallback(async (audioFiles?: Blob[], videoFile?: Blob) => {
    stopTimer();
    stopSpeaking();
    
    if (state.mediaRecorder && state.mediaRecorder.state === 'recording') {
      state.mediaRecorder.stop();
    }
    
    if (state.stream) {
      state.stream.getTracks().forEach(track => track.stop());
    }
    
    // Calcular duración total de la entrevista
    let durationMinutes = 0;
    if (interviewStartTime) {
      const endTime = Date.now();
      const durationMs = endTime - interviewStartTime;
      durationMinutes = Math.round(durationMs / (1000 * 60)); // Convertir a minutos
      setTotalDurationMinutes(durationMinutes);
      
      console.log('[finishInterview] Duración total calculada:', {
        startTime: new Date(interviewStartTime).toLocaleTimeString(),
        endTime: new Date(endTime).toLocaleTimeString(),
        durationMs,
        durationMinutes
      });
    }
    
    // Enviar datos a la API de finish interview
    if (currentInterviewData && user?.id) {
      try {
        console.log('[finishInterview] Enviando datos a la API...');
        console.log('[finishInterview] userId:', user.id);
        console.log('[finishInterview] interviewId:', currentInterviewData.id);
        console.log('[finishInterview] durationMinutes:', durationMinutes);
        console.log('[finishInterview] audioFiles:', audioFiles?.length || 0);
        console.log('[finishInterview] videoFile:', !!videoFile);

        const formData = new FormData();
        formData.append('userId', user.id);
        formData.append('interviewId', currentInterviewData.id);
        formData.append('durationMinutes', durationMinutes.toString());
        
        // Agregar archivos de audio como array usando IDs de preguntas
        if (audioFiles && audioFiles.length > 0) {
          console.log('[finishInterview] DEBUG - Preguntas disponibles:', currentInterviewData?.questions?.map(q => ({ id: q.id, text: q.text.substring(0, 30) + '...' })));
          
          audioFiles.forEach((audioBlob, index) => {
            // Usar el ID de la pregunta si está disponible, sino usar índice como fallback
            const question = currentInterviewData?.questions?.[index];
            const questionId = question?.id || `question_${index}`;
            
            console.log(`[finishInterview] DEBUG - Pregunta ${index}:`, {
              questionObject: question,
              extractedId: question?.id,
              finalQuestionId: questionId,
              questionText: question?.text?.substring(0, 50) + '...'
            });
            
            formData.append('audios', audioBlob, `${questionId}.webm`);
            console.log(`[finishInterview] Audio ${index} nombrado como: ${questionId}.webm`);
          });
        }
        
        // Agregar archivo de video como string (nombre del archivo)
        if (videoFile) {
          const videoFilename = `interview_video_${currentInterviewData.id}_${Date.now()}.webm`;
          formData.append('video', videoFile, videoFilename);
        }

        const response = await getAuthFetch('/api/userinterview/finishInterview', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          console.log('[finishInterview] Entrevista enviada exitosamente');
        } else {
          console.error('[finishInterview] Error enviando entrevista:', response.status);
        }
      } catch (error) {
        console.error('[finishInterview] Error de red:', error);
      }
    } else {
      console.warn('[finishInterview] Faltan datos para enviar:', {
        hasInterviewData: !!currentInterviewData,
        hasUserId: !!user?.id
      });
    }
    
    setState(prev => ({ 
      ...prev, 
      isCompleted: true, 
      isRecording: false,
      mediaRecorder: null,
      stream: null 
    }));
    
    // ❌ ELIMINADO: No guardar en localStorage para que no persista al refrescar
    // DataManager.saveData('interviewCompleted', true);
    console.log('[finishInterview] ✅ Entrevista completada - NO se guarda en localStorage (se resetea al refrescar)');
  }, [state.mediaRecorder, state.stream, stopTimer, stopSpeaking, currentInterviewData, user?.id, interviewStartTime, getAuthFetch]);

  // Cargar preguntas automáticamente al inicializar (solo una vez)
  useEffect(() => {
    if (isAuthenticated && user?.id && !isLoadingQuestions && !apiQuestions.length && !questionsError) {
      console.log('[useInterview] Usuario autenticado detectado, cargando preguntas automáticamente...');
      console.log('[useInterview] 🔍 Verificando condiciones:', {
        isAuthenticated,
        hasUserId: !!user?.id,
        isLoading: isLoadingQuestions,
        hasQuestions: apiQuestions.length > 0,
        hasError: !!questionsError
      });
      
      // Usar timeout para evitar llamadas duplicadas por React StrictMode
      const timeoutId = setTimeout(() => {
        // Verificar nuevamente las condiciones después del timeout
        if (isAuthenticated && user?.id && !isLoadingQuestions && !apiQuestions.length && !questionsError) {
          console.log('[useInterview] 🚀 Ejecutando carga de preguntas después de timeout...');
          loadQuestionsFromAPI();
        } else {
          console.log('[useInterview] ⏭️ Saltando carga - condiciones cambiaron durante timeout');
        }
      }, 100);
      
      // Cleanup del timeout
      return () => {
        console.log('[useInterview] 🧹 Limpiando timeout de carga de preguntas');
        clearTimeout(timeoutId);
      };
    }
  }, [isAuthenticated, user?.id, isLoadingQuestions, apiQuestions.length, questionsError, loadQuestionsFromAPI]);

  // ❌ ELIMINADO: No cargar estado completado desde localStorage
  // useEffect(() => {
  //   const isCompleted = DataManager.loadData('interviewCompleted', false);
  //   if (isCompleted) {
  //     setState(prev => ({ ...prev, isCompleted: true }));
  //   }
  // }, []);

  // Función para marcar entrevista como completada
  const markAsCompleted = useCallback(() => {
    console.log('[useInterview] Marcando entrevista como completada...');
    setState(prev => ({ ...prev, isCompleted: true }));
    console.log('[useInterview] ✅ Entrevista completada - NO se guarda en localStorage (se resetea al refrescar)');
  }, []);

  // Función para resetear el estado y permitir nueva entrevista
  const resetInterviewState = useCallback(() => {
    console.log('[useInterview] 🔄 Reseteando estado para nueva entrevista...');
    setState(prev => ({
      ...prev,
      isCompleted: false,
      currentQuestionIndex: 0,
      responseTimeLeft: 120,
      isRecording: false
    }));
    setQuestionsError(null);
    console.log('[useInterview] ✅ Estado reseteado - listo para nueva entrevista');
  }, []);

  // Función para obtener el tiempo de la pregunta actual
  const getCurrentQuestionTime = useCallback((questionIndex: number): number => {
    if (!currentInterviewData?.questions || questionIndex >= currentInterviewData.questions.length) {
      console.log(`[useInterview] ⏰ Pregunta ${questionIndex} no encontrada, usando tiempo por defecto: ${120}s`);
      return 120;
    }
    
    const questionTime = currentInterviewData.questions[questionIndex].time;
    console.log(`[useInterview] ⏰ Tiempo para pregunta ${questionIndex}: ${questionTime}s`);
    return questionTime;
  }, [currentInterviewData]);

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      stopTimer();
      stopSpeaking();
    };
  }, [stopTimer, stopSpeaking]);

  return {
    ...state,
    questions: apiQuestions,
    currentInterviewData,
    totalDurationMinutes,
    isLoadingQuestions,
    questionsError,
    loadQuestionsFromAPI,
    startInterview,
    nextQuestion,
    finishInterview,
    speakQuestion,
    stopSpeaking,
    startTimer,
    stopTimer,
    markAsCompleted,
    resetInterviewState,
    getCurrentQuestionTime,
  };
};
