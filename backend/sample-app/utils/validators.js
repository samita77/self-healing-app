/**
 * Pure validation helpers - deliberately free of database and network
 * dependencies so they can be unit tested in isolation
 */

function isValidTodo(text){
    if (typeof text != 'string') return false;
    const trimmed = text.trim();
    return trimmed.length > 0 && trimmed.length <= 200;
}

function normaliseTodo(text) {
    return String(text).trim().replace(/\s+/g, ' ');
}

module.exports = { isValidTodo, normaliseTodo };

