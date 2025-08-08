import NextAuth from 'next-auth';
import { ClerkProvider } from '@clerk/nextjs';

export const authOptions = {
  providers: [
    // Add your authentication providers here
  ],
  // Add any additional configuration options
  callbacks: {
    async session({ session, token }: { session: any; token: any }) {
      return session;
    },
    async jwt({ token, user }: { token: any; user: any }) {
      return token;
    },
  },
};

export default NextAuth(authOptions); 