// src/models/schema.ts
import { appSchema, tableSchema } from '@nozbe/watermelondb';

export const mySchema = appSchema({
    version: 1,
    tables: [
        tableSchema({
            name: 'surveys',
            columns: [
                { name: 'asset_id', type: 'number' },
                { name: 'asset_description', type: 'string' },
                { name: 'is_monoaxial', type: 'boolean' },
                { name: 'point_id', type: 'number' },
                { name: 'point_code', type: 'string' },
                { name: 'point_description', type: 'string' },
                { name: 'plant_id', type: 'number' },
                { name: 'plant_description', type: 'string' },
            ],
        }),
        tableSchema({
            name: 'collects',
            columns: [
                { name: 'survey_id', type: 'string', isIndexed: true },
                { name: 'uuid', type: 'string' },
                { name: 'synced', type: 'boolean' },
                { name: 'date', type: 'string' },
                { name: 'time', type: 'number' },
                { name: 'synced', type: 'boolean' },
                { name: 'next_x_w', type: 'string' },
                { name: 'next_x_s', type: 'string' },
                { name: 'next_y_w', type: 'string' },
                { name: 'next_y_s', type: 'string' },
                { name: 'next_z_w', type: 'string' },
                { name: 'next_z_s', type: 'string' },
                { name: 'vars', type: 'string' },
            ],
        }),
        tableSchema({
            name: 'plants',
            columns: [
                { name: 'code', type: 'string' },
                { name: 'description', type: 'string' },
            ],
        }),
        tableSchema({
            name: 'areas',
            columns: [
                { name: 'code', type: 'string' },
                { name: 'description', type: 'string' },
                { name: 'plant_id', type: 'string', isIndexed: true },
            ],
        }),
        tableSchema({
            name: 'systems',
            columns: [
                { name: 'code', type: 'string' },
                { name: 'description', type: 'string' },
                { name: 'area_id', type: 'string', isIndexed: true },
            ],
        }),
        tableSchema({
            name: 'assets',
            columns: [
                { name: 'code', type: 'string' },
                { name: 'description', type: 'string' },
                { name: 'is_monoaxial', type: 'number' },
                { name: 'is_measured', type: 'string' },
                { name: 'status', type: 'string', isOptional: true },
                { name: 'system_id', type: 'string', isIndexed: true },
            ],
        }),
        tableSchema({
            name: 'points',
            columns: [
                { name: 'code', type: 'string' },
                { name: 'description', type: 'string' },
                { name: 'is_measured', type: 'boolean' },
                { name: 'asset_id', type: 'string', isIndexed: true },
            ],
        }),
    ],
});
