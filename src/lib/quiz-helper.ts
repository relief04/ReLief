import { Question } from '@/types/quiz';

export interface QuizState {
    currentLevel: number;
    unlockedLevel: number; // 1, 2, 3, or 4 (Certificate Ready)
    currentQuestions: Question[];
    currentIndex: number;
    score: number;
    answers: number[]; // User selected indices
    isComplete: boolean;
    hasFailed: boolean;
    history: {
        attempts: number;
        certificateId?: string;
        completionDate?: string;
    },
    today?: string;
    version?: number; // Optional for backward compatibility, but we enforce checks
}

const STORAGE_KEY = 'relief_quiz_progress';
const CURRENT_VERSION = 2; // Increment when breaking changes occur (e.g. 15 -> 10 qs)

export const getQuizProgress = (): QuizState => {
    if (typeof window === 'undefined') return DEFAULT_STATE;
    try {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (!saved) return DEFAULT_STATE;

        const parsed = JSON.parse(saved);
        // Reset if version mismatch to identify legacy state
        if (parsed.version !== CURRENT_VERSION) {
            console.log("Quiz state version mismatch, resetting progress.");
            return DEFAULT_STATE;
        }
        return parsed;
    } catch {
        return DEFAULT_STATE;
    }
};

export const saveQuizProgress = (state: QuizState) => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
};

const DEFAULT_STATE: QuizState = {
    currentLevel: 1,
    unlockedLevel: 1,
    currentQuestions: [],
    currentIndex: 0,
    score: 0,
    answers: [],
    isComplete: false,
    hasFailed: false,
    history: { attempts: 0 },
    today: new Date().toLocaleDateString(),
    version: 2
};


export const startLevel = (levelId: number, currentState: QuizState, levelQuestions: Question[]): QuizState => {
    // Shuffle and pick 15
    const shuffled = [...levelQuestions].sort(() => 0.5 - Math.random());
    const selected = shuffled.slice(0, 10);

    return {
        ...currentState,
        currentLevel: levelId,
        currentQuestions: selected,
        currentIndex: 0,
        score: 0,
        answers: [],
        isComplete: false,
        hasFailed: false,
        history: {
            ...currentState.history,
            attempts: currentState.history.attempts + 1
        }
    };
};

export const submitAnswer = (answerIndex: number, currentState: QuizState): QuizState => {
    const question = currentState.currentQuestions[currentState.currentIndex];
    const isCorrect = question.correctAnswer === answerIndex;

    const newAnswers = [...currentState.answers, answerIndex];
    const newScore = isCorrect ? currentState.score + 1 : currentState.score;

    // Strict Mode: Fail immediately if wrong
    if (!isCorrect) {
        return {
            ...currentState,
            answers: newAnswers,
            hasFailed: true,
            isComplete: true // End quiz early
        };
    }

    const nextIndex = currentState.currentIndex + 1;
    const isFinished = nextIndex >= currentState.currentQuestions.length;

    const newState = {
        ...currentState,
        answers: newAnswers,
        score: newScore,
        currentIndex: nextIndex,
        isComplete: isFinished
    };

    if (isFinished && newScore === 10) {
        // Level Passed
        const nextLevel = currentState.currentLevel + 1;

        // Update Unlocked Level if we just beat the highest unlocked
        if (nextLevel > currentState.unlockedLevel) {
            newState.unlockedLevel = nextLevel;
        }

        // If beat level 3, generate certificate
        if (currentState.currentLevel === 3) {
            newState.history.certificateId = `RELIEF-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
            newState.history.completionDate = new Date().toLocaleDateString();
        }
    }

    return newState;
};
