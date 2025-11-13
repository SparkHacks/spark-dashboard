import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { app } from "../../firebase/server";

const ROLES = ["admin", "qrScanner", "webDev", "director"] as const;

export const POST: APIRoute = async ({ request }) => {
  const auth = getAuth(app);

  try {
    const formData = await request.formData();
    const email = formData.get("email")?.toString().trim();
    const action = formData.get("action")?.toString().toLowerCase();
    const role = formData.get("role")?.toString();

    // Validate inputs
    if (!email) {
      return new Response("Email is required", { status: 400 });
    }

    if (!action || (action !== "add" && action !== "remove")) {
      return new Response("Action must be 'add' or 'remove'", { status: 400 });
    }

    if (!role || !ROLES.includes(role as any)) {
      return new Response(
        `Invalid role. Must be one of: ${ROLES.join(", ")}`,
        { status: 400 }
      );
    }

    // Get user by email
    const user = await auth.getUserByEmail(email);

    // Get current claims
    const currentClaims = user.customClaims || {};

    // Modify claims based on action
    if (action === "add") {
      currentClaims[role] = true;
    } else if (action === "remove") {
      delete currentClaims[role];
    }

    // Update user claims
    await auth.setCustomUserClaims(user.uid, currentClaims);

    return new Response(
      `Successfully ${action === "add" ? "added" : "removed"} role "${role}" ${action === "add" ? "to" : "from"} ${email}`,
      { status: 200 }
    );
  } catch (err: any) {
    console.error("Error modifying roles:", err);
    if (err.code === "auth/user-not-found") {
      return new Response("User not found with that email", { status: 404 });
    }
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
};
