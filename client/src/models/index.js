/**
 * @typedef {{ id: string, email: string, name: string }} User
 * @typedef {{ id: string, name: string }} Household
 * @typedef {{ user: User, role: 'ADMIN'|'MEMBER' }} HouseholdMemberVM
 * @typedef {{ id: string, name: string, color?: string|null }} Category
 * @typedef {{
 *   id: string,
 *   title: string,
 *   dueAt: string,
 *   status: 'OPEN'|'DONE',
 *   category?: Category|null,
 *   assignedTo?: User|null
 * }} TaskVM
 */
export {};

