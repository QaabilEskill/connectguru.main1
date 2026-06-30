// Lesson quizzes have been removed as requested
// All quizzes are now story-based only

export interface LessonQuiz {
  id: string;
  lesson_id: string;
  lesson_number: number;
  title: string;
  questions: LessonQuestion[];
}

export interface LessonQuestion {
  id: string;
  question: string;
  options: string[];
  correct_answer: string;
}

export const lessonQuizzes: LessonQuiz[] = [];

export const allLessonQuizzes: LessonQuiz[] = [];

export const getQuizForLesson = (lessonId: string): LessonQuiz | undefined => {
  return undefined;
};