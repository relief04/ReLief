"use client";

import React from 'react';
import { Card } from '@/components/ui/Card';
import styles from './page.module.css';
import Link from 'next/link';

export default function AccuracyPage() {
    return (
        <div className={styles.container}>
            <header className={styles.header}>
                <h1>Accuracy & Methodology</h1>
                <p>How we calculate your carbon footprint and our data sources.</p>
            </header>

            <div className={styles.content}>
                <section className={styles.section}>
                    <h2>Our Philosophy</h2>
                    <p>
                        At ReLief, we believe transparency is the foundation of trust. We use internationally recognized emission factors
                        to provide the most accurate estimate of your personal carbon footprint. While personal carbon tracking
                        always involves some level of estimation, our models are refined daily to stay as close to reality as possible.
                    </p>
                </section>

                <div className={styles.sourceGrid}>
                    <Card className={styles.methodCard}>
                        <div className={styles.icon}>🔬</div>
                        <h3>Scientific Basis</h3>
                        <p>
                            We follow the **GHG Protocol Corporate Standard** for categorizing emissions into Scope 1, 2, and 3.
                            Our calculations focus on high-impact personal activities: transportation, home energy, and consumer goods.
                        </p>
                    </Card>

                    <Card className={styles.methodCard}>
                        <div className={styles.icon}>📊</div>
                        <h3>Data Sources</h3>
                        <p>
                            Our emission factors are sourced from:
                            - **IPCC:** Intergovernmental Panel on Climate Change
                            - **IEA:** International Energy Agency (Grid Intensities)
                            - **EPA:** Environmental Protection Agency
                            - **DEFRA:** UK Government GHG Conversion Factors
                        </p>
                    </Card>
                </div>

                <section className={styles.factorsTable}>
                    <h2>Standard Emission Factors</h2>
                    <div className={styles.tableWrapper}>
                        <table className={styles.table}>
                            <thead>
                                <tr>
                                    <th>Category</th>
                                    <th>Activity / Unit</th>
                                    <th>Factor (kg CO₂e)</th>
                                    <th>Source</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <td>Electricity</td>
                                    <td>per kWh</td>
                                    <td>0.475</td>
                                    <td>IEA Global Average</td>
                                </tr>
                                <tr>
                                    <td>LPG</td>
                                    <td>per kg</td>
                                    <td>2.980</td>
                                    <td>DEFRA</td>
                                </tr>
                                <tr>
                                    <td>Petrol Car</td>
                                    <td>per km</td>
                                    <td>0.170</td>
                                    <td>EPA</td>
                                </tr>
                                <tr>
                                    <td>Short Flight</td>
                                    <td>per km</td>
                                    <td>0.150</td>
                                    <td>GHG Protocol</td>
                                </tr>
                                <tr>
                                    <td>Beef</td>
                                    <td>per kg</td>
                                    <td>27.00</td>
                                    <td>IPCC / FAO</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </section>

                <Card className={styles.disclaimerCard}>
                    <h3>💡 Understanding the "e" in CO₂e</h3>
                    <p>
                        We use **Carbon Dioxide Equivalent (CO₂e)**. This means we account for other greenhouse gases
                        like Methane (CH₄) and Nitrous Oxide (N₂O) by converting them into the amount of CO₂
                        that would have the equivalent global warming impact.
                    </p>
                </Card>

                <div className={styles.footer}>
                    <p>Have questions about our math? <Link href="/contact">Contact our Environmental Team</Link></p>
                </div>
            </div>
        </div>
    );
}
