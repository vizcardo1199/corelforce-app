import {Collection, Model} from '@nozbe/watermelondb';

export async function upsertRecord<T extends Model>(
    collection: Collection<T>,
    id: number,
    updater: (record: T) => void
): Promise<T> {
    const stringId = id.toString();
    try {
        const existing = await collection.find(stringId);
        await existing.update(updater);
        return existing;
    } catch {
        return await collection.create(record => {
            (record._raw as any).id = stringId;
            updater(record);
        });
    }
}
