import { Button } from './ui';

/**
 * Barre de boutons d'export réutilisable.
 * Chaque handler est optionnel : seuls les boutons dont le handler est fourni s'affichent.
 */
export default function ExportButtons({ onExcel, onPDF, onWord, disabled }) {
  return (
    <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
      {onExcel && (
        <Button variant="ghost" onClick={onExcel} disabled={disabled}>
          ⬇️ Excel
        </Button>
      )}
      {onPDF && (
        <Button variant="ghost" onClick={onPDF} disabled={disabled}>
          ⬇️ PDF
        </Button>
      )}
      {onWord && (
        <Button variant="ghost" onClick={onWord} disabled={disabled}>
          ⬇️ Word
        </Button>
      )}
    </div>
  );
}
