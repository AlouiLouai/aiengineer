import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { Quiz } from '@/components/practice/Quiz';
import { questionsFor } from '@/content/quiz';
import { sample } from '@/lib/sampling';
import { withPolicy } from '../scripts/csp.mjs';

beforeEach(() => localStorage.clear());
afterEach(cleanup);

describe('sampling', () => {
  const logits = [3, 2, 1, 0];
  const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

  it('is greedy at temperature 0', () => expect(sample(logits, 0, 1).after).toEqual([1, 0, 0, 0]));
  it('flattens as temperature rises', () => {
    expect(sample(logits, 2, 1).after[0]).toBeLessThan(sample(logits, 0.5, 1).after[0]);
  });
  it('keeps the smallest nucleus that reaches top-p, and renormalises', () => {
    const { before, after } = sample(logits, 1, 0.7);
    expect(before[0]).toBeLessThan(0.7);
    expect(after.filter((p) => p > 0)).toHaveLength(2);
    expect(sum(after)).toBeCloseTo(1);
  });
});

describe('quiz', () => {
  it('marks answers, explains them and ends with the score', () => {
    const questions = questionsFor('llm/tokenization');
    render(<Quiz questions={questions} />);
    fireEvent.click(screen.getAllByRole('button')[questions[0].answer]);
    expect(screen.getByText('Correct.')).toBeTruthy();
    fireEvent.click(screen.getByText('Next question'));
    expect(document.activeElement?.tagName).toBe('H2');
    fireEvent.click(screen.getAllByRole('button')[(questions[1].answer + 1) % 3]);
    expect(screen.getByText('Not quite.')).toBeTruthy();
    fireEvent.click(screen.getByText('See the result'));
    expect(screen.getByText('1 / 2')).toBeTruthy();
  });
});

describe('content security policy', () => {
  it('hashes inline scripts and forbids any other', () => {
    const html = withPolicy('<html><head></head><body><script>alert(1)</script><script src="/a.js"></script></body></html>');
    expect(html).toContain("script-src 'self' 'sha256-bhHHL3z2vDgxUt0W3dWQOrprscmda2Y5pLsLg4GF+pI='");
    expect(html.match(/sha256-/g)).toHaveLength(1);
    expect(html.split('script-src')[1].split(';')[0]).not.toContain('unsafe-inline');
    expect(html).not.toContain('cloudflareinsights');
  });
  it('allows the analytics beacon only on pages that load it', () => {
    const html = withPolicy(
      '<html><head></head><body><script defer src="https://static.cloudflareinsights.com/beacon.min.js"></script></body></html>',
    );
    expect(html).toContain("script-src 'self' https://static.cloudflareinsights.com");
    expect(html).toContain("connect-src 'self' https://cloudflareinsights.com");
  });
});
