// src/models/Survey.ts
import { Model } from '@nozbe/watermelondb';
import { field, children } from '@nozbe/watermelondb/decorators';
import Collect from "./Collect.ts";

export default class Survey extends Model {
    static table = 'surveys';
    static associations = {
        collects: { type: 'has_many', foreignKey: 'survey_id' },
    }
    @field('asset_id') assetId!: number;
    @field('point_id') pointId!: number;
    @field('asset_description') assetDescription!: string;
    @field('point_code') pointCode!: string;
    @field('point_description') pointDescription!: string;
    @field('is_monoaxial') isMonoaxial!: boolean;
    @field('plant_id') plantId!: number;
    @field('plant_description') plantDescription!: string;

    @children('collects') collects!: Collect[];
}
