import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';

export default class Point extends Model {
    static table = 'points';

    @field('code') code!: string;
    @field('description') description!: string;

    @relation('assets', 'asset_id') asset!: any;
}
