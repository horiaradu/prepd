import type { AuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: AuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async signIn({ user }) {
      const authorizedEmail = process.env.AUTHORIZED_EMAIL;
      if (!authorizedEmail) return false;
      return user.email === authorizedEmail;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};
