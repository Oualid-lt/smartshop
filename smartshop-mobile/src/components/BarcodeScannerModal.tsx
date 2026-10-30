import React from 'react';

interface Props {
  visible: boolean;
  onClose: () => void;
  onScanned: (code: string) => void;
}

export default function BarcodeScannerModal(_props: Props) {
  return null;
}