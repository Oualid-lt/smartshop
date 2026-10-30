import { useTranslation } from 'react-i18next';

const texts = {
  fr: {
    barcode: 'Code-barres',
    barcodeHint: 'Facultatif : scanne ou tape le code du produit',
    scan: 'Scanner le code-barres',
    hint: 'Place le code-barres dans le cadre',
    permission:
      "L'accès à la caméra est nécessaire pour scanner. Autorise-le dans les réglages du téléphone.",
    allow: 'Autoriser la caméra',
    close: 'Fermer',
    notFound: 'Aucun produit avec ce code-barres',
  },
  ar: {
    barcode: 'الباركود',
    barcodeHint: 'اختياري: امسح رمز المنتج أو اكتبه',
    scan: 'مسح الباركود',
    hint: 'ضع الباركود داخل الإطار',
    permission: 'الوصول إلى الكاميرا ضروري للمسح. اسمح به من إعدادات الهاتف.',
    allow: 'السماح بالكاميرا',
    close: 'إغلاق',
    notFound: 'لا يوجد منتج بهذا الباركود',
  },
};

export function useScannerText() {
  const { i18n } = useTranslation();
  return i18n.language && i18n.language.startsWith('ar') ? texts.ar : texts.fr;
}