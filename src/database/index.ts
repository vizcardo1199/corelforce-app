// src/database/index.ts

import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

// Importa tu esquema y modelos
import Survey from '../models/Survey';
import Collect from '../models/Collect';
import {mySchema} from '../models/schema.ts';
import Point from '../models/Point.model.ts';
import Asset from '../models/Asset.model.ts';
import System from '../models/System.model.ts';
import Area from '../models/Area.model.ts';
import Plant from '../models/Plant.model.ts';

// Crea el adaptador SQLite
const adapter = new SQLiteAdapter({
    schema: mySchema,
    onSetUpError: error => {
        console.error('Error setting up WatermelonDB', error);
    },
});

// Crea la instancia de base de datos
export const database = new Database({
    adapter,
    modelClasses: [
        Survey,
        Collect,
        Plant, Area, System, Asset, Point,
    ],
    actionsEnabled: true,
});
