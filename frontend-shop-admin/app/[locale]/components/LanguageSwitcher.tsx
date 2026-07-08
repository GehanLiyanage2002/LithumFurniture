"use client";

import { useLocale } from 'next-intl';
import { useRouter, usePathname } from '@/i18n/routing';
import { Globe } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export default function LanguageSwitcher() {
  const locale = useLocale();
  const router = useRouter();
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleLanguageChange = (nextLocale: string) => {
    setIsOpen(false);
    if (nextLocale !== locale) {
      router.replace(pathname, { locale: nextLocale });
    }
  };

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef} style={{ zIndex: 1000 }}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex', 
          alignItems: 'center', 
          gap: '10px', 
          background: isOpen ? 'var(--primary)' : '#ffffff',
          border: isOpen ? '1px solid var(--primary)' : '1px solid var(--border)',
          padding: '10px 18px', 
          borderRadius: '30px', 
          cursor: 'pointer',
          color: isOpen ? '#ffffff' : 'var(--text-main)', 
          fontWeight: 600, 
          fontSize: '14px',
          boxShadow: isOpen ? '0 8px 20px rgba(13, 148, 136, 0.3)' : '0 2px 8px rgba(0, 0, 0, 0.05)',
          transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
          transform: isOpen ? 'translateY(-1px)' : 'translateY(0)',
        }}
        onMouseOver={(e) => {
          if (!isOpen) {
            e.currentTarget.style.boxShadow = '0 6px 12px rgba(0, 0, 0, 0.08)';
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.border = '1px solid var(--primary)';
          }
        }}
        onMouseOut={(e) => {
          if (!isOpen) {
            e.currentTarget.style.boxShadow = '0 2px 8px rgba(0, 0, 0, 0.05)';
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.border = '1px solid var(--border)';
          }
        }}
      >
        <Globe size={18} color={isOpen ? '#ffffff' : 'var(--primary)'} style={{ transition: 'all 0.3s ease' }} />
        <span style={{ transition: 'all 0.3s ease' }}>{locale === 'en' ? 'EN / English' : 'SI / සිංහල'}</span>
        <svg 
          width="12" 
          height="12" 
          viewBox="0 0 24 24" 
          fill="none" 
          stroke="currentColor" 
          strokeWidth="2" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          style={{ 
            transition: 'transform 0.3s ease', 
            transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)',
            marginLeft: '4px',
            opacity: 0.7
          }}
        >
          <polyline points="6 9 12 15 18 9"></polyline>
        </svg>
      </button>

      <div style={{
        position: 'absolute', 
        right: 0, 
        marginTop: '12px',
        width: '160px', 
        background: '#ffffff', 
        borderRadius: '16px',
        boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
        border: '1px solid var(--border)',
        overflow: 'hidden',
        opacity: isOpen ? 1 : 0,
        transform: isOpen ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.95)',
        pointerEvents: isOpen ? 'auto' : 'none',
        transition: 'all 0.2s cubic-bezier(0.16, 1, 0.3, 1)',
        transformOrigin: 'top right'
      }}>
        <div style={{ padding: '8px' }}>
          <div 
            onClick={() => handleLanguageChange('en')}
            style={{
              padding: '12px 16px', 
              cursor: 'pointer', 
              fontSize: '14px',
              borderRadius: '10px',
              background: locale === 'en' ? 'var(--primary-light)' : 'transparent',
              color: locale === 'en' ? 'var(--primary)' : 'var(--text-main)',
              fontWeight: locale === 'en' ? 600 : 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease',
              marginBottom: '4px'
            }}
            onMouseOver={(e) => {
              if (locale !== 'en') e.currentTarget.style.background = '#f3f4f6';
            }}
            onMouseOut={(e) => {
              if (locale !== 'en') e.currentTarget.style.background = 'transparent';
            }}
          >
            <span>English</span>
            {locale === 'en' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />}
          </div>
          <div 
            onClick={() => handleLanguageChange('si')}
            style={{
              padding: '12px 16px', 
              cursor: 'pointer', 
              fontSize: '14px',
              borderRadius: '10px',
              background: locale === 'si' ? 'var(--primary-light)' : 'transparent',
              color: locale === 'si' ? 'var(--primary)' : 'var(--text-main)',
              fontWeight: locale === 'si' ? 600 : 500,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              transition: 'all 0.2s ease'
            }}
            onMouseOver={(e) => {
              if (locale !== 'si') e.currentTarget.style.background = '#f3f4f6';
            }}
            onMouseOut={(e) => {
              if (locale !== 'si') e.currentTarget.style.background = 'transparent';
            }}
          >
            <span style={{ fontFamily: 'var(--font-noto-sans-sinhala), sans-serif' }}>සිංහල</span>
            {locale === 'si' && <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--primary)' }} />}
          </div>
        </div>
      </div>
    </div>
  );
}
