import test from 'node:test';
import assert from 'node:assert/strict';
import { findAllMatches, findMatchingGroup } from '../gameLogic.js';

const makeTile = (id, x, y, type = 'red') => ({ id, x, y, type });

const gridSize = 6;

test('detects square clusters as matches with square pattern metadata', () => {
  const tiles = [
    makeTile(1, 0, 0),
    makeTile(2, 1, 0),
    makeTile(3, 0, 1),
    makeTile(4, 1, 1),
    makeTile(5, 3, 3, 'blue'),
  ];

  const matches = findAllMatches(tiles, gridSize);
  assert.equal(matches.length, 1);
  const [match] = matches;
  assert.deepEqual(new Set(match.ids), new Set([1, 2, 3, 4]));
  assert.equal(match.pattern.shape, 'square');
  assert.equal(match.pattern.size, 4);
});

test('detects L-shaped clusters and exposes pattern metadata in findMatchingGroup', () => {
  const tiles = [
    makeTile(1, 0, 0),
    makeTile(2, 0, 1),
    makeTile(3, 0, 2),
    makeTile(4, 1, 2),
    makeTile(5, 2, 2),
    makeTile(6, 3, 3, 'blue'),
  ];

  const matches = findAllMatches(tiles, gridSize);
  assert.equal(matches.length, 1);
  const [match] = matches;
  assert.equal(match.pattern.shape, 'L');
  assert.equal(match.pattern.size, 5);

  const matchFromGroup = findMatchingGroup(tiles, 5, gridSize);
  assert.ok(matchFromGroup);
  assert.equal(matchFromGroup.pattern.shape, 'L');
  assert.deepEqual(new Set(matchFromGroup.ids), new Set([1, 2, 3, 4, 5]));
});

test('detects long horizontal chains as single line match', () => {
  const tiles = [
    makeTile(1, 0, 4),
    makeTile(2, 1, 4),
    makeTile(3, 2, 4),
    makeTile(4, 3, 4),
    makeTile(5, 4, 4),
    makeTile(6, 5, 5, 'green'),
  ];

  const matches = findAllMatches(tiles, gridSize);
  assert.equal(matches.length, 1);
  const [match] = matches;
  assert.equal(match.pattern.shape, 'line');
  assert.equal(match.pattern.orientation, 'horizontal');
  assert.equal(match.pattern.size, 5);
  assert.deepEqual(new Set(match.ids), new Set([1, 2, 3, 4, 5]));
});
