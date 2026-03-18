import { createContext, useContext, useMemo, useState } from 'react';

const I18nContext = createContext(null);

const translations = {
  en: {
    nav_dashboard: 'Dashboard',
    nav_products: 'Products',
    nav_billing: 'Billing',
    nav_productBilling: 'Voice Billing',
    nav_sales: 'Sales',
    nav_purchases: 'Purchases',
    nav_purchaseUpload: 'Upload Bill',
    nav_logout: 'Logout',

    dashboard_title: 'Dashboard',
    products_title: 'Product Management',
    billing_title: 'Billing',
    purchases_title: 'Purchase Entry',
    purchaseUpload_title: 'Purchase Bill Upload',
    sales_title: 'Sales Reports',
    login_title: 'Login',

    productBilling_title: 'Product Billing',
    productBilling_subtitle:
      'Tap the button to start voice; tap again to stop. Each time you start, search clears for a fresh match.',
    productBilling_items: 'Items',
    productBilling_quantity: 'Qty',
    productBilling_total: 'Total',
    productBilling_hold_help: 'Tap the button to speak',
    productBilling_voiceTapOn: 'Tap to speak & bill',
    productBilling_voiceTapOff: 'Tap to stop',
    productBilling_recognizedText: 'Recognized text',
    productBilling_recentBills: 'Recent bills',
    productBilling_print: 'Print',
    productBilling_noRecentBills: 'No recent bills.',
    productBilling_smartSearch: 'Smart product search',
    productBilling_inputPlaceholder: 'Type or speak e.g. “2 soap” or “milk”',
    productBilling_billingList: 'Billing List',
    productBilling_reset: 'Reset',
    productBilling_createBill: 'Create Bill',
    productBilling_voiceNotSupported: 'Voice not supported',
    productBilling_listening: 'Listening',
    productBilling_speakNow: 'Speak now',
    productBilling_tapMic: 'Tap mic to speak',
    productBilling_loadingVoice: 'Loading…',
  },
  ta: {
    nav_dashboard: 'டாஷ்போர்டு',
    nav_products: 'பொருட்கள்',
    nav_billing: 'பில்லிங்',
    nav_productBilling: 'வாய்ஸ் பில்லிங்',
    nav_sales: 'விற்பனை',
    nav_purchases: 'கொள்முதல்',
    nav_purchaseUpload: 'பில் பதிவேற்றம்',
    nav_logout: 'வெளியேறு',

    dashboard_title: 'டாஷ்போர்டு',
    products_title: 'பொருள் மேலாண்மை',
    billing_title: 'பில்லிங்',
    purchases_title: 'கொள்முதல் பதிவு',
    purchaseUpload_title: 'கொள்முதல் பில் பதிவேற்றம்',
    sales_title: 'விற்பனை அறிக்கைகள்',
    login_title: 'உள்நுழைவு',

    productBilling_title: 'பொருள் பில்லிங்',
    productBilling_subtitle:
      'பேச பட்டனை அழுத்தவும்; நிறுத்த மீண்டும் அழுத்தவும். ஒவ்வொரு முறை தொடங்கும்போது தேடல் காலியாகும்.',
    productBilling_items: 'பொருட்கள்',
    productBilling_quantity: 'அளவு',
    productBilling_total: 'மொத்தம்',
    productBilling_hold_help: 'பேச பட்டனை அழுத்தவும்',
    productBilling_voiceTapOn: 'பேச பட்டனை அழுத்து',
    productBilling_voiceTapOff: 'நிறுத்த அழுத்து',
    productBilling_recognizedText: 'கண்டறியப்பட்ட உரை',
    productBilling_recentBills: 'சமீபத்திய பில்கள்',
    productBilling_print: 'அச்சு',
    productBilling_noRecentBills: 'சமீபத்திய பில்கள் இல்லை.',
    productBilling_smartSearch: 'ஸ்மார்ட் பொருள் தேடல்',
    productBilling_inputPlaceholder: '“2 சோப்”, “பால்” போன்றதைத் type / voice செய்யவும்',
    productBilling_billingList: 'பில் பட்டியல்',
    productBilling_reset: 'ரீசெட்',
    productBilling_createBill: 'பில் உருவாக்கு',
    productBilling_voiceNotSupported: 'இந்த உலாவியில் வொய்ஸ் இல்லை',
    productBilling_listening: 'கேட்கிறது',
    productBilling_speakNow: 'இப்போது பேசுங்கள்',
    productBilling_tapMic: 'மைக்கைத் தட்டி பேசுங்கள்',
    productBilling_loadingVoice: 'ஏற்றுகிறது…',
  },
};

export function I18nProvider({ children }) {
  const [language, setLanguage] = useState('en');

  const value = useMemo(
    () => ({
      language,
      setLanguage,
      t: (key) => translations[language]?.[key] || translations.en[key] || key,
    }),
    [language]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) {
    throw new Error('useI18n must be used within I18nProvider');
  }
  return ctx;
}

