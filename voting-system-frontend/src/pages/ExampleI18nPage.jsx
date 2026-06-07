import React from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../components/LanguageSwitcher';

export default function ExampleI18nPage() {
  const { t } = useTranslation();

  return (
    <div style={{ padding: 20 }}>
      <LanguageSwitcher />
      <h1>{t('welcome')}</h1>
      <p>{t('example_text')}</p>
      <p>{t('greeting_user', { name: 'Amina' })}</p>
    </div>
  );
}
