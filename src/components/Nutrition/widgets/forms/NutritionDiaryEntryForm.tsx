import { Autocomplete, Button, InputAdornment, MenuItem, Select, Stack, TextField } from "@mui/material";
import { DateTimePicker, LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterLuxon } from "@mui/x-date-pickers/AdapterLuxon";
import { DiaryEntry } from "@/components/Nutrition/models/diaryEntry";
import { Ingredient } from "@/components/Nutrition/models/Ingredient";
import { Meal } from "@/components/Nutrition/models/meal";
import { NutritionWeightUnit } from "@/components/Nutrition/models/weightUnit";
import { useAddDiaryEntryQuery, useEditDiaryEntryQuery } from "@/components/Nutrition/queries";
import { IngredientAutocompleter } from "@/components/Nutrition/widgets/IngredientAutocompleter";
import { Form, Formik } from "formik";
import { DateTime } from "luxon";
import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import { dateToYYYYMMDD } from "@/core/lib/date";
import {
    MASS_UNIT_KEYS,
    VOLUME_UNIT_KEYS,
    unitLabel,
} from "@/core/lib/units";
import * as yup from "yup";

// Dropdown value for plain grams (the default). Maps to unit=null, weightUnit=null.
const GRAM_UNIT_VALUE = 'g';
// Prefix distinguishing a per-ingredient portion (by id) from a standard unit key.
const WEIGHT_UNIT_PREFIX = 'wu:';

type NutritionDiaryEntryFormProps = {
    planId: string,
    entry?: DiaryEntry,
    mealId?: string | null,
    meals?: Meal[],
    closeFn?: () => void,
}

export const NutritionDiaryEntryForm = ({ planId, entry, mealId, meals, closeFn }: NutritionDiaryEntryFormProps) => {

    const meal = mealId === undefined ? null : mealId;
    const mealObjs = meals === undefined ? [] : meals;

    const [t, i18n] = useTranslation();
    const addDiaryQuery = useAddDiaryEntryQuery(planId);
    const editDiaryQuery = useEditDiaryEntryQuery(planId);
    const [dateValue, setDateValue] = useState<DateTime | null>(entry ? DateTime.fromJSDate(entry.datetime, { zone: 'system' }) : DateTime.now().setZone('system'));
    const [selectedMeal, setSelectedMeal] = useState<string | null>(meal);

    const initialUnitValue = entry?.unit
        ? entry.unit
        : entry?.weightUnit
            ? `${WEIGHT_UNIT_PREFIX}${entry.weightUnit.id}`
            : GRAM_UNIT_VALUE;
    const [ingredient, setIngredient] = useState<Ingredient | null>(entry?.ingredient ?? null);
    const [unitValue, setUnitValue] = useState<string>(initialUnitValue);
    const weightUnits = ingredient?.weightUnits ?? [];

    const validationSchema = yup.object({
        amount: yup
            .number()
            .required(t('forms.fieldRequired'))
            .max(1000, t('forms.maxValue', { value: '1000' }))
            .moreThan(0, t('forms.minValue', { value: '0' })),
        ingredient: yup
            .number()
            .nullable()
            .moreThan(0, t('forms.fieldRequired'))
            .required(t('forms.fieldRequired')),
        datetime: yup
            .date()
            .required(t('forms.fieldRequired')),
    });

    // Decode the dropdown value into the two persisted fields: a standard
    // measuring unit key, or a per-ingredient portion (weightUnit), or grams.
    const decodeUnitValue = (value: string): {
        unit: string | null,
        weightUnit: NutritionWeightUnit | null,
    } => {
        if (value === GRAM_UNIT_VALUE) {
            return { unit: null, weightUnit: null };
        }
        if (value.startsWith(WEIGHT_UNIT_PREFIX)) {
            const id = Number(value.slice(WEIGHT_UNIT_PREFIX.length));
            return { unit: null, weightUnit: weightUnits.find(u => u.id === id) ?? null };
        }
        return { unit: value, weightUnit: null };
    };

    return (
        (<Formik
            initialValues={{
                datetime: new Date(),
                amount: 0,
                ingredient: null,
            }}
            validationSchema={validationSchema}
            onSubmit={async (values) => {

                // Make sure "amount" is a number
                const newAmount = Number(values.amount);
                const { unit, weightUnit } = decodeUnitValue(unitValue);

                if (entry) {
                    // Edit
                    const newDiaryEntry = DiaryEntry.clone(entry, {
                        mealId: selectedMeal,
                        planId: planId,
                        amount: newAmount,
                        datetime: values.datetime,
                        ingredientId: values.ingredient!,
                        weightUnitId: weightUnit?.id ?? null,
                        weightUnit: weightUnit,
                        unit: unit,
                    });
                    editDiaryQuery.mutate(newDiaryEntry);
                } else {
                    // Add
                    addDiaryQuery.mutate(new DiaryEntry({
                        planId: planId,
                        amount: newAmount,
                        datetime: values.datetime,
                        ingredientId: values.ingredient!,
                        mealId: selectedMeal,
                        weightUnitId: weightUnit?.id ?? null,
                        weightUnit: weightUnit,
                        unit: unit,
                    }));
                }

                // if closeFn is defined, close the modal (this form does not have to be displayed in one)
                if (closeFn) {
                    closeFn();
                }
            }}
        >
            {formik => (
                <Form>
                    <Stack spacing={2}>
                        <IngredientAutocompleter
                            callback={(value: Ingredient | null) => {
                                formik.setFieldTouched('ingredient', true);
                                formik.setFieldValue('ingredient', value?.id ?? null);
                                setIngredient(value);
                                setUnitValue(GRAM_UNIT_VALUE);
                            }}
                            />
                            {formik.touched.ingredient && formik.errors.ingredient && (
                            <div style={{ color: 'crimson', fontSize: '0.7rem', marginLeft: '12px' }}>
                                {formik.errors.ingredient}
                            </div>
                            )}
                        <TextField
                            fullWidth
                            id="amount"
                            label={'amount'}
                            slotProps={{
                                input: {
                                    endAdornment: (
                                        <InputAdornment position="end">
                                            <Select
                                                variant="standard"
                                                disableUnderline
                                                value={unitValue}
                                                onChange={(e) => setUnitValue(e.target.value)}
                                            >
                                                <MenuItem value={GRAM_UNIT_VALUE}>
                                                    {t('nutrition.gramShort')}
                                                </MenuItem>
                                                {MASS_UNIT_KEYS.filter(k => k !== GRAM_UNIT_VALUE).map(key => (
                                                    <MenuItem key={key} value={key}>
                                                        {unitLabel(key)}
                                                    </MenuItem>
                                                ))}
                                                {ingredient?.density != null && VOLUME_UNIT_KEYS.map(key => (
                                                    <MenuItem key={key} value={key}>
                                                        {unitLabel(key)}
                                                    </MenuItem>
                                                ))}
                                                {weightUnits.map(unit => (
                                                    <MenuItem
                                                        key={unit.id}
                                                        value={`${WEIGHT_UNIT_PREFIX}${unit.id}`}
                                                    >
                                                        {unit.name} ({unit.grams}g)
                                                    </MenuItem>
                                                ))}
                                            </Select>
                                        </InputAdornment>
                                    )
                                }
                            }}
                            error={formik.touched.amount && Boolean(formik.errors.amount)}
                            helperText={formik.touched.amount && formik.errors.amount}
                            {...formik.getFieldProps('amount')}
                        />
                        {mealObjs.length > 0 && <Autocomplete
                            value={selectedMeal}
                            options={mealObjs.map(e => e.id)}
                            getOptionLabel={option => mealObjs.find(e => e.id === option)!.displayName!}
                            onChange={(event, newValue) => setSelectedMeal(newValue)}
                            renderInput={params => (
                                <TextField
                                    label={t("nutrition.meal")}
                                    value={selectedMeal}
                                    {...params}
                                />
                            )}
                        />}
                        <LocalizationProvider dateAdapter={AdapterLuxon} adapterLocale={i18n.language}>

                            <DateTimePicker
                                format="yyyy-MM-dd HH:mm"
                                label={t('date')}
                                value={dateValue}
                                timezone="system"
                                disableFuture={true}
                                onChange={(newValue) => {
                                    formik.setFieldValue('datetime', newValue?.toJSDate());

                                    setDateValue(newValue);
                                }}
                                shouldDisableDate={(date) => {

                                    // Allow the date of the current weight entry, since we are editing it
                                    // @ts-ignore - date is a Luxon DateTime!
                                    if (entry && dateToYYYYMMDD(entry.datetime) === dateToYYYYMMDD(date.toJSDate())) {
                                        return false;
                                    }

                                    // all other dates are allowed
                                    return false;
                                }}
                            />
                        </LocalizationProvider>
                        <Stack direction="row" spacing={2} sx={{ justifyContent: "end" }}>
                            {closeFn !== undefined
                                && <Button color="primary" variant="outlined" onClick={() => closeFn()}>
                                    {t('close')}
                                </Button>}
                            <Button color="primary" variant="contained" type="submit">
                                {t('submit')}
                            </Button>
                        </Stack>
                    </Stack>
                </Form>
            )}
        </Formik>)
    );
};
