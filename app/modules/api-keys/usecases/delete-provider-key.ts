import { query } from "@/app/infrastructure/db/postgres";

export async function deleteProviderKey(id: number): Promise<void> {
  await query("DELETE FROM api_keys WHERE id = $1", [id]);
}
