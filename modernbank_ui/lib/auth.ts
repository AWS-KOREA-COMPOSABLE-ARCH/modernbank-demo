import apiClient from "@/utils/apiClient";
import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";

export const authOptions: AuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        user_id: { label: "User ID", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        try {
          if (!credentials?.user_id || !credentials?.password) {
            throw new Error("Please enter user ID and password.");
          }

          const response = await apiClient("AUTH", "", "POST", {
            user_id: credentials.user_id,
            password: credentials.password
          });

          if (!response?.data) {
            throw new Error("Login failed.");
          }

          return {
            id: credentials.user_id,
            name: response.data.username,
            user_id: credentials.user_id
          };
        } catch (error: unknown) {
          console.error("[NextAuth] Error:", error);
          const errorMessage = error instanceof Error ? error.message : "Server error occurred.";
          throw new Error(errorMessage);
        }
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.user_id = user.user_id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string;
        session.user.user_id = token.user_id as string;
      }
      return session;
    }
  },
  pages: {
    signIn: "/signin",
    error: "/signin"
  },
  session: {
    strategy: "jwt",
  },
}; 