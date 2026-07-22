const test = require('node:test');
const assert = require('node:assert/strict');
const { buildFallbackReply } = require('./server');

test('buildFallbackReply gives a friendly algebra tutor response', () => {
  const reply = buildFallbackReply('Solve 2x + 5 = 13');
  assert.match(reply, /algebra/i);
  assert.ok(reply.length > 0);
});
