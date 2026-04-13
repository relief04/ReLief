import React, { useState, useEffect } from 'react';
import { HelpCircle, CheckCircle2, XCircle } from 'lucide-react';
import styles from './EcoQuizCard.module.css';

const MOCK_QUESTION = {
    id: 'q1',
    text: "Which of the following significantly reduces a household's heating carbon footprint?",
    options: [
        { id: 'a', text: 'Leaving electronics plugged in' },
        { id: 'b', text: 'Lowering the thermostat by 2 degrees' },
        { id: 'c', text: 'Using incandescent bulbs' },
        { id: 'd', text: 'Keeping windows open while heating' }
    ],
    correctId: 'b',
    explanation: 'Lowering your thermostat by just 2 degrees in winter can save up to 10% on energy use and significantly reduce emissions.'
};

export const EcoQuizCard: React.FC = () => {
    const [selected, setSelected] = useState<string | null>(null);
    const [status, setStatus] = useState<'idle' | 'correct' | 'wrong'>('idle');
    const [popupVisible, setPopupVisible] = useState(false);

    const handleSelect = (id: string) => {
        if (selected) return; // Prevent re-answering
        
        setSelected(id);
        if (id === MOCK_QUESTION.correctId) {
            setStatus('correct');
            setPopupVisible(true);
            setTimeout(() => setPopupVisible(false), 2000);
        } else {
            setStatus('wrong');
        }
    };

    return (
        <div className={`bento-card col-span-4 ${styles.container} ${status === 'correct' ? styles.correctFlash : ''} ${status === 'wrong' ? styles.wrongFlash : ''}`}>
            {/* Context Floating +X Karma Pop-up */}
            {popupVisible && (
                <div className={styles.karmaPopup}>
                    +50 Karma
                </div>
            )}

            <div className={styles.header}>
                <div className={styles.badge}>
                    <HelpCircle size={14} />
                    <span>Daily Eco-Quiz</span>
                </div>
                <span className={styles.progressText}>Question 3 of 10</span>
            </div>

            <div className={styles.progressTrack}>
                <div className={styles.progressFill} style={{ width: '30%' }} />
            </div>

            <h4 className={styles.questionText}>{MOCK_QUESTION.text}</h4>

            <div className={styles.optionsGrid}>
                {MOCK_QUESTION.options.map(opt => {
                    const isSelected = selected === opt.id;
                    const isCorrect = opt.id === MOCK_QUESTION.correctId;
                    
                    let btnClass = styles.optionBtn;
                    if (selected) {
                        if (isCorrect) btnClass += ` ${styles.optionSuccess}`;
                        else if (isSelected && !isCorrect) btnClass += ` ${styles.optionError}`;
                        else btnClass += ` ${styles.optionFaded}`;
                    }

                    return (
                        <button 
                            key={opt.id}
                            className={btnClass}
                            onClick={() => handleSelect(opt.id)}
                            disabled={!!selected}
                        >
                            <span className={styles.optLetter}>{opt.id.toUpperCase()}</span>
                            <span className={styles.optText}>{opt.text}</span>
                            
                            {selected && isCorrect && <CheckCircle2 size={16} className={styles.iconSuccess} />}
                            {selected && isSelected && !isCorrect && <XCircle size={16} className={styles.iconError} />}
                        </button>
                    );
                })}
            </div>

            {status === 'wrong' && (
                <div className={styles.explanationBox}>
                    <strong>Not quite!</strong> {MOCK_QUESTION.explanation}
                </div>
            )}
            
            {status === 'correct' && (
                <div className={styles.explanationBoxSuccess}>
                    <strong>Correct!</strong> {MOCK_QUESTION.explanation}
                </div>
            )}
        </div>
    );
};
