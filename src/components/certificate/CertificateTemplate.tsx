import Image from 'next/image';
import { Download, Share2 } from 'lucide-react';
import styles from './Certificate.module.css';
import { Logo } from '@/components/ui/Logo';

interface CertificateProps {
    recipientName: string;
    achievementTitle: string;
    description: string;
    issueDate?: string;
    certificateId?: string;
}

export default function CertificateTemplate({
    recipientName,
    achievementTitle,
    description,
    issueDate = new Date().toLocaleDateString(),
    certificateId = `CERT-${Math.random().toString(36).substr(2, 9).toUpperCase()}`
}: CertificateProps) {

    const handleDownload = () => {
        window.print();
    };

    return (
        <div className={styles.certificateContainer}>
            <div className={styles.paper} id="certificate-node">
                {/* Decorative Frame */}
                <div className={styles.borderFrame}></div>
                <div className={`${styles.corner} ${styles.cornerTL}`}></div>
                <div className={`${styles.corner} ${styles.cornerTR}`}></div>
                <div className={`${styles.corner} ${styles.cornerBL}`}></div>
                <div className={`${styles.corner} ${styles.cornerBR}`}></div>

                {/* Watermark */}
                <div className={styles.watermark}></div>

                <div className={styles.content}>
                    {/* Header */}
                    <div className="mb-8 scale-125">
                        <Logo size="lg" />
                    </div>

                    <div className={styles.certifiedText}>Criterion of Excellence</div>

                    <div>This is to certify that</div>

                    <h1 className={styles.userName}>{recipientName}</h1>

                    <p className={styles.bodyText}>
                        Has successfully completed the <span className={styles.highlight}>{achievementTitle}</span> and has demonstrated a strong commitment toward environmental responsibility and carbon reduction awareness.
                    </p>

                    {/* Footer */}
                    <div className={styles.footer}>
                        <div className={styles.dateBlock}>
                            <div className={styles.signatureImage}>{issueDate}</div>
                            <div className={styles.designationLine}>Issue Date</div>
                        </div>

                        <div className={styles.headerLogo} style={{ opacity: 0.2 }}>
                            <div style={{ width: 60, height: 60, border: '4px solid #059669', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <div style={{ width: 40, height: 40, border: '1px solid #059669', borderRadius: '50%' }}></div>
                            </div>
                        </div>

                        <div className={styles.signatureBlock}>
                            <div className={styles.signatureImage}>The ReLief Team</div>
                            <div className={styles.designationLine}>ReLief Project Authority</div>
                        </div>
                    </div>

                    <div className={styles.metaInfo}>
                        Certificate ID: {certificateId} • Verified by ReLief Protocol • www.relief-eco.com
                    </div>
                </div>
            </div>

            <div className={styles.controls}>
                <button onClick={handleDownload} className={styles.printButton}>
                    <Download size={20} />
                    Download PDF / Print
                </button>
            </div>
        </div>
    );
}
