'use client';

import React from 'react';
import { useUser } from '@clerk/nextjs';
import CertificateTemplate from '@/components/certificate/CertificateTemplate';

export default function CertificatePreviewPage() {
    const { user } = useUser();

    // Default values if no user (or waiting for auth)
    const name = user?.fullName || "Guest User";

    return (
        <CertificateTemplate
            recipientName={name}
            achievementTitle="ReLief Sustainability Quiz Program"
            description="has successfully completed the assessment..."
        />
    );
}
