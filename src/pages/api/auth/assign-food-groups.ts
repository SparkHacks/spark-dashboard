import type { APIRoute } from "astro";
import { getAuth } from "firebase-admin/auth";
import { app, db } from "../../../firebase/server.ts";
import { FORMS_COLLECTION } from "../../../utils/utils.ts";
import getRoleFlags from "../../../scripts/getRoles.ts";

const FOOD_GROUPS_COLLECTION = "FoodGroups";

// GET - Fetch all food group assignments
export const GET: APIRoute = async ({ cookies }) => {
  const auth = getAuth(app);

  const sessionCookieObj = cookies.get("__session");
  if (!sessionCookieObj) {
    return new Response("No token found", { status: 401 });
  }

  const sessionCookie = sessionCookieObj.value;
  try {
    const decodedCookie = await auth.verifySessionCookie(sessionCookie);
    if (!decodedCookie) {
      return new Response("Invalid token", { status: 401 });
    }

    const user = await auth.getUser(decodedCookie.uid);
    const roles = getRoleFlags(user);

    if (!roles.isAdmin && !roles.isDirector) {
      return new Response("Unauthorized", { status: 403 });
    }
  } catch (err) {
    console.error("Error verifying session:", err);
    return new Response("Session expired", { status: 401 });
  }

  try {
    const snapshot = await db.collection(FOOD_GROUPS_COLLECTION).get();

    const groups: Record<number, string[]> = { 1: [], 2: [], 3: [], 4: [] };

    snapshot.docs.forEach(doc => {
      const group = doc.data().group as number;
      if (group >= 1 && group <= 4) {
        groups[group].push(doc.id);
      }
    });

    return new Response(JSON.stringify({
      success: true,
      groups,
      total: snapshot.size
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Error fetching food groups:", err);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to fetch food groups"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

// DELETE - Clear all food group assignments
export const DELETE: APIRoute = async ({ cookies }) => {
  const auth = getAuth(app);

  const sessionCookieObj = cookies.get("__session");
  if (!sessionCookieObj) {
    return new Response("No token found", { status: 401 });
  }

  const sessionCookie = sessionCookieObj.value;
  try {
    const decodedCookie = await auth.verifySessionCookie(sessionCookie);
    if (!decodedCookie) {
      return new Response("Invalid token", { status: 401 });
    }

    const user = await auth.getUser(decodedCookie.uid);
    const roles = getRoleFlags(user);

    if (!roles.isAdmin && !roles.isDirector) {
      return new Response("Unauthorized", { status: 403 });
    }
  } catch (err) {
    console.error("Error verifying session:", err);
    return new Response("Session expired", { status: 401 });
  }

  try {
    const snapshot = await db.collection(FOOD_GROUPS_COLLECTION).get();

    if (snapshot.empty) {
      return new Response(JSON.stringify({
        success: true,
        message: "No food groups to clear",
        deleted: 0
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Delete all documents in batches (Firestore limit is 500 per batch)
    const batchSize = 500;
    let deleted = 0;

    while (true) {
      const batch = db.batch();
      const docs = await db.collection(FOOD_GROUPS_COLLECTION).limit(batchSize).get();

      if (docs.empty) break;

      docs.forEach(doc => {
        batch.delete(doc.ref);
        deleted++;
      });

      await batch.commit();

      if (docs.size < batchSize) break;
    }

    return new Response(JSON.stringify({
      success: true,
      message: `Cleared all food group assignments`,
      deleted
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });
  } catch (err) {
    console.error("Error clearing food groups:", err);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to clear food groups"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};

export const POST: APIRoute = async ({ cookies }) => {
  const auth = getAuth(app);

  // Check if session cookie exists
  const sessionCookieObj = cookies.get("__session");
  if (!sessionCookieObj) {
    return new Response("No token found", { status: 401 });
  }

  // Check if session cookie is still valid and user is admin
  const sessionCookie = sessionCookieObj.value;
  try {
    const decodedCookie = await auth.verifySessionCookie(sessionCookie);
    if (!decodedCookie) {
      return new Response("Invalid token", { status: 401 });
    }

    const user = await auth.getUser(decodedCookie.uid);
    const roles = getRoleFlags(user);

    if (!roles.isAdmin && !roles.isDirector) {
      return new Response("Unauthorized - Admin or Director access required", { status: 403 });
    }
  } catch (err) {
    console.error("Error verifying session:", err);
    return new Response("Session expired", { status: 401 });
  }

  try {
    // Get all applicants from forms collection
    const snapshot = await db.collection(FORMS_COLLECTION).get();

    if (snapshot.empty) {
      return new Response(JSON.stringify({
        success: true,
        message: "No applicants found",
        assigned: 0
      }), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Check existing food group assignments to preserve them
    const existingGroups = await db.collection(FOOD_GROUPS_COLLECTION).get();
    const existingAssignments = new Map<string, number>();
    existingGroups.docs.forEach(doc => {
      existingAssignments.set(doc.id, doc.data().group);
    });

    // Filter for accepted applicants with UIC emails only
    const eligibleApplicants = snapshot.docs.filter(doc => {
      const data = doc.data();
      const email = doc.id.toLowerCase();
      const isAccepted = data.appStatus === "accepted";
      const isUicEmail = email.endsWith("@uic.edu");
      return isAccepted && isUicEmail;
    }).map(doc => doc.id);

    // Filter out already assigned applicants
    const newApplicants = eligibleApplicants.filter(email => !existingAssignments.has(email));

    // Count current group sizes from existing assignments
    const groupCounts = { 1: 0, 2: 0, 3: 0, 4: 0 };
    existingAssignments.forEach(group => {
      groupCounts[group as keyof typeof groupCounts]++;
    });

    // Shuffle new applicants for random distribution
    const shuffledNew = [...newApplicants].sort(() => Math.random() - 0.5);

    // Assign new applicants to groups, balancing by adding to smallest group
    const batch = db.batch();
    let newAssigned = 0;

    shuffledNew.forEach((email) => {
      // Find the group with the fewest members
      const minGroup = (Object.entries(groupCounts) as [string, number][])
        .reduce((min, [group, count]) => count < min.count ? { group: parseInt(group), count } : min, { group: 1, count: Infinity });

      const group = minGroup.group;
      groupCounts[group as keyof typeof groupCounts]++;

      const docRef = db.collection(FOOD_GROUPS_COLLECTION).doc(email);
      batch.set(docRef, { group, assignedAt: new Date() });
      newAssigned++;
    });

    await batch.commit();

    return new Response(JSON.stringify({
      success: true,
      message: `Assigned ${newAssigned} new applicants to food groups (${existingAssignments.size} already assigned)`,
      newAssigned,
      totalEligible: eligibleApplicants.length,
      distribution: groupCounts
    }), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (err) {
    console.error("Error assigning food groups:", err);
    return new Response(JSON.stringify({
      success: false,
      error: "Failed to assign food groups"
    }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
};
