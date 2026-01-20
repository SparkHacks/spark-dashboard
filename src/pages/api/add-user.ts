import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { app } from "../../firebase/server";

export const POST: APIRoute = async ({ request }) => {
  const auth = getAuth(app);

  try {
    const body = await request.json();
    const email = body.email?.trim();
    const displayName = body.displayName?.trim();

    if (!email) {
      return new Response("Email is required", { status: 400 });
    }

    if (!displayName) {
      return new Response("Display name is required", { status: 400 });
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response("Invalid email format", { status: 400 });
    }

    try {
      const existingUser = await auth.getUserByEmail(email);
      if (existingUser) {
        return new Response("User with this email already exists", { status: 400 });
      }
    } catch (err: any) {
      if (err.code !== "auth/user-not-found") {
        throw err;
      }
    }

    const newUser = await auth.createUser({
      email: email,
      displayName: displayName,
      emailVerified: false,
    });

    return new Response(
      `Successfully added user: ${displayName} (${email})`,
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error adding user:", err);
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
};
