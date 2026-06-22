import { FilterType } from "@/components/Weight/widgets/FilterButtons";
import i18n from 'i18next';
import { DateTime, DateTimeFormatOptions } from "luxon";


/*
 * Canonical converter for a date-only string into a Date.
 *
 * The whole app follows one rule: instants (datetimes) are stored in UTC and
 * displayed in local time, while a bare calendar day (YYYY-MM-DD) has no
 * timezone at all. The trap is that `new Date("2026-06-22")` parses as UTC
 * midnight, so in any negative-offset timezone it reads back as the *previous*
 * local day. Every date-only field must come through here instead so it lands
 * on local midnight of the day it names.
 *
 * Full datetime strings (containing a time/offset) are genuine instants, so
 * they are passed straight to `new Date()`, which resolves them correctly and
 * is then displayed via local accessors (getHours/getDate/...).
 */
export function parseLocalDate(value: string | Date): Date {
    if (value instanceof Date) {
        return value;
    }

    // Date-only (YYYY-MM-DD): build local midnight explicitly.
    const dateOnlyMatch = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
    if (dateOnlyMatch) {
        const [, y, m, d] = dateOnlyMatch;
        return new Date(Number(y), Number(m) - 1, Number(d), 0, 0, 0, 0);
    }

    // Anything with a time component is an instant; new Date() handles it.
    return new Date(value);
}

export function isSameDay(date1: Date, date2: Date): boolean {
    return (
        date1.getFullYear() === date2.getFullYear() &&
        date1.getMonth() === date2.getMonth() &&
        date1.getDate() === date2.getDate()
    );
}

/*
 * Util function that converts a date to a YYYY-MM-DD string using local time.
 */
export function dateToYYYYMMDD(date: Date): string {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
}

/*
 * Returns the UTC ISO timestamps for the start and end of a local calendar day,
 * suitable for datetime__gte / datetime__lt filters on the Django side.
 */
export function localDayToUtcRange(date: Date): { gte: string; lt: string } {
    const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
    const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0);
    return { gte: start.toISOString(), lt: end.toISOString() };
}


/*
 * Returns the localized time from a date object
 */
export function dateTimeToLocaleHHMM(dateTime: Date | null, locale?: string, options?: Intl.DateTimeFormatOptions) {
    if (dateTime == null) {
        return null;
    }
    locale = locale ?? i18n.language;
    options = options ?? { hour: '2-digit', minute: '2-digit' };

    return dateTime.toLocaleTimeString(
        locale ? [locale] : [],
        options
    );
}

export function dateTimeToLocale(dateTime: Date | null, locale?: string, options?: Intl.DateTimeFormatOptions,) {
    if (dateTime == null) {
        console.warn("dateTimeToLocaleHHMM called with null datetime!");
        return '';
    }

    locale = locale ?? i18n.language;
    options = options ?? {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit'
    };

    return dateTime.toLocaleString(locale ? [locale] : [], options);
}

export function luxonDateTimeToLocale(dateTime: DateTime | null, locale?: string, options?: DateTimeFormatOptions,) {
    if (dateTime == null) {
        console.warn("luxonDateTimeToLocale called with null datetime!");
        return '';
    }

    locale = locale ?? i18n.language;
    options = options ?? DateTime.DATE_MED;

    return dateTime.toLocaleString(options, { locale: locale });
}

export function dateToLocale(dateTime: Date | null, locale?: string, options?: Intl.DateTimeFormatOptions) {
    if (dateTime == null) {
        console.warn('dateToLocale called with null date!');
        return '';
    }

    locale = locale ?? i18n.language;
    options = options ?? {
        year: '2-digit',
        month: '2-digit',
        day: '2-digit',
    };


    return dateTime.toLocaleString(locale ? [locale] : [], options);
}

/*
 * Converts a date object to a non localized string in the format HH:MM
 */
export function dateTimeToHHMM(date: Date | null) {
    if (date == null) {
        return null;
    }
    const [hour, minute] = date.toTimeString().split(':');
    return `${hour}:${minute}`;
}

/*
 * Converts HH:MM to a date object
 *
 * Note that this is only used when converting times from the api, so we don't
 * have to consider that there could be annoying AMs and PMs in the string
 */
export function HHMMToDateTime(time: string | null) {

    if (time == null) {
        return null;
    }

    const [hour, minute] = time.split(':', 2);
    const dateTime = new Date();
    dateTime.setHours(parseInt(hour));
    dateTime.setMinutes(parseInt(minute));

    return dateTime;
}

/*
 * Util function that calculates a date in the past based on a string filter
 * and returns it as a YYYY-MM-DD string for API queries.
 *
 * @param filter - A string representing the desired time period (e.g., 'lastWeek', 'lastMonth')
 * @param currentDate - (Optional) The current date to base calculations on. Defaults to `new Date()`.
 *                      This parameter allows for testing or custom date bases.
 * @returns - Date string in the format YYYY-MM-DD or undefined for no filtering
 */
export function calculatePastDate(filter: FilterType, currentDate: Date = new Date()): string | undefined {

    // Dictionary for filters
    const filterMap: Record<FilterType, (() => void) | undefined> = {
        lastWeek: () => currentDate.setDate(currentDate.getDate() - 7),
        lastMonth: () => currentDate.setMonth(currentDate.getMonth() - 1),
        lastHalfYear: () => currentDate.setMonth(currentDate.getMonth() - 6),
        lastYear: () => currentDate.setFullYear(currentDate.getFullYear() - 1),
        '': undefined
    };

    // Execute the corresponding function for the filter
    const applyFilter = filterMap[filter];
    if (applyFilter) {
        applyFilter();
    } else {
        return undefined;
    }

    return dateToYYYYMMDD(currentDate);
}