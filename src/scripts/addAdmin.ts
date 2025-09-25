import { app } from "./scriptServer.ts";
import { getAuth } from "firebase-admin/auth";

const ROLES = ["admin", "qrScanner", "webDev", "director"] as const;

function prompt(question: string): Promise<string> {
  return new Promise(resolve => {
    process.stdout.write(question);
    process.stdin.once("data", (response: Buffer) => {
      resolve(response.toString().trim());
    });
  });
}

async function main() {
  try {
    const email = await prompt("Enter the email: ");
    const action = await prompt("Do you want to add or remove a claim? (add/remove): ");
    
    console.log("\nAvailable roles:");
    ROLES.forEach((role, i) => console.log(`${i + 1}. ${role}`));
    const roleIndex = parseInt(await prompt("Choose a role (number): "), 10) - 1;

    if (!ROLES[roleIndex]) {
      console.log("Invalid role selection.");
      process.exit(1);
    }

    const role = ROLES[roleIndex];
    const user = await getAuth(app).getUserByEmail(email);

    // Current claims
    const currentClaims = user.customClaims || {};

    if (action.toLowerCase() === "add") {
      currentClaims[role] = true;
    } else if (action.toLowerCase() === "remove") {
      delete currentClaims[role];
    } else {
      console.log("Invalid action. Must be 'add' or 'remove'.");
      process.exit(1);
    }

    await getAuth(app).setCustomUserClaims(user.uid, currentClaims);

    console.log(`Successfully ${action}ed role "${role}" for ${email}`);
    process.exit(0);
  } catch (e) {
    console.error("Error:", e);
    process.exit(1);
  }
}

main();
