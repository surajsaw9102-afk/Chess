import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import zlib from 'node:zlib';

const ROOT = process.cwd();

test('Simplified Single-Player HUD in src/App.tsx excludes speed sliders, notation script bar, and multiplayer lobby', () => {
  const appTsx = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf-8');

  // Must include simplified game & camera controls
  for (const requiredId of [
    'btn-side-toggle',
    'btn-ai-move',
    'btn-reset',
    'btn-cam-player',
    'btn-cam-top',
    'btn-cam-side',
    'btn-cam-wide',
    'btn-hide-ui',
    'controls-hint',
    'captured-tray'
  ]) {
    assert.ok(appTsx.includes(`id="${requiredId}"`), `Missing required HUD control #${requiredId}`);
  }

  // Must NOT include camera speed sliders, script mode bar, or multiplayer lobby
  for (const forbiddenId of [
    'cam-speed-wrap',
    'input-cam-speed',
    'rot-speed-wrap',
    'input-rot-speed',
    'script-bar',
    'btn-script-modal',
    'btn-script-prev',
    'btn-script-next',
    'btn-lobby',
    'lobby-modal',
    'room-pill',
    'btn-checkmate-stepback'
  ]) {
    assert.ok(!appTsx.includes(forbiddenId), `Forbidden UI element #${forbiddenId} found in App.tsx`);
  }
});

test('All 7 compressed 3D assets (.glb.gz.b64) decode and gunzip to valid glTF 2.0 binary models', () => {
  const expectedModels = [
    'option8_cathedral',
    'pawn_white',
    'rook_white',
    'knight_white',
    'bishop_white',
    'queen_white',
    'king_white'
  ];

  for (const name of expectedModels) {
    const b64Path = path.join(ROOT, 'public/assets/glb', `${name}.glb.gz.b64`);
    assert.ok(fs.existsSync(b64Path), `Missing 3D asset ${b64Path}`);
    const b64Text = fs.readFileSync(b64Path, 'utf-8').trim();
    assert.ok(b64Text.length > 1000, `Asset ${name}.glb.gz.b64 is unexpectedly small`);

    const gzBuf = Buffer.from(b64Text, 'base64');
    const glbBuf = zlib.gunzipSync(gzBuf);

    const magic = glbBuf.toString('ascii', 0, 4);
    const version = glbBuf.readUInt32LE(4);
    const totalLen = glbBuf.readUInt32LE(8);
    assert.equal(magic, 'glTF', `Invalid glTF magic header for ${name}`);
    assert.equal(version, 2, `Invalid glTF version for ${name}`);
    assert.equal(totalLen, glbBuf.length, `Mismatched glTF byte length for ${name}`);
  }
});test('Local 2-Player (Same Phone) mode and Play vs AI mode options exist and are supported in engine', () => {
  const appTsx = fs.readFileSync(path.join(ROOT, 'src/App.tsx'), 'utf-8');
  assert.ok(appTsx.includes('id="btn-mode-toggle"'), 'App.tsx must include btn-mode-toggle for mode switching');
  assert.ok(appTsx.includes('Mode: Play vs AI'), 'App.tsx must display Play vs AI mode label');
  assert.ok(appTsx.includes('Local 2 Players'), 'App.tsx must describe Local 2 Players in mode toggle title');

  const engineCode = fs.readFileSync(path.join(ROOT, 'src/wizardChessEngine.js'), 'utf-8');
  // Check that setGameMode is implemented and handles 'local' and 'single'
  assert.ok(engineCode.includes('function setGameMode(mode)'), 'Engine must define setGameMode');
  assert.ok(engineCode.includes("btnModeToggle.textContent = gameMode === 'local' ? 'Mode: Local 2 Players' : 'Mode: Play vs AI'"), 'Engine must update mode toggle text for Local and AI modes');
  // Check that local mode suppresses AI move triggering
  assert.ok(engineCode.includes("if (gameMode === 'local') return false;"), 'Engine must guard triggerAIMoveNow against accidental AI moves in local mode');
  assert.ok(engineCode.includes("if (gameMode !== 'single' || !aiAutoPlay) return;"), 'Engine must not schedule AI moves unless single player mode');
  // Check that setGameMode is exposed on window.wizardChess
  assert.ok(engineCode.includes('setGameMode: (mode) =>'), 'Engine must expose setGameMode on window.wizardChess API');
});
