import { db } from "./db";
import { decryptSetting, deriveSettingKey, encryptSetting } from "./crypto";

export type SettingSpec = { envVar?: string };

function key(): Buffer {
  const secret = process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error("NEXTAUTH_SECRET is not set");
  return deriveSettingKey(secret);
}

export function isSettingFromEnv(spec: SettingSpec): boolean {
  return !!(spec.envVar && process.env[spec.envVar]);
}

export async function getSetting(
  settingKey: string,
  spec: SettingSpec = {},
): Promise<string | null> {
  if (spec.envVar) {
    const fromEnv = process.env[spec.envVar];
    if (fromEnv) return fromEnv;
  }
  const row = await db.setting.findUnique({ where: { key: settingKey } });
  if (!row) return null;
  return row.encrypted ? decryptSetting(row.value, key()) : row.value;
}

export async function setSetting(
  settingKey: string,
  value: string,
  opts: { encrypt?: boolean; actorId?: string } = {},
): Promise<void> {
  const stored = opts.encrypt ? encryptSetting(value, key()) : value;
  await db.setting.upsert({
    where: { key: settingKey },
    create: {
      key: settingKey,
      value: stored,
      encrypted: !!opts.encrypt,
      updatedBy: opts.actorId,
    },
    update: {
      value: stored,
      encrypted: !!opts.encrypt,
      updatedBy: opts.actorId,
    },
  });
}
