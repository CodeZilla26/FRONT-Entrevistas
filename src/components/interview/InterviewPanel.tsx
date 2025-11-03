'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { Play, Square, Volume2 } from 'lucide-react';
import { useInterview } from '@/hooks/useInterview';
import { useAuth } from '@/context/AuthContext';

interface InterviewPanelProps {
  onShowToast: (message: string, type: 'success' | 'error' | 'info') => void;
  userId?: string;
  interviewId?: string;
}

export const InterviewPanel = ({ onShowToast, userId, interviewId }: InterviewPanelProps) => {
  const {
    questions,
    currentQuestionIndex,
    isRecording,
    isCompleted,
    stream,
    startInterview,
    nextQuestion,
    finishInterview,
    speakQuestion,
    isLoadingQuestions,
    questionsError,
    loadQuestionsFromAPI,
    currentInterviewData,
    markAsCompleted,
    resetInterviewState,
    getCurrentQuestionTime
  } = useInterview();
  const { user, getAuthFetch } = useAuth();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingStartRef = useRef<number | null>(null);
  const lastSavedIndexRef = useRef<number | null>(null);
  const interviewStartTimeRef = useRef<number | null>(null);
  const audioAnswersRef = useRef<Array<{ blob: Blob; index: number; questionText: string }>>([]);
  const [audioDownloadUrl, setAudioDownloadUrl] = useState<string | null>(null);
  const [audioFilename, setAudioFilename] = useState<string | null>(null);
  const [audioDurationSec, setAudioDurationSec] = useState<number>(0);
  const [currentQuestionTimeLimit, setCurrentQuestionTimeLimit] = useState(120);
  const [isFinishing, setIsFinishing] = useState(false);
  const [responseTimeLeft, setResponseTimeLeft] = useState(120);

  const videoRecorderRef = useRef<MediaRecorder | null>(null);
  const videoChunksRef = useRef<BlobPart[]>([]);
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [isAudioRecording, setIsAudioRecording] = useState(false);
  const [isVideoRecording, setIsVideoRecording] = useState(false);

  const stopCameraManually = () => {
    if (stream) {
      stream.getTracks().forEach(track => {
        track.stop();
      });
    }
    
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  

  const stopAudioRecordingManually = () => {
    if (mediaRecorderRef.current) {
      if (mediaRecorderRef.current.state === 'recording') {
        mediaRecorderRef.current.stop();
      }
      mediaRecorderRef.current = null;
    }
    
    setIsAudioRecording(false);
  };

  const stopVideoRecordingManually = () => {
    if (videoRecorderRef.current) {
      if (videoRecorderRef.current.state === 'recording') {
        videoRecorderRef.current.stop();
      }
      videoRecorderRef.current = null;
    }
    setIsVideoRecording(false);
  };

  
  const startAudioRecording = useCallback(() => {
    
    if (!stream) {
      return;
    }

    // Limpiar MediaRecorder anterior si existe
    if (mediaRecorderRef.current) {
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      } catch (e) {
      }
      mediaRecorderRef.current = null;
    }

    try {
      // Crear nuevo MediaRecorder solo para audio
      const audioTracks = stream.getAudioTracks();
      
      if (audioTracks.length === 0) {
        return;
      }

      // Crear stream solo con audio
      const audioStream = new MediaStream(audioTracks);
      const mediaRecorder = new MediaRecorder(audioStream, { 
        mimeType: 'audio/webm;codecs=opus' 
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      recordingStartRef.current = Date.now();

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
      };

      mediaRecorder.onstop = () => {
        
        // Actualizar estado para botones de control
        setIsAudioRecording(false);
      };

      mediaRecorder.onerror = (event) => {
      };

      mediaRecorder.start(1000); // Capturar chunks cada segundo
      
      // Actualizar estado para botones de control
      setIsAudioRecording(true);
    } catch (error) {
    }
  }, [stream]);

  // Función para detener y guardar respuesta con logs detallados
  const stopAndSaveCurrentAnswer = useCallback(async (qIndex: number) => {
    
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
      onShowToast(`No se capturó audio en la respuesta ${qIndex + 1}`, 'error');
      return;
    }

    try {
      const mr = mediaRecorderRef.current;
      
      // Solicitar último chunk antes de detener
      try { 
        mr.requestData?.(); 
      } catch (e) {
      }
      
      // Detener grabación y esperar
      await new Promise<void>((resolve) => {
        mr.onstop = () => {
          resolve();
        };
        mr.stop();
      });
      
      await new Promise(res => setTimeout(res, 100));
      
      const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      if (!blob || blob.size === 0) {
        onShowToast(`No se capturó audio en la respuesta ${qIndex + 1}`, 'error');
        return;
      }

      // Preparar datos para guardado
      const createdAt = new Date().toISOString();
      const questionText = questions[qIndex] || `Pregunta-${qIndex + 1}`;
      
      // Crear nombre de archivo basado en el texto de la pregunta
      const duration = recordingStartRef.current ? (Date.now() - recordingStartRef.current) / 1000 : 0;
      

      // Guardar en memoria para envío final (sin filename, el hook lo generará con ID)
      audioAnswersRef.current.push({ blob, index: qIndex, questionText });
      // Notificación desactivada al guardar respuesta

    } catch (e) {
      onShowToast('No se pudo guardar el audio de la respuesta', 'error');
    } finally {
      // Limpiar referencias
      mediaRecorderRef.current = null;
      audioChunksRef.current = [];
      recordingStartRef.current = null;
      lastSavedIndexRef.current = qIndex;
      setAudioDownloadUrl(null);
      setAudioFilename(null);
      setAudioDurationSec(0);
      
      // Reiniciar grabación de audio para la siguiente pregunta (solo si no es la última)
      setTimeout(() => {
        if (stream && isRecording && qIndex < questions.length - 1) {
          startAudioRecording();
        }
      }, 500);
    }
  }, [
    stream,
    isRecording,
    startAudioRecording,
    onShowToast,
    questions
  ]);

  // Wrapper estable para finalizar entrevista y evitar cambios de deps
  const handleFinishInterviewCb = useCallback(handleFinishInterview, [
    isFinishing,
    isSubmitting,
    isCompleted,
    currentQuestionIndex,
    stopAndSaveCurrentAnswer,
    stream,
    onShowToast,
    finishInterview,
    markAsCompleted
  ]);

  // Función para iniciar video con logs
  const startVideoRecording = useCallback(() => {
    
    if (!stream) {
      return;
    }

    try {
      const videoRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      videoRecorderRef.current = videoRecorder;
      videoChunksRef.current = [];

      videoRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      videoRecorder.onstart = () => {
        // Actualizar estado para botones de control
        setIsVideoRecording(true);
      };

      videoRecorder.onstop = () => {
        // Actualizar estado para botones de control
        setIsVideoRecording(false);
      };

      videoRecorder.start(1000); // Capturar chunks cada segundo
    } catch (error) {
    }
  }, [stream]);

  // Manejar inicio de entrevista
  const handleStartInterview = async () => {
    
    // Registrar tiempo de inicio de toda la entrevista
    interviewStartTimeRef.current = Date.now();
    
    const success = await startInterview();
    if (success) {
      // Notificación desactivada al iniciar entrevista
    } else {
      onShowToast('Error: No se pudo acceder a la cámara/micrófono. Verifica los permisos.', 'error');
    }
  };

  // Manejar siguiente pregunta
  const handleNextQuestion = useCallback(async () => {
    // PROTECCIÓN CONTRA DOBLE EJECUCIÓN
    if (isFinishing || isSubmitting || isCompleted) {
      return;
    }
    
    
    // Detener y guardar la respuesta actual
    await stopAndSaveCurrentAnswer(currentQuestionIndex);
    
    if (currentQuestionIndex === questions.length - 1) {
      await handleFinishInterviewCb();
    } else {
      nextQuestion();
      // Notificación desactivada al pasar de pregunta
      
      // Reproducir siguiente pregunta
      setTimeout(() => {
        speakQuestion(questions[currentQuestionIndex + 1]);
      }, 500);
    }
  }, [
    isFinishing,
    isSubmitting,
    isCompleted,
    currentQuestionIndex,
    questions,
    nextQuestion,
    speakQuestion,
    handleFinishInterviewCb,
    stopAndSaveCurrentAnswer
  ]);

  // Función para finalizar entrevista con logs detallados
  async function handleFinishInterview() {
    if (isFinishing || isSubmitting || isCompleted) {
      return;
    }

    
    // 1. DETENER CONTADOR INMEDIATAMENTE PARA EVITAR DOBLE ENVÍO
    setResponseTimeLeft(0); // Detener contador inmediatamente
    // 2. DETENER TODO INMEDIATAMENTE

    // Guardar último audio de la pregunta actual ANTES de detener todo
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording' && lastSavedIndexRef.current !== currentQuestionIndex) {
      try {
        await stopAndSaveCurrentAnswer(currentQuestionIndex);
      } catch (e) {
      }
    }

    // Detener grabación de audio si por algún motivo sigue activa
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop();
      setIsAudioRecording(false);
    } else {
    }

    // Detener grabación de video si está activa
    if (videoRecorderRef.current && videoRecorderRef.current.state === 'recording') {
      videoRecorderRef.current.stop();
      setIsVideoRecording(false);
    } else {
    }

    // Detener stream de cámara inmediatamente
    if (stream) {
      let tracksDetected = 0;
      stream.getTracks().forEach(track => {
        tracksDetected++;
        track.stop();
      });
      setIsCameraActive(false);
    } else {
    }
    
    // Limpiar video preview inmediatamente
    if (videoRef.current) {
      try { videoRef.current.pause(); } catch {}
      videoRef.current.srcObject = null;
    }
    

    // 2. MARCAR COMO COMPLETADA INMEDIATAMENTE (MOSTRAR PANEL DE FINALIZACIÓN)
    markAsCompleted();

    // 3. CONFIGURAR ESTADOS PARA EL ENVÍO
    setIsFinishing(true);
    setIsSubmitting(true);

    // 4. ESPERAR UN POCO PARA QUE SE DETENGAN LAS GRABACIONES
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      
      // Crear blob de video
      let videoBlob: Blob | null = null;
      if (videoChunksRef.current.length > 0) {
        videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
      }

      // Preparar audios ordenados
      const audioFiles = audioAnswersRef.current
        .sort((a: { blob: Blob; index: number; questionText: string }, b: { blob: Blob; index: number; questionText: string }) => a.index - b.index)
        .map((ans: { blob: Blob; index: number; questionText: string }) => ans.blob);

      // Usar la función del hook que ya tiene la lógica correcta con IDs
      await finishInterview(audioFiles, videoBlob || undefined);
      
      onShowToast('¡Entrevista finalizada y enviada!', 'success');
      
    } catch (err) {
      onShowToast('Error al finalizar entrevista', 'error');
    } finally {
      setIsFinishing(false);
      setIsSubmitting(false);
    }
  };

  // useEffect para actualizar el tiempo límite cuando cambia la pregunta
  useEffect(() => {
    if (isRecording && currentInterviewData) {
      const questionTime = getCurrentQuestionTime(currentQuestionIndex);
      setCurrentQuestionTimeLimit(questionTime);
      setResponseTimeLeft(questionTime);
    }
  }, [currentQuestionIndex, isRecording, currentInterviewData, getCurrentQuestionTime]);

  // useEffect para manejar temporizador de respuesta
  useEffect(() => {
    if (!isRecording || isCompleted) return; // AGREGAR: No ejecutar si ya completada

    const timer = setInterval(() => {
      setResponseTimeLeft(prev => {
        // PROTECCIÓN: No ejecutar si ya se está finalizando O si ya completada
        if (isFinishing || isSubmitting || isCompleted) {
          return prev; // Mantener el tiempo actual sin decrementar
        }
        
        if (prev <= 1) {
          // Tiempo agotado, avanzar automáticamente
          handleNextQuestion();
          // El tiempo se actualizará automáticamente por el useEffect de arriba
          return prev; // Mantener tiempo actual hasta que se actualice
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRecording, currentQuestionIndex, isFinishing, isSubmitting, isCompleted, handleNextQuestion]);

  // useEffect para limpiar recursos cuando la entrevista se completa
  useEffect(() => {
    if (isCompleted) {
      
      // Detener stream de cámara si existe
      if (stream) {
        stream.getTracks().forEach(track => {
          track.stop();
        });
      }
      
      // Limpiar video preview
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      
      // Limpiar MediaRecorders si existen
      if (mediaRecorderRef.current) {
        try {
          if (mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        } catch (e) {
        }
        mediaRecorderRef.current = null;
      }
      
      if (videoRecorderRef.current) {
        try {
          if (videoRecorderRef.current.state === 'recording') {
            videoRecorderRef.current.stop();
          }
        } catch (e) {
        }
        videoRecorderRef.current = null;
      }
      
    }
  }, [isCompleted, stream]);

  // ELIMINADO: useEffect duplicado - el tiempo dinámico se maneja arriba

  // useEffect para manejar stream de video
  useEffect(() => {
    if (stream && videoRef.current) {
      videoRef.current.srcObject = stream;
      try {
        const playPromise = (videoRef.current as any).play?.();
        if (playPromise && typeof playPromise.then === 'function') {
          playPromise.catch((err: any) => {
          });
        }
      } catch (e: any) {
      }
      
      // Actualizar estado de cámara
      setIsCameraActive(true);
      
      // Solo iniciar grabaciones al comenzar la entrevista (no en cada cambio)
      if (isRecording) {
        // Iniciar grabación de video (una sola vez por sesión)
        if (!videoRecorderRef.current) {
          startVideoRecording();
        }
        
        // Iniciar grabación de audio (se reinicia por pregunta)
        if (!mediaRecorderRef.current) {
          startAudioRecording();
        }
      }
    }
  }, [stream, isRecording, startAudioRecording, startVideoRecording]);

  // Resto del componente UI...
  
  // Pantalla especial cuando la entrevista ya fue completada anteriormente
  if (questionsError === 'INTERVIEW_ALREADY_COMPLETED') {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center">
        <div className="bg-slate-800/95 backdrop-blur-lg border border-red-600/30 shadow-2xl p-12 rounded-2xl w-full max-w-2xl text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-red-500 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4">
            Entrevista Ya Finalizada
          </h2>
          
          <p className="text-slate-300 text-lg mb-8 leading-relaxed">
            Ya has completado esta entrevista anteriormente. No puedes realizarla nuevamente.
          </p>
          
          <div className="bg-red-500/10 border border-red-400/20 rounded-lg p-4 mb-6">
            <p className="text-red-300 text-sm">
              Tu entrevista ha sido procesada exitosamente. Si necesitas más información, contacta al reclutador.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => loadQuestionsFromAPI()}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
            >
              Verificar Nuevamente
            </button>
            
            {/* Botón para testing - permitir nueva entrevista */}
            <button
              onClick={() => {
                resetInterviewState();
                onShowToast('Estado reseteado. Puedes hacer una nueva entrevista de prueba.', 'info');
              }}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors"
            >
              Nueva Entrevista (Testing)
            </button>
          </div>
        </div>
      </div>
    );
  }
  
  if (isCompleted) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center">
        <div className="bg-slate-800/95 backdrop-blur-lg border border-slate-600/30 shadow-2xl p-12 rounded-2xl w-full max-w-2xl text-center">
          <div className="mb-6">
            <div className="w-20 h-20 bg-green-400 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
          <h3 className="text-3xl font-bold text-slate-100 mb-4">¡Entrevista Completada!</h3>
          <p className="text-slate-300 text-lg mb-6">
            Has finalizado exitosamente tu proceso de entrevista. Nuestro equipo revisará tus respuestas y te contactaremos pronto con los resultados.
          </p>
          <div className="bg-slate-700 rounded-xl p-4 mb-6">
            <p className="text-slate-200 font-semibold">
              Estado: <span className="text-green-400">Entrevista Finalizada</span>
            </p>
            <p className="text-slate-300 text-sm mt-1">
              Fecha de completación: {new Date().toLocaleDateString()}
            </p>
          </div>
          <button 
            className="bg-gray-600 text-white font-semibold py-3 px-8 rounded-xl cursor-not-allowed opacity-75" 
            disabled
          >
            Entrevista Realizada
          </button>
        </div>
      </div>
    );
  }

  const safeQuestions = Array.isArray(questions) ? questions : [];

  // Mostrar estado de carga
  if (isLoadingQuestions) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 relative">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
        
        <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-600/30 shadow-2xl p-12 w-full max-w-2xl relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 to-purple-500"></div>
          
          <div className="mb-6 relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg border-2 border-white/20 hover:border-white/40 hover:shadow-xl hover:shadow-indigo-500/25 transition-all duration-300">
              <div className="animate-spin rounded-full h-10 w-10 border-3 border-white border-t-transparent"></div>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent relative z-10">
            🔍 Verificando Entrevistas
          </h2>
          
          <p className="text-slate-300 text-lg mb-8 leading-relaxed relative z-10">
            Estamos verificando si tienes entrevistas asignadas...
          </p>
          
          <div className="bg-gradient-to-r from-indigo-500/10 to-purple-500/10 backdrop-blur-sm border border-indigo-400/20 rounded-xl p-6 relative z-10">
            <div className="flex items-center justify-center mb-3">
              <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg border border-indigo-400/30">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
            <p className="text-indigo-300 text-sm text-center">
              💡 Este proceso puede tomar unos segundos mientras consultamos el servidor.
            </p>
            <div className="flex items-center justify-center mt-3">
              <div className="w-2 h-2 bg-indigo-400 rounded-full animate-pulse"></div>
              <span className="text-xs text-indigo-400 ml-2">Conectando...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error si hay
  if (questionsError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 relative">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
        
        <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-600/30 shadow-2xl p-12 w-full max-w-2xl relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-amber-500/5 via-transparent to-orange-500/5 pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-amber-500 to-orange-500"></div>
          
          <div className="mb-6 relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg border-2 border-white/20 hover:border-white/40 hover:shadow-xl hover:shadow-amber-500/25 transition-all duration-300">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-amber-400 to-orange-400 bg-clip-text text-transparent relative z-10">
            ⚠️ Sin Entrevista Asignada
          </h2>
          
          <p className="text-slate-300 text-lg mb-4 leading-relaxed relative z-10">
            {questionsError === 'Error de conexión' 
              ? 'No se pudo verificar si tienes entrevistas asignadas.' 
              : questionsError === 'No tienes entrevistas asignadas'
              ? 'Actualmente no tienes ninguna entrevista asignada.'
              : questionsError || 'No hay entrevistas disponibles en este momento.'
            }
          </p>
          
          <p className="text-slate-400 text-base mb-8 relative z-10">
            📞 Contacta al reclutador para que te asigne una entrevista.
          </p>
          
          <div className="bg-gradient-to-r from-amber-500/10 to-orange-500/10 backdrop-blur-sm border border-amber-400/20 rounded-xl p-6 mb-6 relative z-10">
            <div className="flex items-center justify-center mb-3">
              <div className="w-6 h-6 bg-gradient-to-br from-amber-500 to-orange-600 rounded-lg flex items-center justify-center shadow-lg border border-amber-400/30">
                <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z"/>
                </svg>
              </div>
            </div>
            <p className="text-amber-300 text-sm text-center">
              💡 El reclutador debe asignarte una entrevista antes de que puedas comenzar.
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center relative z-10">
            <button 
              onClick={loadQuestionsFromAPI}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white font-semibold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-indigo-500/25 border border-indigo-500/30 backdrop-blur-sm group"
            >
              <div className="flex items-center space-x-3">
                <div className="transition-all duration-200 group-hover:scale-110">
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clipRule="evenodd"/>
                  </svg>
                </div>
                <span>🔄 Verificar Nuevamente</span>
              </div>
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!safeQuestions.length) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center p-4 relative">
        {/* Decorative gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 via-transparent to-gray-500/5 pointer-events-none"></div>
        <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-white/5 to-transparent pointer-events-none"></div>
        
        <div className="bg-gradient-to-br from-slate-800/95 to-slate-900/95 backdrop-blur-xl rounded-2xl border border-slate-600/30 shadow-2xl p-12 w-full max-w-2xl relative overflow-hidden">
          {/* Decorative elements */}
          <div className="absolute inset-0 bg-gradient-to-br from-slate-500/5 via-transparent to-gray-500/5 pointer-events-none"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-slate-500 to-gray-500"></div>
          
          <div className="mb-6 relative z-10">
            <div className="w-20 h-20 bg-gradient-to-br from-slate-600 to-gray-700 rounded-xl flex items-center justify-center mx-auto mb-4 shadow-lg border-2 border-white/20 hover:border-white/40 hover:shadow-xl hover:shadow-slate-500/25 transition-all duration-300">
              <svg className="w-12 h-12 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
            </div>
          </div>
          
          <h2 className="text-3xl font-bold text-white mb-4 bg-gradient-to-r from-slate-400 to-gray-400 bg-clip-text text-transparent relative z-10">
            📋 Estado de Entrevista
          </h2>
          
          <div className="bg-gradient-to-r from-slate-500/10 to-gray-500/10 backdrop-blur-sm border border-slate-400/20 rounded-xl p-8 relative z-10">
            <div className="flex items-center justify-center mb-4">
              <div className="w-8 h-8 bg-gradient-to-br from-slate-600 to-gray-700 rounded-lg flex items-center justify-center shadow-lg border border-slate-400/30">
                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
                </svg>
              </div>
            </div>
            <h3 className="font-semibold text-xl text-slate-200 mb-3 text-center">
              📝 Sin Preguntas Disponibles
            </h3>
            <p className="text-sm text-slate-300 mb-2 text-center">
              No se encontraron preguntas para la entrevista.
            </p>
            <p className="text-sm text-slate-400 text-center">
              📞 Contacta al reclutador o vuelve más tarde.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-screen max-h-screen flex flex-col relative overflow-hidden">
      {/* Decorative gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
      
      {/* Compact Header - Fixed height */}
      <div className="flex items-center justify-between px-4 py-1.5 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-xl border-b border-slate-600/30 relative z-10 flex-shrink-0" style={{ height: '60px' }}>
        <div className="flex items-center space-x-3">
          <div className="w-7 h-7 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center shadow-lg border border-white/20">
            <svg className="w-3.5 h-3.5 text-white" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M18 3a1 1 0 00-1.447-.894L8.763 6H5a3 3 0 000 6h.28l1.771 5.316A1 1 0 008 18h1a1 1 0 001-1v-4.382l6.553 3.894A1 1 0 0018 16V3z" clipRule="evenodd"/>
            </svg>
          </div>
          <div>
            <h1 className="text-base font-bold text-slate-100 bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              🎬 Entrevista de Reclutamiento
            </h1>
          </div>
        </div>
        
        {/* Question Info */}
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-r from-indigo-500/20 to-purple-500/20 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-indigo-500/30">
            <span className="text-indigo-300 font-semibold text-xs">
              📋 {currentQuestionIndex + 1}/{safeQuestions.length}
            </span>
          </div>
          <div className="bg-gradient-to-r from-orange-500/20 to-red-500/20 backdrop-blur-sm px-2 py-0.5 rounded-lg border border-orange-500/30">
            <span className="text-orange-300 font-mono font-bold text-xs">
              ⏱️ {Math.floor(responseTimeLeft / 60)}:{(responseTimeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
        </div>
      </div>
      
      {/* Progress bar - Fixed height */}
      <div className="px-4 py-1 bg-gradient-to-r from-slate-800/60 to-slate-900/60 backdrop-blur-sm border-b border-slate-600/20 flex-shrink-0" style={{ height: '24px' }}>
        <div className="w-full bg-slate-700/50 rounded-full h-1 overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
            style={{ width: `${((currentQuestionIndex + 1) / safeQuestions.length) * 100}%` }}
          ></div>
        </div>
      </div>
      
      {/* Main Content - Calculated height: screen - header(60px) - progress(24px) */}
      <div className="flex flex-col lg:flex-row overflow-hidden" style={{ height: 'calc(100vh - 84px)' }}>
        {/* Large Video Section */}
        <div className="flex-1 flex flex-col p-1 overflow-hidden">
          {/* Question Text - Fixed height */}
          <div className="bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-lg p-2 mb-1 border border-slate-600/30 flex-shrink-0" style={{ minHeight: '48px' }}>
            <h3 className="text-sm font-semibold text-slate-100 leading-tight text-center">
              {safeQuestions[currentQuestionIndex]}
            </h3>
          </div>
          
          {/* Large Video - Flexible height */}
          <div className="flex-1 bg-gradient-to-r from-slate-800/80 to-slate-900/80 backdrop-blur-sm rounded-lg p-1 border border-slate-600/30 relative min-h-0 overflow-hidden">
            <div className="flex items-center justify-center mb-1">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                <span className="text-slate-300 text-xs font-medium">📹 Vista de Entrevista</span>
              </div>
            </div>
            
            <div className="relative w-full overflow-hidden" style={{ height: 'calc(100% - 20px)' }}>
              <video
                ref={videoRef}
                className="w-full h-full object-cover rounded-lg bg-gradient-to-br from-slate-700 to-slate-800 shadow-lg border border-slate-600/30"
                autoPlay
                muted
                playsInline
              />
              
              {/* Recording indicator */}
              {isRecording && (
                <div className="absolute top-1 right-1">
                  <div className="flex items-center space-x-1 bg-gradient-to-r from-red-500/90 to-red-600/90 backdrop-blur-sm text-white px-1.5 py-0.5 rounded-full text-xs font-bold shadow-lg border border-red-400/30">
                    <div className="w-1 h-1 bg-white rounded-full animate-pulse"></div>
                    <span>REC</span>
                  </div>
                </div>
              )}
              
              {/* Camera status overlay */}
              <div className="absolute bottom-1 left-1">
                <div className="bg-slate-800/90 backdrop-blur-sm px-1.5 py-0.5 rounded-lg border border-slate-600/30">
                  <div className="flex items-center space-x-1">
                    <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-green-300 text-xs font-medium">Cámara</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        
        {/* Compact Controls Sidebar */}
        <div className="lg:w-60 flex flex-col p-1 bg-gradient-to-b from-slate-800/40 to-slate-900/40 backdrop-blur-sm border-l border-slate-600/30 overflow-hidden">
          {/* Main Controls */}
          <div className="bg-gradient-to-r from-slate-700/60 to-slate-800/60 backdrop-blur-sm rounded-lg p-1.5 border border-slate-600/30 mb-1 flex-1 overflow-hidden">
            <div className="flex items-center justify-center mb-1.5">
              <div className="flex items-center space-x-1">
                <div className="w-1.5 h-1.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full"></div>
                <span className="text-slate-300 text-xs font-medium">🎮 Controles</span>
              </div>
            </div>
            
            <div className="space-y-1.5">
              {!isRecording ? (
                <button
                  onClick={handleStartInterview}
                  className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white font-semibold py-2 px-2.5 rounded-lg transition-all duration-300 flex items-center justify-center space-x-1.5 shadow-lg hover:shadow-green-500/25 hover:scale-105 border border-green-500/30 backdrop-blur-sm group"
                >
                  <div className="transition-all duration-200 group-hover:scale-110">
                    <Play className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-xs">🎬 Iniciar</span>
                </button>
              ) : (
                <div className="space-y-1.5">
                  <button
                    onClick={handleNextQuestion}
                    disabled={isSubmitting}
                    className={`w-full font-semibold py-2 px-2.5 rounded-lg transition-all duration-300 flex items-center justify-center space-x-1.5 shadow-lg border backdrop-blur-sm group ${
                      isSubmitting 
                        ? 'bg-gradient-to-r from-gray-600 to-gray-700 cursor-not-allowed border-gray-500/30' 
                        : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 hover:shadow-blue-500/25 hover:scale-105 border-blue-500/30'
                    } text-white`}
                  >
                    {isSubmitting ? (
                      <>
                        <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        <span className="text-xs">Enviando...</span>
                      </>
                    ) : (
                      <>
                        <div className="transition-all duration-200 group-hover:scale-110">
                          <Square className="w-3.5 h-3.5" />
                        </div>
                        <span className="text-xs">
                          {currentQuestionIndex === safeQuestions.length - 1 ? '✅ Finalizar' : '➡️ Siguiente'}
                        </span>
                      </>
                    )}
                  </button>
                  
                  <button
                    onClick={() => speakQuestion(safeQuestions[currentQuestionIndex])}
                    className="w-full bg-gradient-to-r from-purple-600 to-violet-600 hover:from-purple-700 hover:to-violet-700 text-white font-semibold py-2 px-2.5 rounded-lg transition-all duration-300 flex items-center justify-center space-x-1.5 shadow-lg hover:shadow-purple-500/25 hover:scale-105 border border-purple-500/30 backdrop-blur-sm group"
                  >
                    <div className="transition-all duration-200 group-hover:scale-110">
                      <Volume2 className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-xs">🔊 Repetir</span>
                  </button>
                </div>
              )}
            </div>
          </div>
          
          {/* Status - Fixed at bottom */}
          <div className="bg-gradient-to-r from-slate-700/60 to-slate-800/60 backdrop-blur-sm rounded-lg px-1.5 py-1 border border-slate-600/30 flex-shrink-0">
            {isRecording ? (
              <div className="flex flex-col items-center space-y-0.5">
                <div className="flex items-center space-x-1">
                  <div className="w-1 h-1 bg-red-500 rounded-full animate-pulse shadow-lg shadow-red-500/50"></div>
                  <span className="text-red-300 font-medium text-xs">🎤️ Grabando</span>
                </div>
                <div className="flex space-x-0.5">
                  <div className="w-0.5 h-0.5 bg-red-400 rounded-full animate-bounce"></div>
                  <div className="w-0.5 h-0.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                  <div className="w-0.5 h-0.5 bg-red-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-center space-x-1">
                <div className="w-1 h-1 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-slate-300 font-medium text-xs">💡 Listo</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
