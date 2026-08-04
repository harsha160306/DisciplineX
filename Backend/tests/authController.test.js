import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeRole, findMatchingUser } from '../controllers/authController.js';

test('normalizeRole handles lowercase role values', () => {
  assert.equal(normalizeRole(' admin '), 'Admin');
  assert.equal(normalizeRole('hod'), 'HOD');
  assert.equal(normalizeRole('  incharge  '), 'Incharge');
});

test('findMatchingUser matches credentials case-insensitively', () => {
  const users = [
    { username: 'admin', role: 'Admin', password: 'Admin@123' },
    { username: 'hod_cse', role: 'HOD', password: 'HOD@cse123' }
  ];

  assert.equal(findMatchingUser(users, '  admin ', 'ADMIN')?.username, 'admin');
  assert.equal(findMatchingUser(users, ' HOD ', ' hod_cse ')?.username, 'hod_cse');
});
