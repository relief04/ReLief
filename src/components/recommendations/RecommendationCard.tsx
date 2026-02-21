import React from 'react';
import { Recommendation } from '@/lib/recommendationEngine';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import styles from './RecommendationCard.module.css';

interface RecommendationCardProps {
    recommendation: Recommendation;
    onComplete?: (id: string) => void;
    onDismiss?: (id: string) => void;
}

const CATEGORY_INFO = {
    transport: { icon: '🚗', color: '#1976d2', label: 'Transportation' },
    energy: { icon: '⚡', color: '#f57f17', label: 'Energy' },
    food: { icon: '🥗', color: '#2e7d32', label: 'Food' },
    waste: { icon: '♻️', color: '#7b1fa2', label: 'Waste' }
};

export const RecommendationCard: React.FC<RecommendationCardProps> = ({
    recommendation,
    onComplete,
    onDismiss
}) => {
    const categoryInfo = CATEGORY_INFO[recommendation.category];
    const priorityStars = '⭐'.repeat(recommendation.priority);

    return (
        <Card className={styles.card} hoverEffect>
            {/* Category Badge */}
            <div
                className={styles.categoryBadge}
                style={{ background: categoryInfo.color }}
            >
                <span>{categoryInfo.icon}</span>
                <span>{categoryInfo.label}</span>
            </div>

            {/* Content */}
            <div className={styles.content}>
                <h3 className={styles.title}>{recommendation.title}</h3>
                <p className={styles.description}>{recommendation.description}</p>

                {/* Impact & Priority */}
                <div className={styles.metadata}>
                    <div className={styles.impact}>
                        <span className={styles.impactIcon}>🌍</span>
                        <span className={styles.impactText}>
                            Save up to {recommendation.potential_impact.toFixed(1)} kg CO₂
                        </span>
                    </div>
                    <div className={styles.priority} title={`Priority: ${recommendation.priority}/5`}>
                        {priorityStars}
                    </div>
                </div>
            </div>

            {/* Actions */}
            <div className={styles.actions}>
                <Button
                    variant="primary"
                    size="sm"
                    onClick={() => onComplete?.(recommendation.id)}
                >
                    ✓ Mark Complete
                </Button>
                <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onDismiss?.(recommendation.id)}
                >
                    Dismiss
                </Button>
            </div>
        </Card>
    );
};
