import { Model } from '@nozbe/watermelondb';
import { field, relation, children } from '@nozbe/watermelondb/decorators';

export default class Asset extends Model {
    static table = 'assets';
    static associations = {
        points: { type: 'has_many', foreignKey: 'asset_id' },
    }

    @field('code') code!: string;
    @field('description') description!: string;
    @field('is_monoaxial') isMonoaxial!: number;
    @field('is_measured') isMeasured!: 'all' | 'none' | 'partial';
    @field('status') status?: string;

    @relation('systems', 'system_id') system!: any;
    @children('points') points!: any;
}
