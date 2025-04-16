// src/models/Collect.ts
import { Model } from '@nozbe/watermelondb';
import { field, relation } from '@nozbe/watermelondb/decorators';
import Survey from './Survey';

export default class Collect extends Model {
    static table = 'collects';

    @field('uuid') uuid!: string;
    @field('date') date!: string;
    @field('time') time!: number;
    @field('synced') synced!: boolean;
    @field('next_x_w') nextXW!: string;
    @field('next_x_s') nextXS!: string;
    @field('next_y_w') nextYW!: string;
    @field('next_y_s') nextYS!: string;
    @field('next_z_w') nextZW!: string;
    @field('next_z_s') nextZS!: string;
    @field('vars') vars!: string;

    // ✅ Usa el tipo correcto
    @relation('surveys', 'survey_id') survey!: Survey;
}
