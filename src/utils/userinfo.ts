const nameCache = new Map<string, string>();

export async function getUserName(client: any, userId: string): Promise<string> {
    if (nameCache.has(userId)) {
        return nameCache.get(userId)!;
    }

    try {
        const info = await client.getUserInfo(BigInt(userId));

        const name = info?.name || info?.fullName || "Unknown";

        nameCache.set(userId, name);

        return name;
    } catch {
        return "Unknown";
    }
}
