import { Model } from '@nozbe/watermelondb';
import { field, children } from '@nozbe/watermelondb/decorators';

export default class Plant extends Model {
    static table = 'plants';
    static associations = {
        areas: { type: 'has_many', foreignKey: 'plant_id' },
    }
    @field('code') code!: string;
    @field('description') description!: string;

    @children('areas') areas!: any; // relación 1:N
}
