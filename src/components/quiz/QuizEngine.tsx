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
    };

    const handleCheck = () => {
        if (selectedOpt === null) return;
        setIsAnswered(true);
        if (selectedOpt === currentQ.correctAnswer) {
            setScore(s => s + 10);
        }
    };

    const handleNext = () => {
        if (currentIdx + 1 < questions.length) {
            setCurrentIdx(currentIdx + 1);
            setSelectedOpt(null);
            setIsAnswered(false);
        } else {
            onComplete(score);
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

            {!isAnswered ? (
                <div style={{ marginTop: '2rem' }}>
                    <Button
                        onClick={handleCheck}
                        disabled={selectedOpt === null}
                        variant="primary"
                        style={{ width: '100%' }}
                    >
                        Continue
                    </Button>
                </div>
            ) : (
                <div className={styles.feedback}>
                    <div className={styles.explanation}>
                        <div className={selectedOpt === currentQ.correctAnswer ? styles.successText : styles.dangerText} style={{ fontSize: '1.4rem', marginBottom: '0.5rem' }}>
                            {selectedOpt === currentQ.correctAnswer ? '🎉 Correct!' : '❌ Incorrect!'}
                        </div>
                        <p>{currentQ.explanation}</p>
                    </div>
                    <Button onClick={handleNext} variant="primary" style={{ marginTop: '1rem', width: '100%' }}>
                        {currentIdx + 1 === questions.length ? 'Finish Quiz' : 'Next Question'}
                    </Button>
                </div>
            )}
        </Card>
    );
};
