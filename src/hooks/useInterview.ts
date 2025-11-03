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
    if (!isAuthenticated || !user?.id) {
      return false;
    }

    setIsLoadingQuestions(true);
    setQuestionsError(null);
    
    try {
      const url = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/interview/listInterviewPracticante?practicanteId=${user.id}`;
      
      const res = await getAuthFetch(url, {
        method: 'GET'
      });


      if (res.ok) {
        const data: PracticanteInterview = await res.json();
        
        // Guardar datos completos de la entrevista
        setCurrentInterviewData(data);
        
        // Extraer solo el texto de las preguntas
        const questions = data.questions.map(q => q.text);
        setApiQuestions(questions);
        return true;
      } else {
        const errorData: ApiErrorResponse = await res.json().catch(() => ({
          code: 'UNKNOWN_ERROR',
          message: 'Error desconocido al cargar preguntas',
          details: [],
          timestamp: new Date().toISOString()
        }));


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
      
      // Verificar si es el error específico de entrevista ya realizada
      const errorMessage = error instanceof Error ? error.message : '';
      if (errorMessage.includes('User already did the interview')) {
        setQuestionsError('INTERVIEW_ALREADY_COMPLETED');
      } else if (errorMessage.includes('no interview assigned')) {
        setQuestionsError('No tienes entrevistas asignadas');
      } else {
        setQuestionsError('Error de conexión');
      }
      return false;
    } finally {
      setIsLoadingQuestions(false);
    }
  }, [isAuthenticated, user?.id, getAuthFetch]);

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
      const questionsLoaded = await loadQuestionsFromAPI();
      
      if (!questionsLoaded || apiQuestions.length === 0) {
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
      
      mediaRecorder.start();
      startTimer();
      
      // Reproducir primera pregunta de la API
      setTimeout(() => {
        speakQuestion(apiQuestions[0]);
      }, 300);
      
      return true;
    } catch (error) {
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
      
    }
    
    // Subir directamente a Google Drive (evitar límite de Next) usando Access Token temporal
    if (currentInterviewData && user?.id) {
      try {
        // 1) Obtener Access Token temporal desde el servidor
        const tokenRes = await fetch('/api/drive/token');
        const tokenData = await tokenRes.json().catch(() => ({}));
        if (!tokenRes.ok || !tokenData?.access_token) {
          throw new Error(tokenData?.error || 'No se pudo obtener access token');
        }
        const accessToken: string = tokenData.access_token;

        // Helpers locales para Drive API
        const DRIVE_FILES_URL = 'https://www.googleapis.com/drive/v3/files';
        const DRIVE_UPLOAD_URL = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=resumable';
        const PARENT_ID = process.env.NEXT_PUBLIC_GOOGLE_DRIVE_PARENT_FOLDER_ID || '';

        const createFolder = async (name: string, parentId?: string): Promise<string> => {
          const metadata: any = { name, mimeType: 'application/vnd.google-apps.folder' };
          if (parentId) metadata.parents = [parentId];
          const initRes = await fetch(DRIVE_FILES_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(metadata),
          });
          const data = await initRes.json().catch(() => ({}));
          if (!initRes.ok || !data?.id) throw new Error('No se pudo crear carpeta');
          return data.id as string;
        };

        const uploadResumable = async (file: Blob, filename: string, parentId: string, mimeType: string): Promise<string> => {
          // 1) Iniciar sesión de subida
          const initRes = await fetch(DRIVE_UPLOAD_URL, {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': 'application/json; charset=UTF-8',
            },
            body: JSON.stringify({ name: filename, parents: [parentId] }),
          });
          if (!initRes.ok) {
            const t = await initRes.text().catch(() => '');
            throw new Error(t || 'No se pudo iniciar sesión de subida');
          }
          const uploadUrl = initRes.headers.get('Location');
          if (!uploadUrl) throw new Error('Upload URL no recibido');

          // 2) Subir contenido
          const putRes = await fetch(uploadUrl, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${accessToken}`,
              'Content-Type': mimeType,
            },
            body: file,
          });
          const putData = await putRes.json().catch(() => ({}));
          if (!putRes.ok || !putData?.id) {
            const t = await putRes.text().catch(() => '');
            throw new Error(t || 'Fallo al subir archivo');
          }
          return putData.id as string;
        };

        // 2) Asegurar estructura básica: /<ROOT or My Drive>/<userId>/{Audios, Video}
        const rootId = PARENT_ID || await createFolder('ENTREVISTAS');
        const userFolderId = await createFolder(String(user.id), rootId);
        const audiosFolderId = await createFolder('Audios', userFolderId);
        const videoFolderId = await createFolder('Video', userFolderId);

        // 3) Subir audios
        if (audioFiles && audioFiles.length > 0) {
          for (let i = 0; i < audioFiles.length; i++) {
            const audioBlob = audioFiles[i];
            const number = i + 1;
            const filename = `${number}.webm`;
            await uploadResumable(audioBlob, filename, audiosFolderId, 'audio/webm');
          }
        }

        // 4) Subir video (opcional)
        if (videoFile) {
          const videoFilename = `interview_video_${Date.now()}.webm`;
          await uploadResumable(videoFile, videoFilename, videoFolderId, 'video/webm');
        }
      } catch (error) {
        // Silenciado: manejar errores vía UI si es necesario
      }
    } else {
      // Sin datos mínimos para enviar
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
  }, [state.mediaRecorder, state.stream, stopTimer, stopSpeaking, currentInterviewData, user?.id, interviewStartTime]);

  // Cargar preguntas automáticamente al inicializar (solo una vez)
  useEffect(() => {
    if (isAuthenticated && user?.id && !isLoadingQuestions && !apiQuestions.length && !questionsError) {
      
      // Usar timeout para evitar llamadas duplicadas por React StrictMode
      const timeoutId = setTimeout(() => {
        // Verificar nuevamente las condiciones después del timeout
        if (isAuthenticated && user?.id && !isLoadingQuestions && !apiQuestions.length && !questionsError) {
          loadQuestionsFromAPI();
        }
      }, 100);
      
      // Cleanup del timeout
      return () => {
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
    setState(prev => ({ ...prev, isCompleted: true }));
  }, []);

  // Función para resetear el estado y permitir nueva entrevista
  const resetInterviewState = useCallback(() => {
    setState(prev => ({
      ...prev,
      isCompleted: false,
      currentQuestionIndex: 0,
      responseTimeLeft: 120,
      isRecording: false
    }));
    setQuestionsError(null);
  }, []);

  // Función para obtener el tiempo de la pregunta actual
  const getCurrentQuestionTime = useCallback((questionIndex: number): number => {
    if (!currentInterviewData?.questions || questionIndex >= currentInterviewData.questions.length) {
      return 120;
    }
    
    const questionTime = currentInterviewData.questions[questionIndex].time;
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
