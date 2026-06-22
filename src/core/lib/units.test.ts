import {
    MASS_UNIT_KEYS,
    MEASUREMENT_UNITS,
    UnitCategory,
    VOLUME_UNIT_KEYS,
    amountToGrams,
    getUnit,
    isVolumeUnit,
    unitLabel,
} from "@/core/lib/units";

describe("measuring unit registry", () => {

    test('expected units are present', () => {
        expect(new Set(Object.keys(MEASUREMENT_UNITS))).toEqual(new Set([
            'mg', 'g', 'kg', 'oz', 'lb',
            'ml', 'l', 'tsp', 'tbsp', 'floz', 'cup', 'pint', 'quart', 'gallon',
        ]));
    });

    test('categories are correct', () => {
        expect(getUnit('oz').category).toBe(UnitCategory.Mass);
        expect(getUnit('cup').category).toBe(UnitCategory.Volume);
        expect(isVolumeUnit('cup')).toBe(true);
        expect(isVolumeUnit('oz')).toBe(false);
        expect(MASS_UNIT_KEYS).toContain('lb');
        expect(VOLUME_UNIT_KEYS).toContain('gallon');
    });

    test('unknown unit throws', () => {
        expect(() => getUnit('furlong')).toThrow();
    });

    test('labels', () => {
        expect(unitLabel('floz')).toBe('fl oz');
        expect(unitLabel('g')).toBe('g');
    });
});

describe("amountToGrams", () => {

    test('mass units are density-independent', () => {
        expect(amountToGrams(1, 'g')).toBeCloseTo(1, 4);
        expect(amountToGrams(1, 'kg')).toBeCloseTo(1000, 4);
        expect(amountToGrams(8, 'oz')).toBeCloseTo(226.796, 2);
        expect(amountToGrams(1, 'lb')).toBeCloseTo(453.592, 2);
    });

    test('volume units use density', () => {
        expect(amountToGrams(1, 'cup', 1)).toBeCloseTo(236.588, 2);
        expect(amountToGrams(1, 'gallon', 1)).toBeCloseTo(3785.41, 1);
        expect(amountToGrams(1, 'tbsp', 1)).toBeCloseTo(14.7868, 3);
    });

    test('volume scales with density', () => {
        expect(amountToGrams(1, 'cup', 0.5)).toBeCloseTo(118.294, 2);
        expect(amountToGrams(1, 'cup', 1.5)).toBeCloseTo(354.882, 2);
    });

    test('volume without density throws', () => {
        expect(() => amountToGrams(1, 'cup')).toThrow();
        expect(() => amountToGrams(1, 'cup', null)).toThrow();
    });
});
