import { GetCommand, DynamoDBDocumentClient } from "@aws-sdk/lib-dynamodb";
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({ region: process.env.AWS_REGION || "us-east-1" });
const ADMINS_TABLE_NAME = process.env.ADMINS_TABLE_NAME || "admins";
const docClient = DynamoDBDocumentClient.from(client);

interface AdminRecord {
  email: string;
  role?: string;
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// In-memory cache with TTL
let adminCache: Map<string, { data: AdminRecord | null; expiresAt: number }> = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch an admin by email from DynamoDB
 * Includes in-memory caching to reduce database queries
 */
export async function getAdmin(email: string): Promise<AdminRecord | null> {
  const lowercaseEmail = email.toLowerCase();
  
  // Check cache first
  const cached = adminCache.get(lowercaseEmail);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.data;
  }

  try {
    const result = await docClient.send(
      new GetCommand({
        TableName: ADMINS_TABLE_NAME,
        Key: { email: lowercaseEmail },
      })
    );

    const admin = (result.Item as AdminRecord) || null;
    
    // Cache the result (even if null, to prevent repeated queries for non-existent users)
    adminCache.set(lowercaseEmail, {
      data: admin,
      expiresAt: Date.now() + CACHE_TTL,
    });

    return admin;
  } catch (error) {
    console.error(`Error fetching admin ${email}:`, error);
    return null;
  }
}

/**
 * Check if an email is an approved admin
 */
export async function isApprovedAdmin(email: string): Promise<boolean> {
  const admin = await getAdmin(email);
  return admin !== null && (admin.isActive !== false);
}

/**
 * Invalidate cache for a specific email (useful after updates)
 */
export function invalidateAdminCache(email: string): void {
  adminCache.delete(email.toLowerCase());
}

/**
 * Clear entire admin cache
 */
export function clearAdminCache(): void {
  adminCache.clear();
}
