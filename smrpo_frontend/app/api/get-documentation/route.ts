import { promises as fs } from "fs";
import path from "path";

export async function GET() {
    try {
        // Log to confirm API is being called
        console.log("API: Fetching documentation...");

        // Ensure we correctly reference the project root
        const filePath = path.join(process.cwd(), "Dokumentacija.txt");

        // Read the file
        const content = await fs.readFile(filePath, "utf-8");

        return new Response(JSON.stringify({ content }), {
            headers: { "Content-Type": "application/json" },
        });
    } catch (error) {
        console.error("Failed to load documentation:", error);
        return new Response(JSON.stringify({ error: "Failed to load documentation." }), {
            status: 500,
            headers: { "Content-Type": "application/json" },
        });
    }
}
