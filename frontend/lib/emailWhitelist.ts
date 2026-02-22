import { readFileSync } from "fs";
import { join } from "path";

let allowedEmails: Set<string> | null = null;

/**
 * Load allowed emails from CSV file
 * Caches the result to avoid reading file on every check
 */
export function loadAllowedEmails(): Set<string> {
  if (allowedEmails) {
    return allowedEmails;
  }

  try {
    const csvPath = join(process.cwd(), "allowed-emails.csv");
    const csvContent = readFileSync(csvPath, "utf-8");

    // Parse CSV (skip header row)
    const emails = csvContent
      .split("\n")
      .slice(1) // Skip header
      .map((line) => line.trim().toLowerCase())
      .filter((line) => line.length > 0 && line.includes("@"));

    allowedEmails = new Set(emails);
    console.log(`[Email Whitelist] Loaded ${allowedEmails.size} allowed emails`);

    return allowedEmails;
  } catch (error) {
    console.error("[Email Whitelist] Error loading allowed-emails.csv:", error);
    // Return empty set if file doesn't exist
    return new Set();
  }
}

/**
 * Check if an email is in the whitelist
 */
export function isEmailAllowed(email: string | null | undefined): boolean {
  if (!email) return false;

  const allowedEmailsSet = loadAllowedEmails();

  // If no emails loaded (file doesn't exist), allow all emails
  if (allowedEmailsSet.size === 0) {
    console.warn("[Email Whitelist] No emails loaded - allowing all");
    return true;
  }

  const normalizedEmail = email.toLowerCase().trim();
  const isAllowed = allowedEmailsSet.has(normalizedEmail);

  if (!isAllowed) {
    console.log(`[Email Whitelist] Rejected: ${email}`);
  }

  return isAllowed;
}

/**
 * Reload the whitelist (useful for hot-reloading in development)
 */
export function reloadWhitelist(): void {
  allowedEmails = null;
  loadAllowedEmails();
}
