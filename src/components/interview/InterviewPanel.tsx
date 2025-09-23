'use client';

import { useState, useRef, useEffect } from 'react';
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
  const { user, getAuthHeader, getAuthFetch } = useAuth();

  const videoRef = useRef<HTMLVideoElement>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<BlobPart[]>([]);
  const recordingStartRef = useRef<number | null>(null);
  const lastSavedIndexRef = useRef<number | null>(null);
  const interviewStartTimeRef = useRef<number | null>(null);
  const audioAnswersRef = useRef<Array<{ blob: Blob; filename: string; index: number; questionText: string }>>([]);
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

  
  const startAudioRecording = () => {
    
    if (!stream) {
      console.error(`[AUDIO DEBUG] ❌ No hay stream disponible para grabación`);
      return;
    }

    // Limpiar MediaRecorder anterior si existe
    if (mediaRecorderRef.current) {
      console.log(`[AUDIO DEBUG] 🧹 Limpiando MediaRecorder anterior`);
      try {
        if (mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
      } catch (e) {
        console.log(`[AUDIO DEBUG] Error limpiando MediaRecorder anterior:`, e);
      }
      mediaRecorderRef.current = null;
    }

    try {
      // Crear nuevo MediaRecorder solo para audio
      const audioTracks = stream.getAudioTracks();
      console.log(`[AUDIO DEBUG] Audio tracks disponibles:`, audioTracks.length);
      
      if (audioTracks.length === 0) {
        console.error(`[AUDIO DEBUG] ❌ No hay tracks de audio en el stream`);
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
        console.log(`[AUDIO DEBUG] 📊 Chunk recibido:`, {
          size: event.data.size,
          type: event.data.type,
          totalChunks: audioChunksRef.current.length + 1
        });
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstart = () => {
        console.log(`[AUDIO DEBUG] ✅ Grabación de audio iniciada`);
      };

      mediaRecorder.onstop = () => {
        console.log(`[AUDIO DEBUG] ⏹️ Grabación de audio detenida`);
        console.log(`[AUDIO DEBUG] Total chunks capturados:`, audioChunksRef.current.length);
        
        // Actualizar estado para botones de control
        setIsAudioRecording(false);
        console.log(`[AUDIO DEBUG] 🟢 Estado actualizado: NO GRABANDO AUDIO`);
      };

      mediaRecorder.onerror = (event) => {
        console.error(`[AUDIO DEBUG] ❌ Error en MediaRecorder:`, event);
      };

      mediaRecorder.start(1000); // Capturar chunks cada segundo
      console.log(`[AUDIO DEBUG] MediaRecorder.start() ejecutado con stream de audio separado`);
      
      // Actualizar estado para botones de control
      setIsAudioRecording(true);
      console.log(`[AUDIO DEBUG] 🔴 Estado actualizado: GRABANDO AUDIO`);
    } catch (error) {
      console.error(`[AUDIO DEBUG] ❌ Error iniciando grabación:`, error);
    }
  };

  // Función para detener y guardar respuesta con logs detallados
  const stopAndSaveCurrentAnswer = async (qIndex: number) => {
    console.log(`[AUDIO DEBUG] === GUARDANDO RESPUESTA PREGUNTA ${qIndex + 1} ===`);
    console.log(`[AUDIO DEBUG] Estado MediaRecorder:`, mediaRecorderRef.current?.state);
    console.log(`[AUDIO DEBUG] Chunks disponibles:`, audioChunksRef.current.length);
    console.log(`[AUDIO DEBUG] Duración grabación:`, recordingStartRef.current ? Date.now() - recordingStartRef.current : 'N/A', 'ms');
    
    if (!mediaRecorderRef.current || mediaRecorderRef.current.state !== 'recording') {
      console.warn(`[AUDIO DEBUG] ❌ No hay grabación activa para pregunta ${qIndex + 1}`);
      console.warn(`[AUDIO DEBUG] MediaRecorder existe:`, !!mediaRecorderRef.current);
      console.warn(`[AUDIO DEBUG] Estado actual:`, mediaRecorderRef.current?.state);
      onShowToast(`No se capturó audio en la respuesta ${qIndex + 1}`, 'error');
      return;
    }

    try {
      const mr = mediaRecorderRef.current;
      
      // Solicitar último chunk antes de detener
      console.log(`[AUDIO DEBUG] Solicitando último chunk...`);
      try { 
        mr.requestData?.(); 
      } catch (e) {
        console.log(`[AUDIO DEBUG] requestData no disponible:`, e);
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
      const cleanQuestionText = questionText
        .replace(/[^a-zA-Z0-9\s]/g, '') // Remover caracteres especiales
        .replace(/\s+/g, ' ') // Normalizar espacios múltiples a uno solo
        .trim() // Eliminar espacios al inicio y final
        .substring(0, 80); // Limitar longitud a 80 caracteres
      
      const filename = `${cleanQuestionText}.webm`;
      const duration = recordingStartRef.current ? (Date.now() - recordingStartRef.current) / 1000 : 0;

      console.log(`[AUDIO DEBUG] Datos preparados:`, {
        filename,
        questionText,
        cleanQuestionText,
        duration,
        blobSize: blob.size
      });
      
      console.log(`[AUDIO DEBUG] 📝 Nombre de archivo generado: "${filename}" basado en pregunta: "${questionText}"`);

      // Guardar en memoria para envío final
      audioAnswersRef.current.push({ blob, filename, index: qIndex, questionText });
      console.log(`[AUDIO DEBUG] ✅ Audio guardado en memoria. Total respuestas:`, audioAnswersRef.current.length);
      console.log(`[AUDIO DEBUG] ✅ Sin guardado en IndexedDB - solo para envío a API`);
      onShowToast(`Audio respuesta ${qIndex + 1} listo`, 'success');

    } catch (e) {
      console.error(`[AUDIO DEBUG] ❌ Error guardando respuesta:`, e);
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
      console.log(`[AUDIO DEBUG] Referencias limpiadas para pregunta ${qIndex + 1}`);
      
      // Reiniciar grabación de audio para la siguiente pregunta (solo si no es la última)
      setTimeout(() => {
        if (stream && isRecording && qIndex < questions.length - 1) {
          console.log(`[AUDIO DEBUG] 🔄 Reiniciando grabación de audio para siguiente pregunta`);
          startAudioRecording();
        } else if (qIndex >= questions.length - 1) {
          console.log(`[AUDIO DEBUG] 🏁 Última pregunta completada - no reiniciar audio`);
        }
      }, 500);
    }
  };

  // Función para iniciar video con logs
  const startVideoRecording = () => {
    console.log(`[VIDEO DEBUG] === INICIANDO GRABACIÓN VIDEO ===`);
    console.log(`[VIDEO DEBUG] Stream disponible:`, !!stream);
    
    if (!stream) {
      console.error(`[VIDEO DEBUG] ❌ No hay stream disponible para video`);
      return;
    }

    try {
      const videoRecorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
      videoRecorderRef.current = videoRecorder;
      videoChunksRef.current = [];

      videoRecorder.ondataavailable = (event) => {
        console.log(`[VIDEO DEBUG] 📊 Chunk de video recibido:`, {
          size: event.data.size,
          type: event.data.type,
          totalChunks: videoChunksRef.current.length + 1
        });
        if (event.data.size > 0) {
          videoChunksRef.current.push(event.data);
        }
      };

      videoRecorder.onstart = () => {
        console.log(`[VIDEO DEBUG] ✅ Grabación de video iniciada`);
        // Actualizar estado para botones de control
        setIsVideoRecording(true);
        console.log(`[VIDEO DEBUG] 🔴 Estado actualizado: GRABANDO VIDEO`);
      };

      videoRecorder.onstop = () => {
        console.log(`[VIDEO DEBUG] ⏹️ Grabación de video detenida`);
        console.log(`[VIDEO DEBUG] Total chunks de video:`, videoChunksRef.current.length);
        // Actualizar estado para botones de control
        setIsVideoRecording(false);
        console.log(`[VIDEO DEBUG] 🟢 Estado actualizado: NO GRABANDO VIDEO`);
      };

      videoRecorder.start(1000); // Capturar chunks cada segundo
      console.log(`[VIDEO DEBUG] VideoRecorder.start() ejecutado`);
    } catch (error) {
      console.error(`[VIDEO DEBUG] ❌ Error iniciando grabación de video:`, error);
    }
  };

  // Manejar inicio de entrevista
  const handleStartInterview = async () => {
    console.log(`[INTERVIEW DEBUG] === INICIANDO ENTREVISTA COMPLETA ===`);
    
    // Registrar tiempo de inicio de toda la entrevista
    interviewStartTimeRef.current = Date.now();
    console.log(`[INTERVIEW DEBUG] ⏰ Tiempo de inicio registrado:`, {
      timestamp: interviewStartTimeRef.current,
      iso: new Date(interviewStartTimeRef.current).toISOString(),
      readable: new Date(interviewStartTimeRef.current).toLocaleString()
    });
    console.log(`[INTERVIEW DEBUG] ✅ interviewStartTimeRef.current establecido:`, interviewStartTimeRef.current);
    
    const success = await startInterview();
    if (success) {
      console.log(`[INTERVIEW DEBUG] ✅ Entrevista iniciada exitosamente`);
      onShowToast('¡Entrevista iniciada! Responde con confianza.', 'success');
    } else {
      console.error(`[INTERVIEW DEBUG] ❌ Error iniciando entrevista`);
      onShowToast('Error: No se pudo acceder a la cámara/micrófono. Verifica los permisos.', 'error');
    }
  };

  // Manejar siguiente pregunta
  const handleNextQuestion = async () => {
    // PROTECCIÓN CONTRA DOBLE EJECUCIÓN
    if (isFinishing || isSubmitting || isCompleted) {
      console.log(`[INTERVIEW DEBUG] ⚠️ Entrevista finalizándose o completada, ignorando handleNextQuestion`);
      console.log(`[INTERVIEW DEBUG] 📊 Estados de protección:`, { isFinishing, isSubmitting, isCompleted });
      return;
    }
    
    console.log(`[INTERVIEW DEBUG] === SIGUIENTE PREGUNTA ===`);
    console.log(`[INTERVIEW DEBUG] Pregunta actual:`, currentQuestionIndex);
    console.log(`[INTERVIEW DEBUG] Total preguntas:`, questions.length);
    console.log(`[INTERVIEW DEBUG] Estado finalización:`, { isFinishing, isSubmitting });
    
    // Detener y guardar la respuesta actual
    await stopAndSaveCurrentAnswer(currentQuestionIndex);
    
    if (currentQuestionIndex === questions.length - 1) {
      console.log(`[INTERVIEW DEBUG] 🏁 FINALIZANDO ENTREVISTA`);
      await handleFinishInterview();
    } else {
      console.log(`[INTERVIEW DEBUG] ➡️ Avanzando a siguiente pregunta`);
      nextQuestion();
      onShowToast(`Pregunta ${currentQuestionIndex + 2} de ${questions.length}`, 'info');
      
      // Reproducir siguiente pregunta
      setTimeout(() => {
        speakQuestion(questions[currentQuestionIndex + 1]);
      }, 500);
    }
  };

  // Función para finalizar entrevista con logs detallados
  const handleFinishInterview = async () => {
    if (isFinishing || isSubmitting || isCompleted) {
      console.log(`[FINISH DEBUG] ⚠️ Entrevista ya finalizándose o completada, ignorando duplicada`);
      console.log(`[FINISH DEBUG] 📊 Estados de protección:`, { isFinishing, isSubmitting, isCompleted });
      return;
    }

    console.log(`[FINISH DEBUG] 🏁 INICIANDO FINALIZACIÓN DE ENTREVISTA`);
    
    // 1. DETENER CONTADOR INMEDIATAMENTE PARA EVITAR DOBLE ENVÍO
    console.log(`[FINISH DEBUG] ⏰ DETENIENDO CONTADOR PARA EVITAR DOBLE ENVÍO...`);
    setResponseTimeLeft(0); // Detener contador inmediatamente
    console.log(`[FINISH DEBUG] ✅ Contador detenido (establecido en 0)`);
    
    // 2. DETENER TODO INMEDIATAMENTE
    console.log(`[FINISH DEBUG] 🛑 DETENIENDO TODAS LAS GRABACIONES Y RECURSOS...`);
    console.log(`[FINISH DEBUG] 📊 Estado inicial:`, {
      audioRecording: isAudioRecording,
      videoRecording: isVideoRecording,
      cameraActive: isCameraActive,
      mediaRecorderState: mediaRecorderRef.current?.state,
      videoRecorderState: videoRecorderRef.current?.state,
      streamActive: !!stream
    });
    
    // Detener grabación de audio si está activa
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      console.log(`[FINISH DEBUG] 🎵 Deteniendo grabación de audio (estado: ${mediaRecorderRef.current.state})...`);
      mediaRecorderRef.current.stop();
      setIsAudioRecording(false);
      console.log(`[FINISH DEBUG] ✅ Audio detenido y estado actualizado`);
    } else {
      console.log(`[FINISH DEBUG] ⚠️ Audio no estaba grabando (estado: ${mediaRecorderRef.current?.state || 'null'})`);
    }

    // Detener grabación de video si está activa
    if (videoRecorderRef.current && videoRecorderRef.current.state === 'recording') {
      console.log(`[FINISH DEBUG] 🎥 Deteniendo grabación de video (estado: ${videoRecorderRef.current.state})...`);
      videoRecorderRef.current.stop();
      setIsVideoRecording(false);
      console.log(`[FINISH DEBUG] ✅ Video detenido y estado actualizado`);
    } else {
      console.log(`[FINISH DEBUG] ⚠️ Video no estaba grabando (estado: ${videoRecorderRef.current?.state || 'null'})`);
    }

    // Detener stream de cámara inmediatamente
    if (stream) {
      let tracksDetected = 0;
      stream.getTracks().forEach(track => {
        tracksDetected++;
        console.log(`[FINISH DEBUG] 🛑 Deteniendo track ${tracksDetected}: ${track.kind} (${track.label})`);
        console.log(`[FINISH DEBUG] 📊 Track estado antes: enabled=${track.enabled}, readyState=${track.readyState}`);
        track.stop();
        console.log(`[FINISH DEBUG] 📊 Track estado después: enabled=${track.enabled}, readyState=${track.readyState}`);
      });
      console.log(`[FINISH DEBUG] ✅ Total de tracks detenidos: ${tracksDetected}`);
      setIsCameraActive(false);
      console.log(`[FINISH DEBUG] ✅ Estado cámara actualizado: INACTIVA`);
    } else {
      console.log(`[FINISH DEBUG] ⚠️ No hay stream activo para detener`);
    }
    
    // Limpiar video preview inmediatamente
    if (videoRef.current) {
      videoRef.current.srcObject = null;
      console.log(`[FINISH DEBUG] 🎥 Video preview limpiado`);
    }
    
    console.log(`[FINISH DEBUG] 📊 Estado final después de detener todo:`, {
      audioRecording: false,
      videoRecording: false,
      cameraActive: false,
      allResourcesStopped: true
    });

    // 2. MARCAR COMO COMPLETADA INMEDIATAMENTE (MOSTRAR PANEL DE FINALIZACIÓN)
    markAsCompleted();
    console.log(`[FINISH DEBUG] 🎉 Panel de finalización mostrado - iniciando envío en segundo plano`);

    // 3. CONFIGURAR ESTADOS PARA EL ENVÍO
    setIsFinishing(true);
    setIsSubmitting(true);

    // 4. ESPERAR UN POCO PARA QUE SE DETENGAN LAS GRABACIONES
    await new Promise(resolve => setTimeout(resolve, 1000));

    try {
      // Resto del código de envío continúa aquí...
      console.log(`[FINISH DEBUG] 📤 Iniciando envío de datos en segundo plano...`);
      
      // Crear blob de video
      let videoBlob: Blob | null = null;
      if (videoChunksRef.current.length > 0) {
        videoBlob = new Blob(videoChunksRef.current, { type: 'video/webm' });
        console.log(`[FINISH DEBUG] Video blob creado:`, {
          size: videoBlob.size,
          type: videoBlob.type
        });
      } else {
        console.warn(`[FINISH DEBUG] ⚠️ No hay chunks de video disponibles`);
      }

      // Preparar datos para envío
      if (!user?.id || !currentInterviewData?.id) {
        console.error(`[FINISH DEBUG] ❌ Faltan datos para envío:`, {
          hasUserId: !!user?.id,
          hasInterviewId: !!currentInterviewData?.id
        });
        onShowToast('Error: Faltan datos para finalizar entrevista', 'error');
        return;
      }

      if (audioAnswersRef.current.length === 0) {
        console.warn(`[FINISH DEBUG] ⚠️ No hay respuestas de audio para enviar`);
        onShowToast('Advertencia: No se capturaron respuestas de audio', 'info');
      }
      console.log(`[FINISH DEBUG] Preparando FormData para envío con archivos multimedia...`);
      const form = new FormData();
      
      // Calcular duración total de la entrevista con logs detallados
      const currentTime = Date.now();
      const startTime = interviewStartTimeRef.current;
      
      console.log(`[DURATION DEBUG] === CALCULANDO DURACIÓN DE ENTREVISTA ===`);
      console.log(`[DURATION DEBUG] Tiempo actual:`, currentTime);
      console.log(`[DURATION DEBUG] Tiempo de inicio:`, startTime);
      console.log(`[DURATION DEBUG] Tiempo de inicio existe:`, !!startTime);
      
      let durationMs = 0;
      let durationMinutes = 0;
      let durationString = "0";
      
      if (startTime) {
        durationMs = currentTime - startTime;
        durationMinutes = Math.round(durationMs / (1000 * 60));
        durationString = durationMinutes.toString();
        
        console.log(`[DURATION DEBUG] Duración en milisegundos:`, durationMs);
        console.log(`[DURATION DEBUG] Duración en minutos (calculada):`, durationMs / (1000 * 60));
        console.log(`[DURATION DEBUG] Duración en minutos (redondeada):`, durationMinutes);
        console.log(`[DURATION DEBUG] Duración como string:`, durationString);
      } else {
        console.warn(`[DURATION DEBUG] ⚠️ No hay tiempo de inicio registrado - usando 0`);
      }
      
      console.log(`[DURATION DEBUG] Resumen final:`, {
        startTime: startTime ? new Date(startTime).toISOString() : 'No registrado',
        endTime: new Date(currentTime).toISOString(),
        durationMs,
        durationMinutes,
        durationString,
        willSendToAPI: durationString
      });
      
      // Agregar audios (array según la API)
      audioAnswersRef.current
        .sort((a, b) => a.index - b.index)
        .forEach((ans, index) => {
          console.log(`[FINISH DEBUG] Agregando audio ${index + 1}:`, {
            filename: ans.filename,
            size: ans.blob.size,
            questionIndex: ans.index,
            questionText: ans.questionText
          });
          console.log(`[FINISH DEBUG] 🎵 Audio "${ans.filename}" para pregunta: "${ans.questionText}"`);
          form.append('audios', ans.blob, ans.filename);
        });
      
      // Agregar video (string($binary) según la API)
      if (videoBlob && videoBlob.size > 0) {
        const videoFilename = `sesion-${new Date().toISOString().replace(/[:.]/g, '-')}.webm`;
        form.append('video', videoBlob, videoFilename);
        console.log(`[FINISH DEBUG] Video agregado:`, {
          filename: videoFilename,
          size: videoBlob.size
        });
      } else {
        console.warn(`[FINISH DEBUG] ⚠️ No se agregó video (vacío o inexistente)`);
      }
      
      // Agregar parámetros requeridos
      form.append('userId', user.id);
      form.append('interviewId', currentInterviewData.id);
      form.append('durationMinutes', durationString); // Enviado como string

      console.log(`[FINISH DEBUG] Datos finales para envío:`, {
        userId: user.id,
        interviewId: currentInterviewData.id,
        durationMinutes: durationString, // Mostrar como string
        durationMinutesNumber: durationMinutes, // Para referencia
        audioCount: audioAnswersRef.current.length,
        hasVideo: !!(videoBlob && videoBlob.size > 0)
      });

      const apiUrl = `${process.env.NEXT_PUBLIC_API_BASE_URL}/api/userinterview/finishInterview`;
      console.log(`[FINISH DEBUG] 📤 Enviando a ${apiUrl} con JWT (directo a Spring Boot)...`);
      console.log(`[FINISH DEBUG] FormData entries:`, Array.from(form.entries()).map(([key, value]) => ({
        key,
        type: typeof value,
        size: value instanceof Blob ? value.size : 'N/A',
        value: value instanceof Blob ? `[Blob ${value.size} bytes]` : value
      })));

      // Usar getAuthFetch del contexto de autenticación en lugar de fetch manual
      console.log(`[FINISH DEBUG] Usando getAuthFetch para envío con JWT automático...`);
      console.log(`[FINISH DEBUG] ⏱️ Timeout extendido activado para archivos multimedia (2 minutos)`);
      
      // Debug: verificar token antes del envío
      const authHeader = getAuthHeader();
      const tokenFromStorage = localStorage.getItem('token');
      console.log(`[FINISH DEBUG] 🔑 Auth header:`, authHeader);
      console.log(`[FINISH DEBUG] 🔑 Token en localStorage:`, tokenFromStorage ? `${tokenFromStorage.substring(0, 20)}...` : 'NO_TOKEN');
      console.log(`[FINISH DEBUG] 👤 Usuario actual:`, { id: user?.id, email: user?.email, type: user?.type });
      
      const res = await getAuthFetch(apiUrl, {
        method: 'POST',
        body: form,
      });
      
      console.log(`[FINISH DEBUG] Respuesta del servidor:`, {
        status: res.status,
        statusText: res.statusText,
        ok: res.ok
      });
      
      const data = await res.json().catch(() => ({}));
      if (res.ok) {
        console.log(`[FINISH DEBUG] ✅ Entrevista enviada exitosamente:`, data);
        onShowToast('¡Entrevista finalizada y enviada!', 'success');
        console.log(`[FINISH DEBUG] 🎉 Envío completado - panel de finalización ya está visible`);
        
        // No llamar a finishInterview() del hook - ya enviamos los datos directamente
      } else {
        console.error(`[FINISH DEBUG] ❌ Error del servidor:`, {
          status: res.status,
          data
        });
        onShowToast(data?.message || 'No se pudo finalizar entrevista en el servidor', 'error');
      }
    } catch (err) {
      console.error(`[FINISH DEBUG] ❌ Error de red:`, err);
      onShowToast('Error de conexión al finalizar entrevista', 'error');
    } finally {
      setIsFinishing(false); // Reset bandera para permitir reintentos
      setIsSubmitting(false); // Reset estado de envío
      console.log(`[FINISH DEBUG] 🔄 Banderas de finalización reseteadas`);
    }
  };

  // useEffect para actualizar el tiempo límite cuando cambia la pregunta
  useEffect(() => {
    if (isRecording && currentInterviewData) {
      const questionTime = getCurrentQuestionTime(currentQuestionIndex);
      setCurrentQuestionTimeLimit(questionTime);
      setResponseTimeLeft(questionTime);
      console.log(`[TIMER DEBUG] ⏰ Tiempo actualizado para pregunta ${currentQuestionIndex + 1}: ${questionTime}s`);
    }
  }, [currentQuestionIndex, isRecording, currentInterviewData, getCurrentQuestionTime]);

  // useEffect para manejar temporizador de respuesta
  useEffect(() => {
    if (!isRecording || isCompleted) return; // AGREGAR: No ejecutar si ya completada

    const timer = setInterval(() => {
      setResponseTimeLeft(prev => {
        // PROTECCIÓN: No ejecutar si ya se está finalizando O si ya completada
        if (isFinishing || isSubmitting || isCompleted) {
          console.log(`[TIMER DEBUG] ⚠️ Entrevista finalizándose o completada, deteniendo contador automático`);
          console.log(`[TIMER DEBUG] 📊 Estados:`, { isFinishing, isSubmitting, isCompleted });
          return prev; // Mantener el tiempo actual sin decrementar
        }
        
        if (prev <= 1) {
          // Tiempo agotado, avanzar automáticamente
          console.log(`[TIMER DEBUG] ⏰ Tiempo agotado para pregunta ${currentQuestionIndex + 1}`);
          console.log(`[TIMER DEBUG] 📊 Estado antes de auto-avanzar:`, { isFinishing, isSubmitting, isCompleted });
          handleNextQuestion();
          // El tiempo se actualizará automáticamente por el useEffect de arriba
          return prev; // Mantener tiempo actual hasta que se actualice
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isRecording, currentQuestionIndex, isFinishing, isSubmitting, isCompleted]);

  // useEffect para limpiar recursos cuando la entrevista se completa
  useEffect(() => {
    if (isCompleted) {
      console.log(`[CLEANUP DEBUG] 🧹 Entrevista completada, limpiando todos los recursos...`);
      
      // Detener stream de cámara si existe
      if (stream) {
        stream.getTracks().forEach(track => {
          console.log(`[CLEANUP DEBUG] 🛑 Deteniendo track: ${track.kind} (${track.label})`);
          track.stop();
        });
      }
      
      // Limpiar video preview
      if (videoRef.current) {
        videoRef.current.srcObject = null;
        console.log(`[CLEANUP DEBUG] 🎥 Video preview limpiado`);
      }
      
      // Limpiar MediaRecorders si existen
      if (mediaRecorderRef.current) {
        try {
          if (mediaRecorderRef.current.state === 'recording') {
            mediaRecorderRef.current.stop();
          }
        } catch (e) {
          console.log(`[CLEANUP DEBUG] Error limpiando audio recorder:`, e);
        }
        mediaRecorderRef.current = null;
      }
      
      if (videoRecorderRef.current) {
        try {
          if (videoRecorderRef.current.state === 'recording') {
            videoRecorderRef.current.stop();
          }
        } catch (e) {
          console.log(`[CLEANUP DEBUG] Error limpiando video recorder:`, e);
        }
        videoRecorderRef.current = null;
      }
      
      console.log(`[CLEANUP DEBUG] ✅ Todos los recursos limpiados correctamente`);
    }
  }, [isCompleted, stream]);

  // ELIMINADO: useEffect duplicado - el tiempo dinámico se maneja arriba

  // useEffect para manejar stream de video
  useEffect(() => {
    if (stream && videoRef.current) {
      console.log(`[STREAM DEBUG] Stream disponible, configurando video...`);
      videoRef.current.srcObject = stream;
      videoRef.current.play();
      
      // Actualizar estado de cámara
      setIsCameraActive(true);
      console.log(`[STREAM DEBUG] 🟢 Estado cámara actualizado: ACTIVA`);
      
      // Solo iniciar grabaciones al comenzar la entrevista (no en cada cambio)
      if (isRecording) {
        // Iniciar grabación de video (una sola vez por sesión)
        if (!videoRecorderRef.current) {
          console.log(`[STREAM DEBUG] Iniciando grabación de video por primera vez`);
          startVideoRecording();
        }
        
        // Iniciar grabación de audio (se reinicia por pregunta)
        if (!mediaRecorderRef.current) {
          console.log(`[STREAM DEBUG] Iniciando grabación de audio`);
          startAudioRecording();
        }
      }
    }
  }, [stream, isRecording]);

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
      <div className="w-full h-full flex flex-col items-center justify-center text-center">
        <h2 className="text-3xl font-bold mb-6 text-slate-100">Cargando Entrevista</h2>
        <div className="bg-slate-800/95 backdrop-blur-lg border border-slate-600/30 shadow-2xl p-8 rounded-xl w-full max-w-2xl">
          <div className="flex items-center justify-center space-x-3 mb-4">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-400"></div>
            <p className="text-slate-300">Verificando entrevistas asignadas...</p>
          </div>
        </div>
      </div>
    );
  }

  // Mostrar error si hay
  if (questionsError) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center">
        <h2 className="text-3xl font-bold mb-6 text-slate-100">Estado de Entrevista</h2>
        <div className="bg-slate-800/95 backdrop-blur-lg border border-slate-600/30 shadow-2xl p-8 rounded-xl w-full max-w-2xl">
          <div className="p-6 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 rounded-xl border-l-4 border-yellow-400">
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
              </svg>
              <div>
                <p className="font-semibold text-xl text-yellow-300">Sin Entrevista Asignada</p>
                <p className="text-sm text-yellow-200 mt-1">{questionsError}</p>
                <p className="text-sm text-yellow-200 mt-2">Contacta al reclutador para que te asigne una entrevista.</p>
              </div>
            </div>
          </div>
          <button 
            onClick={loadQuestionsFromAPI}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-6 rounded-lg transition-colors"
          >
            Verificar Nuevamente
          </button>
        </div>
      </div>
    );
  }

  if (!safeQuestions.length) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center text-center">
        <h2 className="text-3xl font-bold mb-6 text-slate-100">Estado de Entrevista</h2>
        <div className="bg-slate-800/95 backdrop-blur-lg border border-slate-600/30 shadow-2xl p-8 rounded-xl w-full max-w-2xl">
          <div className="p-6 bg-gradient-to-r from-gray-500/20 to-slate-500/20 rounded-xl border-l-4 border-gray-400">
            <div className="flex items-center space-x-3">
              <svg className="w-8 h-8 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd"/>
              </svg>
              <div>
                <p className="font-semibold text-xl text-gray-300">Sin Preguntas Disponibles</p>
                <p className="text-sm text-gray-200 mt-1">No se encontraron preguntas para la entrevista.</p>
                <p className="text-sm text-gray-200 mt-2">Contacta al reclutador o vuelve más tarde.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full h-full flex flex-col items-center justify-center text-center">
      <h2 className="text-3xl font-bold mb-8 text-slate-100">Entrevista de Reclutamiento</h2>
      
      {/* Question Card */}
      <div className="bg-slate-800/95 backdrop-blur-lg border border-slate-600/30 shadow-2xl p-8 rounded-xl w-full max-w-2xl mb-8">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-4">
            <span className="text-blue-400 font-semibold">
              Pregunta {currentQuestionIndex + 1} de {safeQuestions.length}
            </span>
            <span className="text-orange-400 font-mono">
              {Math.floor(responseTimeLeft / 60)}:{(responseTimeLeft % 60).toString().padStart(2, '0')}
            </span>
          </div>
          <h3 className="text-xl font-semibold text-slate-100 mb-4">
            {safeQuestions[currentQuestionIndex]}
          </h3>
        </div>

        {/* Video Preview */}
        <div className="mb-6">
          <video
            ref={videoRef}
            className="w-full max-w-md mx-auto rounded-lg bg-slate-700"
            autoPlay
            muted
            playsInline
          />
        </div>

        {/* Controles de Emergencia - Solo visible durante la entrevista */}
        {isRecording && (
          <div className="mb-6 p-4 bg-slate-700/50 rounded-lg border border-slate-600">
            <h4 className="text-sm font-semibold text-slate-300 mb-3 text-center">
              🚨 Controles de Emergencia
            </h4>
            <div className="flex justify-center space-x-3">
              <button
                onClick={stopCameraManually}
                disabled={!isCameraActive}
                className={`text-xs font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2 ${
                  isCameraActive 
                    ? 'bg-red-600 hover:bg-red-700 text-white' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isCameraActive ? 'bg-green-400' : 'bg-gray-400'}`}></div>
                <span>Detener Cámara</span>
              </button>
              
              <button
                onClick={stopAudioRecordingManually}
                disabled={!isAudioRecording}
                className={`text-xs font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2 ${
                  isAudioRecording 
                    ? 'bg-orange-600 hover:bg-orange-700 text-white' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isAudioRecording ? 'bg-red-400 animate-pulse' : 'bg-gray-400'}`}></div>
                <span>Detener Audio</span>
              </button>
              
              <button
                onClick={stopVideoRecordingManually}
                disabled={!isVideoRecording}
                className={`text-xs font-medium py-2 px-4 rounded-lg transition-colors flex items-center space-x-2 ${
                  isVideoRecording 
                    ? 'bg-purple-600 hover:bg-purple-700 text-white' 
                    : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                }`}
              >
                <div className={`w-2 h-2 rounded-full ${isVideoRecording ? 'bg-red-400 animate-pulse' : 'bg-gray-400'}`}></div>
                <span>Detener Video</span>
              </button>
            </div>
            
            {/* Indicadores de estado */}
            <div className="mt-3 text-xs text-slate-400 text-center">
              <div className="flex justify-center space-x-4">
                <span className={`flex items-center space-x-1 ${isCameraActive ? 'text-green-400' : 'text-gray-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isCameraActive ? 'bg-green-400' : 'bg-gray-500'}`}></div>
                  <span>Cámara: {isCameraActive ? 'Activa' : 'Inactiva'}</span>
                </span>
                <span className={`flex items-center space-x-1 ${isAudioRecording ? 'text-red-400' : 'text-gray-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isAudioRecording ? 'bg-red-400 animate-pulse' : 'bg-gray-500'}`}></div>
                  <span>Audio: {isAudioRecording ? 'Grabando' : 'Detenido'}</span>
                </span>
                <span className={`flex items-center space-x-1 ${isVideoRecording ? 'text-red-400' : 'text-gray-500'}`}>
                  <div className={`w-1.5 h-1.5 rounded-full ${isVideoRecording ? 'bg-red-400 animate-pulse' : 'bg-gray-500'}`}></div>
                  <span>Video: {isVideoRecording ? 'Grabando' : 'Detenido'}</span>
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="flex justify-center space-x-4">
          {!isRecording ? (
            <button
              onClick={handleStartInterview}
              className="bg-green-600 hover:bg-green-700 text-white font-semibold py-3 px-8 rounded-xl transition-colors flex items-center space-x-2"
            >
              <Play className="w-5 h-5" />
              <span>Iniciar Entrevista</span>
            </button>
          ) : (
            <>
              <button
                onClick={handleNextQuestion}
                disabled={isSubmitting}
                className={`font-semibold py-3 px-8 rounded-xl transition-colors flex items-center space-x-2 ${
                  isSubmitting 
                    ? 'bg-gray-600 cursor-not-allowed' 
                    : 'bg-blue-600 hover:bg-blue-700'
                } text-white`}
              >
                {isSubmitting ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <Square className="w-5 h-5" />
                    <span>
                      {currentQuestionIndex === safeQuestions.length - 1 ? 'Finalizar' : 'Siguiente'}
                    </span>
                  </>
                )}
              </button>
              
              <button
                onClick={() => speakQuestion(safeQuestions[currentQuestionIndex])}
                className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors flex items-center space-x-2"
              >
                <Volume2 className="w-5 h-5" />
                <span>Repetir</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="text-slate-400 text-sm">
        {isRecording ? (
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
            <span>Grabando respuesta...</span>
          </div>
        ) : (
          <span>Presiona "Iniciar Entrevista" para comenzar</span>
        )}
      </div>
    </div>
  );
};
