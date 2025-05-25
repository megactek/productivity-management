import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import path from "path";
// import { searchParams } from "next/navigation";

const DATA_DIR = path.join(process.cwd(), "data");

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

/**
 * Helper function to get the file path for an entity
 */
function getFilePath(entity: string, filename?: string): string {
  const entityPath = path.join(DATA_DIR, entity);

  // Ensure entity directory exists
  if (!fs.existsSync(entityPath)) {
    fs.mkdirSync(entityPath, { recursive: true });
  }

  return path.join(entityPath, filename || "data.json");
}

/**
 * Helper function to read data from a file
 */
function readData<T>(entity: string, filename?: string): T | null {
  const filePath = getFilePath(entity, filename);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const data = fs.readFileSync(filePath, "utf8");
    return JSON.parse(data) as T;
  } catch (error) {
    console.error(`Error reading ${entity} data:`, error);
    return null;
  }
}

/**
 * Helper function to write data to a file
 */
function writeData<T>(entity: string, data: T, filename?: string): boolean {
  const filePath = getFilePath(entity, filename);

  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), "utf8");
    return true;
  } catch (error) {
    console.error(`Error writing ${entity} data:`, error);
    return false;
  }
}

/**
 * Helper function to create a backup
 */
function createBackup(entity: string, timestamp: string, filename?: string): string | null {
  const filePath = getFilePath(entity, filename);

  if (!fs.existsSync(filePath)) {
    return null;
  }

  try {
    const backupPath = path.join(DATA_DIR, entity, `backup_${timestamp}.json`);
    fs.copyFileSync(filePath, backupPath);
    return backupPath;
  } catch (error) {
    console.error(`Error creating backup for ${entity}:`, error);
    return null;
  }
}

/**
 * Helper function to restore from a backup
 */
function restoreFromBackup(entity: string, backupId: string, filename?: string): boolean {
  const backupPath = backupId;
  const filePath = getFilePath(entity, filename);

  if (!fs.existsSync(backupPath)) {
    return false;
  }

  try {
    fs.copyFileSync(backupPath, filePath);
    return true;
  } catch (error) {
    console.error(`Error restoring backup for ${entity}:`, error);
    return false;
  }
}

/**
 * GET handler - Read data
 */
export async function GET(request: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  const searchParams = request.nextUrl.searchParams;
  // const entity = searchParams.get("entity") || "";
  const filename = searchParams.get("filename") || undefined;
  const operation = searchParams.get("operation") || "read";

  // Sanitize entity name to prevent directory traversal
  const sanitizedEntity = entity.replace(/[^a-zA-Z0-9_-]/g, "");

  if (sanitizedEntity !== entity) {
    return NextResponse.json({ error: "Invalid entity name" }, { status: 400 });
  }

  if (operation === "exists") {
    const filePath = getFilePath(sanitizedEntity, filename);
    const exists = fs.existsSync(filePath);
    return NextResponse.json({ exists });
  }

  const data = readData(sanitizedEntity, filename);

  if (data === null) {
    return NextResponse.json({ error: `No data found for ${sanitizedEntity}` }, { status: 404 });
  }

  return NextResponse.json(data);
}

/**
 * POST handler - Write data, create backup, or restore
 */
export async function POST(request: NextRequest, { params }: { params: Promise<{ entity: string }> }) {
  const { entity } = await params;
  const filename = request.nextUrl.searchParams.get("filename") || undefined;
  const operation = request.nextUrl.searchParams.get("operation") || "write";

  // Sanitize entity name to prevent directory traversal
  const sanitizedEntity = entity.replace(/[^a-zA-Z0-9_-]/g, "");

  if (sanitizedEntity !== entity) {
    return NextResponse.json({ error: "Invalid entity name" }, { status: 400 });
  }

  try {
    // Handle different operations
    if (operation === "backup") {
      const { timestamp } = await request.json();
      const backupPath = createBackup(sanitizedEntity, timestamp, filename);

      if (!backupPath) {
        return NextResponse.json({ error: `Failed to create backup for ${sanitizedEntity}` }, { status: 500 });
      }

      return NextResponse.json({ backupId: backupPath });
    }

    if (operation === "restore") {
      const { backupId } = await request.json();
      const success = restoreFromBackup(sanitizedEntity, backupId, filename);

      if (!success) {
        return NextResponse.json({ error: `Failed to restore backup for ${sanitizedEntity}` }, { status: 500 });
      }

      return NextResponse.json({ success: true });
    }

    // Default operation: write
    const data = await request.json();
    const success = writeData(sanitizedEntity, data, filename);

    if (!success) {
      return NextResponse.json({ error: `Failed to write data for ${sanitizedEntity}` }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error(`Error in POST handler for ${entity}:`, error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
