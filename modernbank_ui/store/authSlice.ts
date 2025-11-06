import { createSlice, PayloadAction } from "@reduxjs/toolkit";

interface User {
  user_id: string;
  username: string;
}

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
}

// Function to load initial state in client environment
const loadInitialState = (): AuthState => {
  if (typeof window !== "undefined") {
    try {
      const savedState = localStorage.getItem("authState");
      return savedState ? JSON.parse(savedState) : { user: null, isAuthenticated: false };
    } catch (error) {
      console.error("Error loading auth state from localStorage:", error);
      return { user: null, isAuthenticated: false };
    }
  }
  return { user: null, isAuthenticated: false };
};

// Create Slice
const authSlice = createSlice({
  name: "auth",
  initialState: loadInitialState(),
  reducers: {
    login: (state, action: PayloadAction<{ user: User; isAuthenticated: boolean }>) => {
      console.log("Redux Login Payload:", action.payload); // 🔍 Debugging Log
      state.user = action.payload.user;
      state.isAuthenticated = action.payload.isAuthenticated;

      // Save state to localStorage
      if (typeof window !== "undefined") {
        try {
          localStorage.setItem(
            "authState",
            JSON.stringify({
              user: action.payload.user,
              isAuthenticated: action.payload.isAuthenticated,
            })
          );
        } catch (error) {
          console.error("Error saving auth state to localStorage:", error);
        }
      }
    },
    logout: (state) => {
      state.user = null;
      state.isAuthenticated = false;

      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("authState");
        } catch (error) {
          console.error("Error removing auth state from localStorage:", error);
        }
      }
    },
  },
});

export const { login, logout } = authSlice.actions;
export default authSlice.reducer;
