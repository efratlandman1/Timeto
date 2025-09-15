import React from 'react';
import { useTranslation } from 'react-i18next';
import '../styles/TermsPage.css';

const TermsPage = () => {
    const { t } = useTranslation();
    
    return (
        <div className="terms-page">
            <div className="terms-content">
                <h1>{t('termsPage.title')}</h1>
                
                <section>
                    <h2>{t('termsPage.sections.general.title')}</h2>
                    <p>
                        {t('termsPage.sections.general.content')}
                    </p>
                </section>

                <section>
                    <h2>{t('termsPage.sections.definitions.title')}</h2>
                    <p>
                        {t('termsPage.sections.definitions.content')}
                    </p>
                </section>

                <section>
                    <h2>{t('termsPage.sections.usage.title')}</h2>
                    <p>
                        {t('termsPage.sections.usage.content')}
                    </p>
                </section>

                <section>
                    <h2>{t('termsPage.sections.businessRegistration.title')}</h2>
                    <p>
                        {t('termsPage.sections.businessRegistration.content')}
                    </p>
                </section>

                <section>
                    <h2>{t('termsPage.sections.privacy.title')}</h2>
                    <p>
                        {t('termsPage.sections.privacy.content')}
                    </p>
                </section>

                <section>
                    <h2>{t('termsPage.sections.intellectualProperty.title')}</h2>
                    <p>
                        {t('termsPage.sections.intellectualProperty.content')}
                    </p>
                </section>

                <section>
                    <h2>{t('termsPage.sections.changes.title')}</h2>
                    <p>
                        {t('termsPage.sections.changes.content')}
                    </p>
                </section>

                <section>
                    <h2>{t('termsPage.sections.contact.title')}</h2>
                    <p>
                        {t('termsPage.sections.contact.content')}
                    </p>
                </section>
            </div>
        </div>
    );
};

export default TermsPage; 