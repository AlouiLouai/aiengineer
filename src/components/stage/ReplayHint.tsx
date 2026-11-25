import { RotateCcw } from 'lucide-react';

/** Tells the reader how to see a finished animation again. */
export function ReplayHint({ show }: { show: boolean }) {
  return (
    <p className={`replay-hint${show ? ' is-on' : ''}`} aria-hidden="true">
      <RotateCcw />
      <span className="for-mouse">Move the mouse here to replay</span>
      <span className="for-touch">Tap to replay</span>
    </p>
  );
}
