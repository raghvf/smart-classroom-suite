export type UserRole = 'admin' | 'faculty' | 'student';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  avatar?: string;
}

// Mock authentication - replace with real auth later
export const mockLogin = async (email: string, password: string): Promise<User | null> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 800));

  // Mock users for testing
  const mockUsers: Record<string, User> = {
    'admin@classroom.edu': {
      id: '1',
      email: 'admin@classroom.edu',
      name: 'Admin User',
      role: 'admin',
    },
    'faculty@classroom.edu': {
      id: '2',
      email: 'faculty@classroom.edu',
      name: 'Dr. Sarah Johnson',
      role: 'faculty',
    },
    'student@classroom.edu': {
      id: '3',
      email: 'student@classroom.edu',
      name: 'John Smith',
      role: 'student',
    },
  };

  return mockUsers[email] || null;
};

export const getStoredUser = (): User | null => {
  const userStr = localStorage.getItem('user');
  return userStr ? JSON.parse(userStr) : null;
};

export const setStoredUser = (user: User) => {
  localStorage.setItem('user', JSON.stringify(user));
};

export const clearStoredUser = () => {
  localStorage.removeItem('user');
};
