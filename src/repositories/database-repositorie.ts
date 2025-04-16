import { database } from '../database';
import { Q } from '@nozbe/watermelondb';
import {SurveyStore} from "../types/survey-store.ts";
import {CollectData} from "../types/collect-data.ts";

export const saveCollectData = async (surveyData: SurveyStore, collectData: CollectData) => {
    const surveys = database.get('surveys');
    const existing = await surveys
        .query(
            Q.where('asset_id', surveyData.assetId!),
            Q.where('point_id', surveyData.pointId!)
        )
        .fetch();

    let survey;

    await database.write(async () => {
        if (existing.length === 0) {
            survey = await surveys.create(s => {
                s.assetId = surveyData.assetId!;
                s.assetDescription = surveyData.assetDescription;
                s.isMonoaxial = surveyData.isMonoaxial;
                s.pointId = surveyData.pointId!;
                s.pointCode = surveyData.pointCode;
                s.pointDescription = surveyData.pointDescription;
                s.plantId = surveyData.plantId!;
                s.plantDescription = surveyData.plantDescription!;
            });
        } else {
            survey = existing[0];
        }

        await survey.collections.get('collects').create(c => {
            c.survey.set(survey);
            c.uuid = collectData.uuid!;
            c.date = collectData.date!;
            c.time = collectData.time!;
            c.synced = collectData.synced ?? false;
            c.nextXW = JSON.stringify(collectData.NEXT_X_W ?? []);
            c.nextXS = JSON.stringify(collectData.NEXT_X_S ?? []);
            c.nextYW = JSON.stringify(collectData.NEXT_Y_W ?? []);
            c.nextYS = JSON.stringify(collectData.NEXT_Y_S ?? []);
            c.nextZW = JSON.stringify(collectData.NEXT_Z_W ?? []);
            c.nextZS = JSON.stringify(collectData.NEXT_Z_S ?? []);
            c.vars = JSON.stringify(collectData.vars ?? {});
        });
    });
};
