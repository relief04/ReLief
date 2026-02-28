import { supabase } from './supabaseClient';
import { logPointsHistory } from './userUtils';
export interface QuizQuestion {
    id: number;
    level_id: number;
    question: string;
    option_a: string;
    option_b: string;
    option_c: string;
    option_d: string;
    correct_answer: 'A' | 'B' | 'C' | 'D';
    explanation?: string;
    difficulty?: string;
    tags?: string[];
}

export interface QuizLevel {
    id: number;
    level_number: number;
    level_name: string;
    description: string;
    required_correct: number;
    total_questions: number;
}

export interface UserQuizProgress {
    id: number;
    user_id: string;
    level_id: number;
    current_question_index: number;
    correct_answers: number;
    incorrect_answers: number;
    completed: boolean;
    passed: boolean;
    started_at: string;
    completed_at?: string;
}

/**
 * Fetch all quiz levels
 */
export async function getQuizLevels(): Promise<QuizLevel[]> {
    const { data, error } = await supabase
        .from('quiz_levels')
        .select('*')
        .order('level_number');

    if (error) {
        console.error('Error fetching quiz levels:', error);
        return [];
    }

    return data || [];
}

/**
 * Fetch random questions for a specific level
 */
export async function getRandomQuestionsForLevel(
    levelId: number,
    count: number = 10
): Promise<QuizQuestion[]> {
    const { data, error } = await supabase
        .from('quiz_questions')
        .select('*')
        .eq('level_id', levelId);

    if (error) {
        console.error('Error fetching questions:', error);
        return [];
    }

    if (!data || data.length === 0) {
        return [];
    }

    // Shuffle and take first 'count' questions
    const shuffled = [...data].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, Math.min(count, data.length));
}

/**
 * Get user's progress for a specific level
 */
export async function getUserLevelProgress(
    userId: string,
    levelId: number
): Promise<UserQuizProgress | null> {
    const { data, error } = await supabase
        .from('user_quiz_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('level_id', levelId)
        .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows
        console.error('Error fetching user progress:', error);
    }

    return data || null;
}

/**
 * Start a new quiz level for user
 */
export async function startQuizLevel(
    userId: string,
    levelId: number
): Promise<UserQuizProgress | null> {
    const { data, error } = await supabase
        .from('user_quiz_progress')
        .insert({
            user_id: userId,
            level_id: levelId,
            current_question_index: 0,
            correct_answers: 0,
            incorrect_answers: 0,
            completed: false,
            passed: false
        })
        .select()
        .single();

    if (error) {
        console.error('Error starting quiz level:', error);
        return null;
    }

    return data;
}

/**
 * Submit an answer and update progress
 */
export async function submitQuizAnswer(
    userId: string,
    levelId: number,
    questionId: number,
    userAnswer: 'A' | 'B' | 'C' | 'D',
    isCorrect: boolean,
    currentProgress: UserQuizProgress
): Promise<UserQuizProgress | null> {
    // Save the answer
    await supabase
        .from('user_quiz_answers')
        .insert({
            user_id: userId,
            question_id: questionId,
            level_id: levelId,
            user_answer: userAnswer,
            is_correct: isCorrect
        });

    // Update progress
    const updatedCorrect = isCorrect
        ? currentProgress.correct_answers + 1
        : currentProgress.correct_answers;

    const updatedIncorrect = !isCorrect
        ? currentProgress.incorrect_answers + 1
        : currentProgress.incorrect_answers;

    const newIndex = currentProgress.current_question_index + 1;

    // Check if quiz is complete (10 questions answered)
    const totalAnswered = updatedCorrect + updatedIncorrect;
    const completed = totalAnswered >= 10;

    // Check if passed (7+ correct answers)
    const passed = updatedCorrect >= 7;

    // Award Points via RPC
    try {
        if (isCorrect) {
            await supabase.rpc('add_karma_points', {
                p_user_id: userId,
                p_points: 10 // 10 KP per correct answer
            });
            await logPointsHistory(userId, 10, 'Correct Answer', `Quiz Level ${levelId}`);
        }

        if (completed && passed) {
            await supabase.rpc('add_karma_points', {
                p_user_id: userId,
                p_points: 100 // 100 KP bonus for passing a level
            });
            await logPointsHistory(userId, 100, 'Level Passed', `Quiz Level ${levelId}`);
        }
    } catch (rpcError) {
        console.error('Error awarding points:', rpcError);
    }

    const { data, error } = await supabase
        .from('user_quiz_progress')
        .update({
            current_question_index: newIndex,
            correct_answers: updatedCorrect,
            incorrect_answers: updatedIncorrect,
            completed,
            passed,
            completed_at: completed ? new Date().toISOString() : null
        })
        .eq('user_id', userId)
        .eq('level_id', levelId)
        .select()
        .single();

    if (error) {
        console.error('Error updating quiz progress:', error);
        return null;
    }

    return data;
}

/**
 * Check which levels user has completed
 */
export async function getCompletedLevels(userId: string): Promise<number[]> {
    const { data, error } = await supabase
        .from('user_quiz_progress')
        .select('level_id')
        .eq('user_id', userId)
        .eq('completed', true)
        .eq('passed', true);

    if (error) {
        console.error('Error fetching completed levels:', error);
        return [];
    }

    return data?.map(item => item.level_id) || [];
}

/**
 * Generate certificate for user
 */
export async function generateCertificate(
    userId: string,
    username: string
): Promise<string | null> {
    const certificateId = `CERT-${Date.now()}-${Math.random().toString(36).substr(2, 9).toUpperCase()}`;

    const { data, error } = await supabase
        .from('certificates')
        .insert({
            user_id: userId,
            certificate_type: 'quiz_completion',
            certificate_data: {
                certificate_id: certificateId,
                username,
                issued_date: new Date().toISOString(),
                levels_completed: 3
            }
        })
        .select()
        .single();

    if (error) {
        console.error('Error generating certificate:', error);
        return null;
    }

    return certificateId;
}

/**
 * Get user's certificate
 */
export async function getUserCertificate(userId: string) {
    const { data, error } = await supabase
        .from('certificates')
        .select('*')
        .eq('user_id', userId)
        .eq('certificate_type', 'quiz_completion')
        .single();

    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching certificate:', error);
    }

    return data || null;
}
