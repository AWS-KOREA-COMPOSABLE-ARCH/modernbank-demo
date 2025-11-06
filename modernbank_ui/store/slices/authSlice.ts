import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface User {
  user_id: string;
  name?: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// Function to load state from localStorage
const loadState = (): AuthState => {
  if (typeof window === 'undefined') {
    return { user: null, isAuthenticated: false };
  }
  
  try {
    const storedState = localStorage.getItem('authState');
    if (storedState) {
      const parsedState = JSON.parse(storedState);
      return {
        user: parsedState.user,
        isAuthenticated: !!parsedState.user
      };
    }
  } catch (error) {
    console.error('Error loading auth state from localStorage:', error);
  }
  return { user: null, isAuthenticated: false };
};

const initialState: AuthState = loadState();

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setUser: (state, action: PayloadAction<User>) => {
      state.user = action.payload;
      state.isAuthenticated = true;
      try {
        localStorage.setItem('authState', JSON.stringify({
          user: action.payload,
          isAuthenticated: true
        }));
      } catch (error) {
        console.error('Error saving auth state to localStorage:', error);
      }
    },
    clearUser: (state) => {
      state.user = null;
      state.isAuthenticated = false;
      try {
        localStorage.removeItem('authState');
      } catch (error) {
        console.error('Error clearing auth state from localStorage:', error);
      }
    },
    // Reducer for checking authentication state
    checkAuth: (state) => {
      try {
        // First check authState key (Redux storage method)
        const storedAuthState = localStorage.getItem('authState');
        if (storedAuthState) {
          const parsedState = JSON.parse(storedAuthState);
          state.user = parsedState.user;
          state.isAuthenticated = !!parsedState.user;
          
          // Also save to 'user' key for compatibility with retrieveCustomer
          if (parsedState.user) {
            localStorage.setItem('user', JSON.stringify(parsedState.user));
          }
          return;
        }
        
        // If authState doesn't exist, check user key (compatibility with other components)
        const storedUser = localStorage.getItem('user');
        if (storedUser) {
          const user = JSON.parse(storedUser);
          state.user = user;
          state.isAuthenticated = true;
          
          // Migrate user key information to authState (maintain consistency)
          localStorage.setItem('authState', JSON.stringify({
            user,
            isAuthenticated: true
          }));
        } else {
          state.user = null;
          state.isAuthenticated = false;
        }
      } catch (error) {
        console.error('Failed to parse stored auth data:', error);
        state.user = null;
        state.isAuthenticated = false;
      }
    }
  }
});

export const { setUser, clearUser, checkAuth } = authSlice.actions;
export default authSlice.reducer; 