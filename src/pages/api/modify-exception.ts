import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { app } from "../../firebase/server";

export const POST: APIRoute = async ({ request }) => {
  const auth = getAuth(app);

  try {
    const formData = await request.formData();
    const email = formData.get("email")?.toString().trim();
    const action = formData.get("action")?.toString().toLowerCase();

    if (!email) {
      return new Response("Email is required", { status: 400 });
    }

    if (!action || (action !== "add" && action !== "remove")) {
      return new Response("Action must be 'add' or 'remove'", { status: 400 });
    }
    const user = await auth.getUserByEmail(email);

    const currentClaims = user.customClaims || {};

    if (action === "add") {
      currentClaims.exception = true;
    } else if (action === "remove") {
      delete currentClaims.exception;
    }

    await auth.setCustomUserClaims(user.uid, currentClaims);

    return new Response(
      `Successfully ${action === "add" ? "added" : "removed"} exception status ${action === "add" ? "to" : "from"} ${email}`,
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error modifying exception:", err);
    if (err.code === "auth/user-not-found") {
      return new Response("User not found with that email", { status: 404 });
    }
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
};
