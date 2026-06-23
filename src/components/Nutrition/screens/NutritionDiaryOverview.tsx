import { LoadingPlaceholder } from "@/core/ui/LoadingWidget/LoadingWidget";
import { WgerContainerRightSidebar } from "@/core/ui/Widgets/Container";
import { DiaryEntry } from "@/components/Nutrition/models/diaryEntry";
import { MealItem } from "@/components/Nutrition/models/mealItem";
import { useFetchNutritionalPlanDateQuery } from "@/components/Nutrition/queries";
import { useDeleteDiaryEntryQuery } from "@/components/Nutrition/queries/diary";
import { IngredientDetailTable } from "@/components/Nutrition/widgets/IngredientDetailTable";
import {
    LoggedPlannedNutritionalValuesTable
} from "@/components/Nutrition/widgets/LoggedPlannedNutritionalValuesTable";
import { dateToLocale, parseLocalDate } from "@/core/lib/date";
import { Stack, Typography } from "@mui/material";
import React from "react";
import { useTranslation } from "react-i18next";
import { useParams } from "react-router-dom";


export const NutritionDiaryOverview = () => {
    const [t] = useTranslation();
    const params = useParams<{ planId: string, date: string }>();

    const planId = params.planId ?? '';
    if (planId === '') {
        return <p>Please pass a UUID as the nutritional plan id.</p>;
    }

    const date = parseLocalDate(params.date!);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const planQuery = useFetchNutritionalPlanDateQuery(planId, params.date!);
    // eslint-disable-next-line react-hooks/rules-of-hooks
    const deleteEntry = useDeleteDiaryEntryQuery(planId);

    const handleDelete = (item: MealItem | DiaryEntry) => {
        if (item.id && window.confirm(t('nutrition.confirmDeleteDiaryEntry', 'Remove this entry from your diary?'))) {
            deleteEntry.mutate(item.id);
        }
    };

    return planQuery.isLoading
        ? <LoadingPlaceholder />
        : <WgerContainerRightSidebar
            title={t('nutrition.nutritionalDiary')}
            mainContent={<>
                <Stack spacing={2}>
                    <Typography gutterBottom variant="h4">
                        {dateToLocale(date)}
                    </Typography>
                    <LoggedPlannedNutritionalValuesTable
                        logged={planQuery.data!.loggedNutritionalValuesDate(date)}
                        planned={planQuery.data!.plannedNutritionalValues}
                    />
                    <IngredientDetailTable
                        values={planQuery.data!.loggedNutritionalValuesDate(date)}
                        items={planQuery.data!.loggedEntriesDate(date)}
                        onDelete={handleDelete}
                        showSum={true} />

                </Stack>
            </>}
        />;
};