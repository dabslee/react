import { Button, InputAdornment, MenuItem, Select, Stack, TextField } from "@mui/material";
import { Ingredient } from "@/components/Nutrition/models/Ingredient";
import { MealItem } from "@/components/Nutrition/models/mealItem";
import { NutritionWeightUnit } from "@/components/Nutrition/models/weightUnit";
import {
    useAddMealItemQuery,
    useDeleteMealItemQuery,
    useEditMealItemQuery,
} from "@/components/Nutrition/queries";
import { IngredientAutocompleter } from "@/components/Nutrition/widgets/IngredientAutocompleter";
import {
    MASS_UNIT_KEYS,
    VOLUME_UNIT_KEYS,
    unitLabel,
} from "@/core/lib/units";
import { Form, Formik } from "formik";
import React, { useState } from 'react';
import { useTranslation } from "react-i18next";
import * as yup from "yup";

const GRAM_UNIT_VALUE = 'g';
const WEIGHT_UNIT_PREFIX = 'wu:';

type MealItemFormProps =
    | { planId: string; item: MealItem; closeFn?: () => void; mealId?: string }
    | { planId: string; mealId: string; item?: undefined; closeFn?: () => void };

export const MealItemForm = ({ planId, item, mealId, closeFn }: MealItemFormProps) => {

    const [t] = useTranslation();
    const addMealItemQuery = useAddMealItemQuery(planId);
    const editMealItemQuery = useEditMealItemQuery(planId);
    const deleteMealItemQuery = useDeleteMealItemQuery(planId);

    const initialUnitValue = item?.unit
        ? item.unit
        : item?.weightUnit
            ? `${WEIGHT_UNIT_PREFIX}${item.weightUnit.id}`
            : GRAM_UNIT_VALUE;
    const [ingredient, setIngredient] = useState<Ingredient | null>(item?.ingredient ?? null);
    const [unitValue, setUnitValue] = useState<string>(initialUnitValue);
    const weightUnits = ingredient?.weightUnits ?? [];

    const handleDelete = () => {
        if (item) {
            deleteMealItemQuery.mutate(item.id!);
        }

        if (closeFn) {
            closeFn();
        }
    };

    const validationSchema = yup.object({
        amount: yup
            .number()
            .required(t('forms.fieldRequired'))
            .max(1000, t('forms.maxValue', { value: '1000' }))
            .moreThan(0, t('forms.minValue', { value: '0' })),
        ingredient: yup
            .number()
            .required(t('forms.fieldRequired')),
    });

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
        <Formik
            initialValues={{
                amount: item ? item.amount : 0,
                ingredient: item ? item.ingredientId : 0,
            }}
            validationSchema={validationSchema}
            onSubmit={async (values) => {

                // Just to make sure we get a number
                const newAmount = Number(values.amount);
                const { unit, weightUnit } = decodeUnitValue(unitValue);

                if (item) {
                    // Edit
                    const newMealItem = MealItem.clone(item, {
                        amount: newAmount,
                        ingredientId: values.ingredient,
                        weightUnitId: weightUnit?.id ?? null,
                        weightUnit: weightUnit,
                        unit: unit,
                    });
                    editMealItemQuery.mutate(newMealItem);
                } else {
                    // Add
                    addMealItemQuery.mutate(new MealItem({
                        mealId: mealId!,
                        amount: newAmount,
                        ingredientId: values.ingredient,
                        weightUnitId: weightUnit?.id ?? null,
                        weightUnit: weightUnit,
                        unit: unit,
                        order: 1,
                    }));
                }

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
                                formik.setFieldValue('ingredient', value ? value.id : null);
                                setIngredient(value);
                                setUnitValue(GRAM_UNIT_VALUE);
                            }}
                            initialIngredient={item ? item.ingredient : null}
                        />
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

                        <Stack direction="row" spacing={2} sx={{ justifyContent: "end" }}>
                            {(closeFn !== undefined && item !== undefined)
                                && <Button color="error" variant="outlined" onClick={handleDelete}>
                                    {t('delete')}
                                </Button>}

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
        </Formik>
    );
};
