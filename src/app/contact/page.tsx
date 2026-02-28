'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, Mail, Send, ChevronDown, MessageSquare, Globe, ShieldCheck, Handshake, Newspaper, Paperclip, Flag } from 'lucide-react';
import { ScrollReveal } from '@/components/ui/ScrollReveal';
import { useToast } from '@/context/ToastContext';

import styles from './contact.module.css';

export default function ContactPage() {
    const { toast } = useToast();
    const [formState, setFormState] = useState<'idle' | 'sending' | 'sent'>('idle');
    const [fileName, setFileName] = useState<string | null>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            setFileName(e.target.files[0].name);
        }
    };

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        setFormState('sending');

        const formData = new FormData(e.currentTarget);
        const fullName = formData.get('fullName');
        const emailAddress = formData.get('emailAddress');
        const subject = formData.get('subject');
        const message = formData.get('message');

        try {
            const response = await fetch('/api/contact', {
                method: 'POST',
                // Removing Content-Type forces the browser to set the correct multipart/form-data boundary
                body: formData,
            });

            if (response.ok) {
                setFormState('sent');
                toast('Message sent successfully! We will get back to you soon.', 'success');
            } else {
                const errorData = await response.json().catch(() => ({}));
                setFormState('idle');
                toast(errorData.error || 'Failed to send message. Please try again later.', 'error');
            }
        } catch (error) {
            console.error('Error sending message:', error);
            setFormState('idle');
            toast('An error occurred while sending your message. Please try again.', 'error');
        }
    };

    return (
        <div className={styles.container} style={{ opacity: 1, paddingTop: 'calc(var(--nav-height) + 2rem)' }}>
            <div className={styles.bgDecorationTop} />
            <div className={styles.bgDecorationBlob} />

            <nav className={styles.navContainer}>
                <Link href="/" className={styles.backLink}>
                    <ArrowLeft size={16} className={styles.backIcon} />
                    Back to Home
                </Link>
            </nav>

            <main className={styles.mainContent}>
                <ScrollReveal>
                    <div className={styles.headerSection}>
                        <div className={styles.pillLabel}>
                            <Mail size={12} /> Contact ReLief
                        </div>
                        <h1 className={styles.title}>
                            Let's Build Climate <br className="hidden md:block" />
                            <span className={styles.highlight}>Impact Together</span>
                        </h1>
                        <p className={styles.subtitle}>
                            Have a question? Found a bug? Want to collaborate? Organizing a local climate initiative? We’re here for it. ReLief is built around community-driven environmental progress — and your feedback helps us improve the platform for everyone.
                        </p>
                    </div>
                </ScrollReveal>

                <div className={styles.contentGrid}>
                    <div className={styles.contactInfoList}>
                        <ScrollReveal delay={100}>
                            <div className={styles.contactInfoList}>
                                {[
                                    {
                                        icon: <Mail size={24} />,
                                        label: "General Inquiries",
                                        desc: "General questions & info.",
                                        value: "reliefearth0@gmail.com",
                                        href: "mailto:reliefearth0@gmail.com",
                                        iconClass: styles.iconGeneral
                                    },
                                    {
                                        icon: <Globe size={24} />,
                                        label: "General Support",
                                        desc: "For technical issues, dashboard errors, login problems, or AI bill scanner questions. Response Time: 24–72 business hours.",
                                        value: "reliefearth0@gmail.com",
                                        href: "mailto:reliefearth0@gmail.com",
                                        iconClass: styles.iconSupport
                                    },
                                    {
                                        icon: <Handshake size={24} />,
                                        label: "Partnerships & Collaborations",
                                        desc: "Sustainability partnerships, educational collaborations, climate organizations, corporate wellness programs, and API integrations.",
                                        value: "reliefearth0@gmail.com",
                                        href: "mailto:reliefearth0@gmail.com",
                                        iconClass: styles.iconGeneral
                                    },
                                    {
                                        icon: <Newspaper size={24} />,
                                        label: "Press & Media",
                                        desc: "For interviews, press kits, product features, or climate-tech coverage inquiries.",
                                        value: "reliefearth0@gmail.com",
                                        href: "mailto:reliefearth0@gmail.com",
                                        iconClass: styles.iconPrivacy
                                    },
                                    {
                                        icon: <ShieldCheck size={24} />,
                                        label: "Privacy & Legal",
                                        desc: "Questions about continuous data handling, account deletion, GDPR/CCPA requests, or terms clarification.",
                                        value: "reliefearth0@gmail.com",
                                        href: "mailto:reliefearth0@gmail.com",
                                        iconClass: styles.iconPrivacy
                                    }
                                ].map((item, i) => (
                                    <div key={i} className={styles.contactCard}>
                                        <div className={`${styles.iconWrapper} ${item.iconClass}`}>
                                            {item.icon}
                                        </div>
                                        <div className={styles.contactDetails}>
                                            <h3>{item.label}</h3>
                                            <p>{item.desc}</p>
                                            <a href={item.href} className={styles.contactLink}>{item.value}</a>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </ScrollReveal>

                        <ScrollReveal delay={200}>
                            <div className={styles.reportSection}>
                                <div className={styles.reportHeader}>
                                    <div className={styles.reportBadge}>
                                        <Flag size={20} />
                                    </div>
                                    <h3>Report a Community Concern</h3>
                                </div>
                                <div className={styles.reportContent}>
                                    <p className={styles.reportDesc}>
                                        If you encounter Harassment, Misinformation, Fraudulent activity, Leaderboard manipulation, or Inappropriate content, you can report it directly through:
                                    </p>
                                    <ul className={styles.reportList}>
                                        <li>The in-app report button</li>
                                        <li>Email: <strong>reliefearth0@gmail.com</strong></li>
                                    </ul>
                                    <p className={styles.reportFooter}>
                                        We review reports confidentially and take appropriate action.
                                    </p>
                                </div>
                            </div>
                        </ScrollReveal>
                    </div>

                    <ScrollReveal delay={150}>
                        <div className={styles.formBox}>
                            <div className={styles.formBoxHeader}>
                                <h3>Send us a message</h3>
                                <p>Fill out the form below and we'll get back to you within 24-48 hours depending on the inquiry volume.</p>
                            </div>

                            {formState === 'sent' ? (
                                <div className={styles.successMessage}>
                                    <div className={styles.successIcon}>
                                        <Send size={36} />
                                    </div>
                                    <h4>Message Sent!</h4>
                                    <p>Thanks for reaching out. We've received your message and will be in touch shortly.</p>
                                    <button onClick={() => setFormState('idle')} className={styles.resetButton}>
                                        Send another message
                                    </button>
                                </div>
                            ) : (
                                <form onSubmit={handleSubmit} className={styles.form}>
                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Full Name <span className={styles.required}>*</span></label>
                                        <input type="text" name="fullName" className={styles.input} placeholder="Jane Doe" required />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Email Address <span className={styles.required}>*</span></label>
                                        <input type="email" name="emailAddress" className={styles.input} placeholder="jane@example.com" required />
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Subject <span className={styles.required}>*</span></label>
                                        <div className={styles.selectWrapper}>
                                            <select name="subject" className={`${styles.input} ${styles.select}`} required defaultValue="">
                                                <option value="" disabled>Select a subject...</option>
                                                <option value="support">Technical Support</option>
                                                <option value="access">Account Access Issue</option>
                                                <option value="scanner">AI Bill Scanner Question</option>
                                                <option value="report">Community Report</option>
                                                <option value="partnership">Partnership Inquiry</option>
                                                <option value="press">Press / Media</option>
                                                <option value="feature">Feature Request</option>
                                                <option value="feedback">General Feedback</option>
                                            </select>
                                            <ChevronDown size={18} className={styles.selectIcon} />
                                        </div>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Message <span className={styles.required}>*</span></label>
                                        <textarea name="message" className={styles.textarea} placeholder="Tell us how we can help. Include any relevant details like screenshots, error messages, or steps to reproduce an issue." required></textarea>
                                    </div>

                                    <div className={styles.formGroup}>
                                        <label className={styles.label}>Attach File <span className={styles.optional}>(Optional)</span></label>
                                        <div className={styles.fileUploadWrapper}>
                                            <input type="file" id="file" name="file" className={styles.fileInput} accept=".jpg,.png,.pdf,video/mp4,video/quicktime" onChange={handleFileChange} />
                                            <label htmlFor="file" className={styles.fileLabel}>
                                                <Paperclip size={18} />
                                                <span className={styles.fileName}>{fileName || 'Upload Image, PDF, or Video (Max: 10MB)'}</span>
                                            </label>
                                        </div>
                                    </div>

                                    <div className={styles.checkboxGroup}>
                                        <input type="checkbox" id="consent" className={styles.checkbox} required />
                                        <label htmlFor="consent" className={styles.checkboxLabel}>
                                            I consent to ReLief processing my information in accordance with the <Link href="/privacy">Privacy Policy</Link>.
                                        </label>
                                    </div>

                                    <button
                                        type="submit"
                                        disabled={formState === 'sending'}
                                        className={styles.submitBtn}
                                    >
                                        {formState === 'sending' ? 'Sending...' : '🌱 Send Message'}
                                    </button>

                                    <div className={styles.uxCopy}>
                                        Climate progress is built on collaboration. <br />
                                        Every message helps us make ReLief stronger, smarter, and more impactful.
                                    </div>
                                </form>
                            )}
                        </div>
                    </ScrollReveal>
                </div>
            </main>
        </div>
    );
}
