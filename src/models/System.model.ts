import { Model } from '@nozbe/watermelondb';
import { field, relation, children } from '@nozbe/watermelondb/decorators';

export default class System extends Model {
    static table = 'systems';
    static associations = {
        assets: { type: 'has_many', foreignKey: 'system_id' },
    }
    @field('code') code!: string;
    @field('description') description!: string;

    @relation('areas', 'area_id') area!: any;
    @children('assets') mawois!: any;
}
