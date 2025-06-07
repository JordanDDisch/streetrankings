'use server'

import db from '@/lib/db';

export async function getUsers() {
  try {
    const users = await db('users').select('*');
    return users;
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to fetch users');
  }
}

export async function createUser(userData: { name: string; email: string }) {
  try {
    const [user] = await db('users').insert(userData).returning('*');
    return user;
  } catch (error) {
    console.error('Database error:', error);
    throw new Error('Failed to create user');
  }
} 