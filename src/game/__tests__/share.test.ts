import { describe, expect, it } from 'vitest';
import { cardFileName, displayUrl, pickQuip } from '../ui/shareCard';

describe('tarjeta de resultado', () => {
  it('pickQuip es estable, cae dentro de la lista y tolera valores raros', () => {
    const q = ['a', 'b', 'c'];
    expect(pickQuip(q, 4)).toBe('b');
    expect(pickQuip(q, 4)).toBe('b');
    expect(pickQuip(q, -5)).toBe('c');
    expect(pickQuip(q, NaN)).toBe('a');
    expect(pickQuip([], 3)).toBe('');
  });

  it('displayUrl quita protocolo y barra final', () => {
    expect(displayUrl('https://ivan-lsm.github.io/es/')).toBe('ivan-lsm.github.io/es');
    expect(displayUrl('http://localhost:4321/')).toBe('localhost:4321');
  });

  it('cardFileName incluye el idioma', () => {
    expect(cardFileName('en')).toBe('busca-pega-en.png');
  });
});
