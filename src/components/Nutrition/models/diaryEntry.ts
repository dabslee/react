import { NutritionalValues } from "@/components/Nutrition/helpers/nutritionalValues";
import { Ingredient } from "@/components/Nutrition/models/Ingredient";
import { NutritionWeightUnit } from "@/components/Nutrition/models/weightUnit";
import i18n from "@/i18n";
import { Adapter } from "@/core/lib/Adapter";
import { numberGramLocale } from "@/core/lib/numbers";
import { unitLabel } from "@/core/lib/units";

export interface ApiNutritionDiaryType {
    id: string,
    plan: string,
    meal: string | null,
    ingredient: number,
    weight_unit: number,
    unit: string | null,
    datetime: Date,
    amount: string
}

export type DiaryEntryConstructorParams = {
    id?: string;
    planId: string;
    mealId?: string | null;
    ingredientId: number;
    weightUnitId?: number | null;
    unit?: string | null;
    amount: number;
    datetime: Date;
    ingredient?: Ingredient | null;
    weightUnit?: NutritionWeightUnit | null;
};

export class DiaryEntry {

    public id?: string | null;
    public planId: string;
    public mealId: string | null;
    public amount: number;
    public datetime: Date;

    public ingredientId: number;
    public ingredient: Ingredient | null = null;
    public weightUnitId: number | null;
    public weightUnit: NutritionWeightUnit | null = null;
    public unit: string | null;


    constructor(params: DiaryEntryConstructorParams) {
        this.id = params.id ?? null;
        this.planId = params.planId;
        this.mealId = params.mealId ?? null;
        this.amount = params.amount;
        this.datetime = params.datetime;
        this.unit = params.unit ?? null;

        this.ingredientId = params.ingredientId;
        if (params.ingredient) {
            this.ingredient = params.ingredient;
            this.ingredientId = params.ingredient.id;
        }

        this.weightUnitId = params.weightUnitId ?? null;
        if (params.weightUnit) {
            this.weightUnit = params.weightUnit;
            this.weightUnitId = params.weightUnit.id;
        }
    }

    get amountString(): string {
        if (this.unit) {
            return `${this.amount} ${unitLabel(this.unit)}`;
        }
        if (this.weightUnit) {
            return `${this.amount.toFixed()} × ${this.weightUnit.name}`;
        }
        return numberGramLocale(this.amount, i18n.language);
    }

    get nutritionalValues() {
        if (this.ingredient) {
            return NutritionalValues.fromIngredient(this.ingredient, this.amount, this.weightUnit, this.unit);
        }
        return new NutritionalValues();
    }

    static clone(other: DiaryEntry, overrides?: Partial<DiaryEntryConstructorParams>): DiaryEntry {
        const ingredient = overrides?.ingredient ?? other.ingredient;
        const weightUnit = overrides?.weightUnit ?? other.weightUnit;

        return new DiaryEntry({
            id: overrides?.id ?? (other.id ?? undefined),
            planId: overrides?.planId ?? other.planId,
            mealId: overrides?.mealId ?? other.mealId,
            amount: overrides?.amount ?? other.amount,
            datetime: overrides?.datetime ?? other.datetime,
            ingredientId: ingredient ? ingredient.id : (overrides?.ingredientId ?? other.ingredientId),
            ingredient,
            weightUnitId: weightUnit ? weightUnit.id : (overrides?.weightUnitId ?? other.weightUnitId),
            weightUnit,
            unit: overrides?.unit ?? other.unit,
        });
    }

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    static fromJson(json: any): DiaryEntry {
        return adapter.fromJson(json);
    }

    toJson() {
        return adapter.toJson(this);
    }
}

class DiaryEntryAdapter implements Adapter<DiaryEntry> {
    fromJson(item: ApiNutritionDiaryType) {
        return new DiaryEntry({
            id: item.id,
            planId: item.plan,
            mealId: item.meal,
            ingredientId: item.ingredient,
            weightUnitId: item.weight_unit,
            unit: item.unit,
            amount: parseFloat(item.amount),
            datetime: new Date(item.datetime),
        });
    }

    toJson(item: DiaryEntry) {
        return {
            plan: item.planId,
            meal: item.mealId,
            ingredient: item.ingredientId,

            // eslint-disable-next-line camelcase
            weight_unit: item.weightUnitId,
            unit: item.unit,
            amount: item.amount.toString(),
            datetime: item.datetime.toISOString(),
        };
    }
}


const adapter = new DiaryEntryAdapter();