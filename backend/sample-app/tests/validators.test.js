const { test } = require('node:test');
const assert = require('node:assert');
const { isValidTodo, normaliseTodo } = require('../utils/validators');

test('accepts a normal todo', () =>{
    assert.strictEqual(isValidTodo('buy milk'), true);
});

test('rejects whitespace-only text', () =>{
    assert.strictEqual(isValidTodo('  '), false);
});

test('rejects text over 200 characters', () => {
    assert.strictEqual(isValidTodo('x'.repeat(201)), false);
});

test('rejects non-string input', () => {
   assert.strictEqual(isValidTodo(null), false);
});

test('normaliseTodo collapses internal whitespace', () => {
    assert.strictEqual(normaliseTodo(' buy milk '), 'buy milk');
});