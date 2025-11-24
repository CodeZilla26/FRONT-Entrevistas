/**
 * Utilidades para validación de datos en el RecruiterPanel
 */

/**
 * Validar formato de email
 */
export const validateEmail = (email: string): { isValid: boolean; message?: string } => {
  if (!email || !email.trim()) {
    return { isValid: false, message: 'El email es requerido' };
  }
  
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  
  if (!emailRegex.test(email.trim())) {
    return { isValid: false, message: 'Formato de email inválido' };
  }
  
  if (email.length > 254) {
    return { isValid: false, message: 'El email es demasiado largo' };
  }
  
  return { isValid: true };
};

/**
 * Validar nombre (solo letras, espacios y algunos caracteres especiales)
 */
export const validateName = (name: string): { isValid: boolean; message?: string } => {
  if (!name || !name.trim()) {
    return { isValid: false, message: 'El nombre es requerido' };
  }
  
  const trimmedName = name.trim();
  
  if (trimmedName.length < 2) {
    return { isValid: false, message: 'El nombre debe tener al menos 2 caracteres' };
  }
  
  if (trimmedName.length > 50) {
    return { isValid: false, message: 'El nombre no puede exceder 50 caracteres' };
  }
  
  // Permitir letras, espacios, acentos, ñ, apostrofes y guiones
  const nameRegex = /^[a-zA-ZáéíóúÁÉÍÓÚñÑüÜ\s'-]+$/;
  
  if (!nameRegex.test(trimmedName)) {
    return { isValid: false, message: 'El nombre solo puede contener letras, espacios, apostrofes y guiones' };
  }
  
  return { isValid: true };
};

/**
 * Validar contraseña
 */
export const validatePassword = (password: string): { isValid: boolean; message?: string; strength?: 'weak' | 'medium' | 'strong' } => {
  if (!password) {
    return { isValid: false, message: 'La contraseña es requerida' };
  }
  
  if (password.length < 6) {
    return { isValid: false, message: 'La contraseña debe tener al menos 6 caracteres' };
  }
  
  if (password.length > 128) {
    return { isValid: false, message: 'La contraseña no puede exceder 128 caracteres' };
  }
  
  // Calcular fortaleza
  let strength: 'weak' | 'medium' | 'strong' = 'weak';
  let strengthScore = 0;
  
  // Longitud
  if (password.length >= 8) strengthScore++;
  if (password.length >= 12) strengthScore++;
  
  // Caracteres
  if (/[a-z]/.test(password)) strengthScore++;
  if (/[A-Z]/.test(password)) strengthScore++;
  if (/[0-9]/.test(password)) strengthScore++;
  if (/[^a-zA-Z0-9]/.test(password)) strengthScore++;
  
  if (strengthScore >= 5) {
    strength = 'strong';
  } else if (strengthScore >= 3) {
    strength = 'medium';
  }
  
  return { isValid: true, strength };
};

/**
 * Validar título de entrevista
 */
export const validateInterviewTitle = (title: string): { isValid: boolean; message?: string } => {
  if (!title || !title.trim()) {
    return { isValid: false, message: 'El título es requerido' };
  }
  
  const trimmedTitle = title.trim();
  
  if (trimmedTitle.length < 3) {
    return { isValid: false, message: 'El título debe tener al menos 3 caracteres' };
  }
  
  if (trimmedTitle.length > 100) {
    return { isValid: false, message: 'El título no puede exceder 100 caracteres' };
  }
  
  return { isValid: true };
};

/**
 * Validar descripción de entrevista
 */
export const validateInterviewDescription = (description: string): { isValid: boolean; message?: string } => {
  if (!description || !description.trim()) {
    return { isValid: false, message: 'La descripción es requerida' };
  }
  
  const trimmedDescription = description.trim();
  
  if (trimmedDescription.length < 10) {
    return { isValid: false, message: 'La descripción debe tener al menos 10 caracteres' };
  }
  
  if (trimmedDescription.length > 1000) {
    return { isValid: false, message: 'La descripción no puede exceder 1000 caracteres' };
  }
  
  return { isValid: true };
};

/**
 * Validar pregunta de entrevista
 */
export const validateQuestion = (question: string): { isValid: boolean; message?: string } => {
  if (!question || !question.trim()) {
    return { isValid: false, message: 'La pregunta es requerida' };
  }
  
  const trimmedQuestion = question.trim();
  
  if (trimmedQuestion.length < 10) {
    return { isValid: false, message: 'La pregunta debe tener al menos 10 caracteres' };
  }
  
  if (trimmedQuestion.length > 500) {
    return { isValid: false, message: 'La pregunta no puede exceder 500 caracteres' };
  }
  
  return { isValid: true };
};

/**
 * Validar puntuación (0-100)
 */
export const validateScore = (score: number): { isValid: boolean; message?: string } => {
  if (typeof score !== 'number') {
    return { isValid: false, message: 'La puntuación debe ser un número' };
  }
  
  if (score < 0) {
    return { isValid: false, message: 'La puntuación no puede ser negativa' };
  }
  
  if (score > 100) {
    return { isValid: false, message: 'La puntuación no puede exceder 100' };
  }
  
  return { isValid: true };
};

/**
 * Validar tiempo en minutos
 */
export const validateTimeMinutes = (minutes: number): { isValid: boolean; message?: string } => {
  if (typeof minutes !== 'number') {
    return { isValid: false, message: 'El tiempo debe ser un número' };
  }
  
  if (minutes < 1) {
    return { isValid: false, message: 'El tiempo debe ser al menos 1 minuto' };
  }
  
  if (minutes > 180) {
    return { isValid: false, message: 'El tiempo no puede exceder 180 minutos (3 horas)' };
  }
  
  return { isValid: true };
};

/**
 * Validar ID (string no vacío)
 */
export const validateId = (id: string): { isValid: boolean; message?: string } => {
  if (!id || !id.trim()) {
    return { isValid: false, message: 'El ID es requerido' };
  }
  
  if (id.trim().length < 3) {
    return { isValid: false, message: 'El ID debe tener al menos 3 caracteres' };
  }
  
  return { isValid: true };
};

/**
 * Validar URL
 */
export const validateUrl = (url: string): { isValid: boolean; message?: string } => {
  if (!url || !url.trim()) {
    return { isValid: false, message: 'La URL es requerida' };
  }
  
  try {
    new URL(url);
    return { isValid: true };
  } catch {
    return { isValid: false, message: 'Formato de URL inválido' };
  }
};

/**
 * Validar datos de participante completos
 */
export const validateParticipantData = (data: {
  name: string;
  lastName: string;
  email: string;
  password: string;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  const nameValidation = validateName(data.name);
  if (!nameValidation.isValid) {
    errors.name = nameValidation.message!;
  }
  
  const lastNameValidation = validateName(data.lastName);
  if (!lastNameValidation.isValid) {
    errors.lastName = lastNameValidation.message!;
  }
  
  const emailValidation = validateEmail(data.email);
  if (!emailValidation.isValid) {
    errors.email = emailValidation.message!;
  }
  
  const passwordValidation = validatePassword(data.password);
  if (!passwordValidation.isValid) {
    errors.password = passwordValidation.message!;
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Validar datos de entrevista completos
 */
export const validateInterviewData = (data: {
  title: string;
  description: string;
  questions: Array<{ text: string; points: number; time: number }>;
}): { isValid: boolean; errors: Record<string, string> } => {
  const errors: Record<string, string> = {};
  
  const titleValidation = validateInterviewTitle(data.title);
  if (!titleValidation.isValid) {
    errors.title = titleValidation.message!;
  }
  
  const descriptionValidation = validateInterviewDescription(data.description);
  if (!descriptionValidation.isValid) {
    errors.description = descriptionValidation.message!;
  }
  
  if (!data.questions || data.questions.length === 0) {
    errors.questions = 'Debe incluir al menos una pregunta';
  } else {
    // Validar cada pregunta
    data.questions.forEach((question, index) => {
      const questionValidation = validateQuestion(question.text);
      if (!questionValidation.isValid) {
        errors[`question_${index}`] = questionValidation.message!;
      }
      
      const pointsValidation = validateScore(question.points);
      if (!pointsValidation.isValid) {
        errors[`points_${index}`] = pointsValidation.message!;
      }
      
      const timeValidation = validateTimeMinutes(question.time);
      if (!timeValidation.isValid) {
        errors[`time_${index}`] = timeValidation.message!;
      }
    });
  }
  
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

/**
 * Sanitizar texto (remover caracteres peligrosos)
 */
export const sanitizeText = (text: string): string => {
  if (!text) return '';
  
  return text
    .trim()
    .replace(/[<>]/g, '') // Remover < y >
    .replace(/javascript:/gi, '') // Remover javascript:
    .replace(/on\w+=/gi, ''); // Remover event handlers
};

/**
 * Validar y sanitizar entrada de búsqueda
 */
export const validateSearchTerm = (searchTerm: string): { isValid: boolean; sanitized: string; message?: string } => {
  if (!searchTerm) {
    return { isValid: true, sanitized: '' };
  }
  
  if (searchTerm.length > 100) {
    return { 
      isValid: false, 
      sanitized: '', 
      message: 'El término de búsqueda es demasiado largo' 
    };
  }
  
  const sanitized = sanitizeText(searchTerm);
  
  return { isValid: true, sanitized };
};
