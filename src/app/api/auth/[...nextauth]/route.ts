// src/app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth"
import { authOptions } from "../../../../../lib/auth"

const handler = NextAuth(authOptions)

// Only these two named exports are allowed in an App Router route.ts
export { handler as GET, handler as POST }
