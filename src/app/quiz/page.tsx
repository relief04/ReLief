"use client";

import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useToast } from '@/context/ToastContext';
import styles from './page.module.css';
import {
    getQuizLevels,
    getRandomQuestionsForLevel,
    getUserLevelProgress,
    startQuizLevel,
    submitQuizAnswer,
    getCompletedLevels,
    generateCertificate,
    getUserCertificate,
    QuizLevel,
    QuizQuestion,
    UserQuizProgress
} from '@/lib/quizUtils';

type ViewType = 'dashboard' | 'quiz' | 'result' | 'certificate';

export default function QuizPage() {
    const { user } = useUser();
    const { toast } = useToast();
    const [view, setView] = useState<ViewType>('dashboard');
    const [levels, setLevels] = useState<QuizLevel[]>([]);
    const [completedLevelIds, setCompletedLevelIds] = useState<number[]>([]);
    const [currentLevel, setCurrentLevel] = useState<QuizLevel | null>(null);
    const [questions, setQuestions] = useState<QuizQuestion[]>([]);
    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    const [progress, setProgress] = useState<UserQuizProgress | null>(null);
    const [loading, setLoading] = useState(true);
    const [certificateId, setCertificateId] = useState<string | null>(null);

    useEffect(() => {
        loadQuizData();
    }, [user]);

    async function loadQuizData() {
        if (!user) return;

        setLoading(true);
        const [levelsData, completed, cert] = await Promise.all([
            getQuizLevels(),
            getCompletedLevels(user.id),
            getUserCertificate(user.id)
        ]);

        setLevels(levelsData);
        setCompletedLevelIds(completed);
        if (cert) {
            setCertificateId(cert.certificate_data.certificate_id);
        }
        setLoading(false);
    }

    async function handleStartLevel(level: QuizLevel) {
        if (!user) return;

        setLoading(true);
        setCurrentLevel(level);

        // Get random 10 questions
        const quizQuestions = await getRandomQuestionsForLevel(level.id, 10);

        if (quizQuestions.length === 0) {
            toast('No questions available for this level. Please contact support.', 'error');
            setLoading(false);
            return;
        }

        setQuestions(quizQuestions);
        setCurrentQuestionIndex(0);

        // Start or resume progress
        let userProgress = await getUserLevelProgress(user.id, level.id);
        if (!userProgress) {
            userProgress = await startQuizLevel(user.id, level.id);
        }

        setProgress(userProgress);
        setView('quiz');
        setLoading(false);
    }

    async function handleAnswer(selectedAnswer: 'A' | 'B' | 'C' | 'D') {
        if (!user || !currentLevel || !progress || !questions[currentQuestionIndex]) return;

        const currentQuestion = questions[currentQuestionIndex];
        const isCorrect = selectedAnswer === currentQuestion.correct_answer;

        // Submit answer and update progress
        const updatedProgress = await submitQuizAnswer(
            user.id,
            currentLevel.id,
            currentQuestion.id,
            selectedAnswer,
            isCorrect,
            progress
        );

        if (!updatedProgress) {
            toast('Error submitting answer. Please try again.', 'error');
            return;
        }

        setProgress(updatedProgress);

        // Check if quiz is complete (10 questions answered)
        const totalAnswered = updatedProgress.correct_answers + updatedProgress.incorrect_answers;

        if (totalAnswered >= 10) {
            // Quiz complete
            setView('result');

            // If passed all 3 levels and no certificate yet, generate one
            if (updatedProgress.passed) {
                const allCompleted = await getCompletedLevels(user.id);
                if (allCompleted.length === 3 && !certificateId) {
                    const certId = await generateCertificate(user.id, user.username || user.firstName || 'Eco Warrior');
                    if (certId) {
                        setCertificateId(certId);
                    }
                }
            }
        } else {
            // Move to next question
            setCurrentQuestionIndex(currentQuestionIndex + 1);
        }
    }

    async function handleBackToDashboard() {
        await loadQuizData();
        setView('dashboard');
        setCurrentLevel(null);
        setQuestions([]);
        setProgress(null);
        setCurrentQuestionIndex(0);
    }

    if (loading) {
        return (
            <div className={styles.container}>
                <div className={styles.loading}>Loading Quiz...</div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className={styles.container}>
                <Card>
                    <h2>Please Sign In</h2>
                    <p>You need to be signed in to take the quiz.</p>
                </Card>
            </div>
        );
    }

    // DASHBOARD VIEW
    if (view === 'dashboard') {
        const highestCompletedLevel = Math.max(0, ...completedLevelIds);
        const canViewCertificate = completedLevelIds.length === 3 && certificateId;

        return (
            <div className={styles.container}>
                <header className={styles.header}>
                    <h1>🎓 Eco Quiz & Certification</h1>
                    <p>Complete all 3 levels to earn your sustainability certification</p>
                </header>

                <div className={styles.levelGrid}>
                    {levels.map((level) => {
                        const isCompleted = completedLevelIds.includes(level.id);
                        const isLocked = level.level_number > (highestCompletedLevel + 1);
                        const isAvailable = !isLocked;

                        return (
                            <Card key={level.id} className={`${styles.levelCard} ${isLocked ? styles.locked : ''}`}>
                                <div className={styles.levelHeader}>
                                    <span className={styles.levelBadge}>Level {level.level_number}</span>
                                    {isCompleted && <span className={styles.checkIcon}>✅</span>}
                                    {isLocked && <span className={styles.lockIcon}>🔒</span>}
                                </div>
                                <h2>{level.level_name}</h2>
                                <p>{level.description}</p>
                                <p className={styles.levelInfo}>
                                    {level.total_questions} questions • {level.required_correct}+ correct to pass
                                </p>
                                <Button
                                    variant={isLocked ? 'secondary' : 'primary'}
                                    disabled={isLocked}
                                    onClick={() => handleStartLevel(level)}
                                    className={styles.startBtn}
                                >
                                    {isLocked ? 'Locked' : isCompleted ? 'Retake' : 'Start Challenge'}
                                </Button>
                            </Card>
                        );
                    })}
                </div>

                {canViewCertificate && (
                    <Card className={styles.certBanner}>
                        <div className={styles.certContent}>
                            <h2>🏆 Certification Unlocked!</h2>
                            <p>Congratulations! You've completed all levels.</p>
                            <Button variant="primary" onClick={() => setView('certificate')}>
                                View Certificate
                            </Button>
                        </div>
                    </Card>
                )}
            </div>
        );
    }

    // QUIZ VIEW
    if (view === 'quiz') {
        if (!currentLevel || !questions[currentQuestionIndex] || !progress) {
            return (
                <div className={styles.container}>
                    <Card>
                        <h2>Error Loading Quiz</h2>
                        <Button onClick={handleBackToDashboard}>Back to Dashboard</Button>
                    </Card>
                </div>
            );
        }

        const currentQuestion = questions[currentQuestionIndex];
        const questionProgress = ((currentQuestionIndex + 1) / 10) * 100;
        const totalAnswered = progress.correct_answers + progress.incorrect_answers;

        return (
            <div className={styles.container}>
                <div className={styles.quizHeader}>
                    <Button variant="secondary" size="sm" onClick={handleBackToDashboard}>
                        Quit
                    </Button>
                    <span className={styles.qCount}>
                        Question {currentQuestionIndex + 1} / 10
                    </span>
                    <span className={styles.score}>
                        ✅ {progress.correct_answers} correct
                    </span>
                </div>

                <div className={styles.progressBar}>
                    <div className={styles.progressFill} style={{ width: `${questionProgress}%` }} />
                </div>

                <Card className={styles.questionCard}>
                    <h2 className={styles.questionText}>{currentQuestion.question}</h2>
                    <div className={styles.optionsGrid}>
                        <button
                            className={styles.optionBtn}
                            onClick={() => handleAnswer('A')}
                        >
                            <span className={styles.optLabel}>A</span>
                            {currentQuestion.option_a}
                        </button>
                        <button
                            className={styles.optionBtn}
                            onClick={() => handleAnswer('B')}
                        >
                            <span className={styles.optLabel}>B</span>
                            {currentQuestion.option_b}
                        </button>
                        <button
                            className={styles.optionBtn}
                            onClick={() => handleAnswer('C')}
                        >
                            <span className={styles.optLabel}>C</span>
                            {currentQuestion.option_c}
                        </button>
                        <button
                            className={styles.optionBtn}
                            onClick={() => handleAnswer('D')}
                        >
                            <span className={styles.optLabel}>D</span>
                            {currentQuestion.option_d}
                        </button>
                    </div>
                </Card>
            </div>
        );
    }

    // RESULT VIEW
    if (view === 'result') {
        if (!progress || !currentLevel) return null;

        const passed = progress.passed;
        const scoreMessage = `${progress.correct_answers} / 10 correct`;

        return (
            <div className={styles.container}>
                <Card className={`${styles.resultCard} ${passed ? styles.success : styles.fail}`}>
                    <div className={styles.resultIcon}>{passed ? '🎉' : '😔'}</div>
                    <h1>{passed ? 'Level Passed!' : 'Not Quite There'}</h1>
                    <p className={styles.scoreText}>{scoreMessage}</p>

                    {passed ? (
                        <p>Great job! You've demonstrated strong knowledge in {currentLevel.level_name}.</p>
                    ) : (
                        <p>You need at least {currentLevel.required_correct} correct answers to pass. Keep studying and try again!</p>
                    )}

                    <div className={styles.actionRow}>
                        <Button variant="secondary" onClick={handleBackToDashboard}>
                            Back to Dashboard
                        </Button>
                        {!passed && (
                            <Button variant="primary" onClick={() => handleStartLevel(currentLevel)}>
                                Retry Level
                            </Button>
                        )}
                        {passed && currentLevel.level_number < 3 && (
                            <Button variant="primary" onClick={handleBackToDashboard}>
                                Next Level
                            </Button>
                        )}
                        {passed && currentLevel.level_number === 3 && certificateId && (
                            <Button variant="primary" onClick={() => setView('certificate')}>
                                View Certificate
                            </Button>
                        )}
                    </div>
                </Card>
            </div>
        );
    }

    // CERTIFICATE VIEW
    if (view === 'certificate') {
        if (!certificateId) return null;

        const handleDownload = async () => {
            const certificateElement = document.getElementById('certificate-content');
            if (!certificateElement) return;

            try {
                // Dynamically import libraries
                const html2canvas = (await import('html2canvas')).default;
                const { jsPDF } = await import('jspdf');

                // Capture the certificate as canvas with high quality
                const canvas = await html2canvas(certificateElement, {
                    scale: 3,
                    useCORS: true,
                    logging: false,
                    backgroundColor: '#f0fdf4',
                    width: certificateElement.scrollWidth,
                    height: certificateElement.scrollHeight
                });

                // Create PDF in portrait mode
                const pdf = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                // A4 portrait dimensions
                const pdfWidth = 210;
                const pdfHeight = 297;

                // Calculate dimensions to fit while maintaining aspect ratio
                const canvasAspect = canvas.width / canvas.height;
                const pdfAspect = pdfWidth / pdfHeight;

                let imgWidth, imgHeight, xOffset, yOffset;

                if (canvasAspect > pdfAspect) {
                    // Canvas is wider - fit to width
                    imgWidth = pdfWidth - 20; // 10mm margin on each side
                    imgHeight = imgWidth / canvasAspect;
                    xOffset = 10;
                    yOffset = (pdfHeight - imgHeight) / 2;
                } else {
                    // Canvas is taller - fit to height
                    imgHeight = pdfHeight - 20; // 10mm margin top/bottom
                    imgWidth = imgHeight * canvasAspect;
                    xOffset = (pdfWidth - imgWidth) / 2;
                    yOffset = 10;
                }

                // Add image to PDF
                const imgData = canvas.toDataURL('image/png', 1.0);
                pdf.addImage(imgData, 'PNG', xOffset, yOffset, imgWidth, imgHeight);

                // Download the PDF
                pdf.save(`ReLief-Certificate-${certificateId}.pdf`);
            } catch (error) {
                console.error('Error generating PDF:', error);
                toast('Failed to generate PDF. Please try again.', 'error');
            }
        };

        return (
            <div className={styles.container}>
                <div className={styles.certToolbar}>
                    <Button variant="secondary" onClick={handleBackToDashboard}>
                        ← Back to Quiz
                    </Button>
                    <Button variant="primary" onClick={handleDownload}>
                        📥 Download PDF
                    </Button>
                </div>

                <div className={styles.certificatePaper} id="certificate-content">
                    <div className={styles.certBorder}>
                        {/* Decorative corner elements */}
                        <div className={styles.cornerTopLeft}></div>
                        <div className={styles.cornerTopRight}></div>
                        <div className={styles.cornerBottomLeft}></div>
                        <div className={styles.cornerBottomRight}></div>

                        {/* Header with logo */}
                        <div className={styles.certHeader}>
                            <div className={styles.certLogo}>🌱</div>
                            <h1>Certificate of Achievement</h1>
                            <div className={styles.certSubtitle}>Sustainability & Carbon Literacy Program</div>
                        </div>

                        {/* Main content */}
                        <div className={styles.certBody}>
                            <p className={styles.certIntro}>This certificate is proudly presented to</p>
                            <h2 className={styles.certName}>{user.fullName || user.username || user.firstName || 'Eco Warrior'}</h2>
                            <p className={styles.certText}>for successfully completing the comprehensive</p>
                            <h3 className={styles.certProgram}>ReLief Eco Quiz Certification</h3>
                            <p className={styles.certAchievement}>Demonstrating exceptional knowledge and commitment across all three competency levels:</p>
                            <div className={styles.certLevels}>
                                <span className={styles.levelBadgeGreen}>✓ Eco Beginner</span>
                                <span className={styles.levelBadgeGreen}>✓ Climate Aware</span>
                                <span className={styles.levelBadgeGreen}>✓ Sustainability Expert</span>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className={styles.certFooter}>
                            <div className={styles.certInfo}>
                                <div className={styles.certId}>
                                    <small>Certificate ID</small>
                                    <strong>{certificateId}</strong>
                                </div>
                                <div className={styles.certDate}>
                                    <small>Issue Date</small>
                                    <strong>{new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</strong>
                                </div>
                            </div>
                            <div className={styles.certSeal}>
                                <div className={styles.sealInner}>
                                    <div className={styles.sealIcon}>🏆</div>
                                    <div className={styles.sealText}>VERIFIED</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return null;
}
