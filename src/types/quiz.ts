
export interface Question {
    id: string;
    text: string;
    options: string[];
    correctAnswer: number; // 0-3 index
    explanation: string;
}

export interface QuizLevel {
    id: number;
    title: string;
    description: string;
}
