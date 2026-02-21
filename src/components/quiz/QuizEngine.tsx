"use client";

import React, { useState } from 'react';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Question } from '@/types/quiz';
import styles from './QuizEngine.module.css';

interface QuizEngineProps {
    questions: Question[];
    onComplete: (score: number) => void;
}

export const QuizEngine: React.FC<QuizEngineProps> = ({ questions, onComplete }) => {
    const [currentIdx, setCurrentIdx] = useState(0);
    const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
    const [isAnswered, setIsAnswered] = useState(false);
    const [score, setScore] = useState(0);

    const currentQ = questions[currentIdx];

    const handleOptionClick = (idx: number) => {
        if (isAnswered) return;
        setSelectedOpt(idx);
        setIsAnswered(true);
        if (idx === currentQ.correctAnswer) {
            setScore(s => s + 10);
        }
    };

    const handleNext = () => {
        if (currentIdx + 1 < questions.length) {
            setCurrentIdx(currentIdx + 1);
            setSelectedOpt(null);
            setIsAnswered(false);
        } else {
            onComplete(score + (selectedOpt === currentQ.correctAnswer ? 10 : 0)); // Add last Q score if correct
        }
    };

    return (
        <Card className={styles.quizCard}>
            <div className={styles.progress}>
                Question {currentIdx + 1} / {questions.length}
            </div>

            <h2 className={styles.question}>{currentQ.text}</h2>

            <div className={styles.options}>
                {currentQ.options.map((opt, idx) => {
                    let stateClass = '';
                    if (isAnswered) {
                        if (idx === currentQ.correctAnswer) stateClass = styles.correct;
                        else if (idx === selectedOpt) stateClass = styles.wrong;
                        else stateClass = styles.dimmed;
                    }

                    return (
                        <button
                            key={idx}
                            className={`${styles.optionBtn} ${stateClass} ${selectedOpt === idx ? styles.selected : ''}`}
                            onClick={() => handleOptionClick(idx)}
                            disabled={isAnswered}
                        >
                            {opt}
                        </button>
                    );
                })}
            </div>

            {isAnswered && (
                <div className={styles.feedback}>
                    <p className={styles.explanation}>
                        {selectedOpt === currentQ.correctAnswer ? '🎉 Correct!' : '❌ Oops!'} <br />
                        {currentQ.explanation}
                    </p>
                    <Button onClick={handleNext} variant="primary" style={{ marginTop: '1rem' }}>
                        {currentIdx + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}
                    </Button>
                </div>
            )}
        </Card>
    );
};
