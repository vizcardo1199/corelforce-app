import { Model } from '@nozbe/watermelondb';
import { field, relation, children } from '@nozbe/watermelondb/decorators';

export default class Area extends Model {
    static table = 'areas';
    static associations = {
        systems: { type: 'has_many', foreignKey: 'area_id' },
    }
    @field('code') code!: string;
    @field('description') description!: string;

    @relation('plants', 'plant_id') plant!: any;
    @children('systems') systems!: any;
}
