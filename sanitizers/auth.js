import { body, param } from 'express-validator';

export const login = [body('email').normalizeEmail()];

export const signup = [body('email').normalizeEmail()];

export const passwordReset = [];

export const resetPassword = [];
