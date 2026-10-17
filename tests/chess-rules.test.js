import test from 'node:test';
import assert from 'node:assert/strict';
import { Chess } from 'chess.js';

test('standard opening exposes 20 legal moves', () => {
  const chess = new Chess();
  assert.equal(chess.moves().length, 20);
});

test('en passant capture is legal and removes the passed pawn', () => {
  const chess = new Chess();
  for (const move of ['e4', 'a6', 'e5', 'd5']) chess.move(move);
  const move = chess.move({ from: 'e5', to: 'd6' });
  assert.equal(move.isEnPassant(), true);
  assert.equal(chess.get('d5'), undefined);
  assert.deepEqual(chess.get('d6'), { type: 'p', color: 'w' });
});

test('castling is legal when path is clear and king is not in check', () => {
  const chess = new Chess();
  for (const move of ['Nf3', 'Nf6', 'g3', 'g6', 'Bg2', 'Bg7']) chess.move(move);
  assert.ok(chess.moves().includes('O-O'));
  const move = chess.move('O-O');
  assert.equal(move.isKingsideCastle(), true);
  assert.deepEqual(chess.get('f1'), { type: 'r', color: 'w' });
});

test('checkmate is detected and no legal moves remain', () => {
  const chess = new Chess();
  for (const move of ['f3', 'e5', 'g4', 'Qh4#']) chess.move(move);
  assert.equal(chess.isCheckmate(), true);
  assert.equal(chess.moves().length, 0);
});

test('stalemate is detected as a draw, not checkmate', () => {
  const chess = new Chess('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1');
  assert.equal(chess.isStalemate(), true);
  assert.equal(chess.isCheckmate(), false);
});

test('threefold repetition is detected', () => {
  const chess = new Chess();
  for (const move of ['Nf3', 'Nf6', 'Ng1', 'Ng8', 'Nf3', 'Nf6', 'Ng1', 'Ng8']) chess.move(move);
  assert.equal(chess.isThreefoldRepetition(), true);
});

test('the 50-move rule and insufficient material are detected', () => {
  const fiftyMove = new Chess('8/8/8/8/8/8/4K3/4k3 w - - 100 51');
  assert.equal(fiftyMove.isDrawByFiftyMoves(), true);
  const insufficient = new Chess('8/8/8/8/8/8/4K3/3Nk3 w - - 0 1');
  assert.equal(insufficient.isInsufficientMaterial(), true);
});

test('pawn promotion is represented as a legal move', () => {
  const chess = new Chess('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
  const move = chess.move({ from: 'a7', to: 'a8', promotion: 'q' });
  assert.equal(move.isPromotion(), true);
  assert.deepEqual(chess.get('a8'), { type: 'q', color: 'w' });
});
