/*
 * Standard measuring units for food logging.
 *
 * This mirrors the server-side registry in `wger/nutrition/units.py` exactly,
 * so the client and server resolve a logged amount to grams the same way.
 *
 * Two families:
 *  - MASS units (mg, g, kg, oz, lb) convert to grams with a fixed factor and
 *    are always available.
 *  - VOLUME units (ml, l, tsp, ...) convert to grams only via the ingredient's
 *    density (g/ml). Without a density, volume units cannot be used.
 */

export enum UnitCategory {
    Mass = "mass",
    Volume = "volume",
}

export interface MeasurementUnit {
    key: string;
    category: UnitCategory;
    /** Grams per unit for mass units; millilitres per unit for volume units. */
    factor: number;
}

// Grams per unit (international avoirdupois pound).
const MASS_FACTORS: Record<string, number> = {
    mg: 0.001,
    g: 1,
    kg: 1000,
    oz: 28.349523125,
    lb: 453.59237,
};

// Millilitres per unit (US customary).
const VOLUME_FACTORS: Record<string, number> = {
    ml: 1,
    l: 1000,
    tsp: 4.92892159375,
    tbsp: 14.78676478125,
    floz: 29.5735295625,
    cup: 236.5882365,
    pint: 473.176473,
    quart: 946.352946,
    gallon: 3785.411784,
};

export const MEASUREMENT_UNITS: Record<string, MeasurementUnit> = {
    ...Object.fromEntries(
        Object.entries(MASS_FACTORS).map(([key, factor]) => [
            key,
            { key, category: UnitCategory.Mass, factor },
        ])
    ),
    ...Object.fromEntries(
        Object.entries(VOLUME_FACTORS).map(([key, factor]) => [
            key,
            { key, category: UnitCategory.Volume, factor },
        ])
    ),
};

export const MASS_UNIT_KEYS = Object.keys(MASS_FACTORS);
export const VOLUME_UNIT_KEYS = Object.keys(VOLUME_FACTORS);

// A "serving" is ingredient-relative (1 serving = serving_weight_grams), not a
// fixed measuring unit, so it's not in MEASUREMENT_UNITS. Mirrors the server.
export const SERVING_UNIT_KEY = "serving";

// Short human labels for each unit key (abbreviations, largely locale-neutral).
export const UNIT_LABELS: Record<string, string> = {
    mg: "mg",
    g: "g",
    kg: "kg",
    oz: "oz",
    lb: "lb",
    ml: "mL",
    l: "L",
    tsp: "tsp",
    tbsp: "tbsp",
    floz: "fl oz",
    cup: "cup",
    pint: "pt",
    quart: "qt",
    gallon: "gal",
    [SERVING_UNIT_KEY]: "serving",
};

export function unitLabel(key: string): string {
    return UNIT_LABELS[key] ?? key;
}

export function getUnit(key: string): MeasurementUnit {
    const unit = MEASUREMENT_UNITS[key];
    if (!unit) {
        throw new Error(`Unknown measuring unit: ${key}`);
    }
    return unit;
}

export function isVolumeUnit(key: string): boolean {
    return MEASUREMENT_UNITS[key]?.category === UnitCategory.Volume;
}

/*
 * Convert `amount` of the given standard unit to grams.
 *
 * @param amount   numeric amount of units
 * @param unitKey  a key from MEASUREMENT_UNITS
 * @param density  ingredient density in g/ml, required for volume units
 * @throws if the unit is unknown, or a volume unit is used without a density
 */
export function amountToGrams(
    amount: number,
    unitKey: string,
    density: number | null = null,
): number {
    const unit = getUnit(unitKey);

    if (unit.category === UnitCategory.Mass) {
        return amount * unit.factor;
    }

    if (density === null || density === undefined) {
        throw new Error(`Cannot convert volume unit "${unitKey}" to grams without a density`);
    }

    const millilitres = amount * unit.factor;
    return millilitres * density;
}
