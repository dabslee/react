import { Ingredient } from "@/components/Nutrition/models/Ingredient";
import { API_RESULTS_PAGE_SIZE, ApiPath, LANGUAGE_SHORT_ENGLISH } from "@/core/lib/consts";
import { fetchPaginated } from "@/core/lib/requests";
import { makeHeader, makeUrl } from "@/core/lib/url";
import { SearchLanguageFilter } from '@/core/ui/Widgets/SearchLanguageFilter';
import { ApiIngredientType, NutriScoreValue } from '@/types';
import axios from 'axios';
import { memoize } from "lodash";

export type IngredientLanguageFilter = SearchLanguageFilter;

export interface IngredientSearchFilters {
    languageCode: string;
    languageFilter?: IngredientLanguageFilter;
    /** Explicit language short-codes from the user's profile. When non-empty, overrides languageFilter. */
    explicitLanguageCodes?: string[];
    isVegan?: boolean;
    isVegetarian?: boolean;
    /** Worst acceptable Nutri-Score grade; sent as `nutriscore__lte`. */
    nutriscoreMax?: NutriScoreValue;
    /** Use trigram-similarity search (`name__similar`) instead of substring (`name__search`). */
    useSimilarSearch?: boolean;
}


/*
 * Memoized version of getIngredient. This caches results in memory for the duration
 * of the app session, which avoids multiple requests for the same ingredient.
 */
export const getIngredient = memoize(async (id: number): Promise<Ingredient> => {
    const { data: receivedIngredient } = await axios.get<ApiIngredientType>(
        makeUrl(ApiPath.INGREDIENTINFO_PATH, { id: id }),
        { headers: makeHeader() },
    );

    return Ingredient.fromJson(receivedIngredient);
});

export const getIngredients = async (ids: number[]): Promise<Ingredient[]> => {

    // If IDs is an empty list, return. Otherwise, the resulting empty id__in will
    // cause the API to not filter at all
    if (ids.length === 0) {
        return [];
    }


    const url = makeUrl(ApiPath.INGREDIENTINFO_PATH, { query: { id__in: ids.join(',') } });
    const out: Ingredient[] = [];

    // Collect all the ingredients
    for await (const page of fetchPaginated(url, makeHeader())) {
        for (const logData of page) {
            out.push(Ingredient.fromJson(logData));
        }
    }

    return out;
};


export const searchIngredient = async (
    name: string,
    filters: IngredientSearchFilters,
): Promise<Ingredient[]> => {
    const {
        languageCode,
        languageFilter = "current_english",
        explicitLanguageCodes,
        isVegan,
        isVegetarian,
        nutriscoreMax,
        useSimilarSearch = false,
    } = filters;

    let languages: string[] | null;
    if (explicitLanguageCodes && explicitLanguageCodes.length > 0) {
        languages = explicitLanguageCodes;
    } else {
        languages = languageFilter === "all" ? null : [languageCode];
        if (languages && languageFilter === "current_english" && languageCode !== LANGUAGE_SHORT_ENGLISH) {
            languages.push(LANGUAGE_SHORT_ENGLISH);
        }
    }

    const searchParam = useSimilarSearch ? 'name__similar' : 'name__search';
    const query: Record<string, string | number> = {
        [searchParam]: name,
        'limit': API_RESULTS_PAGE_SIZE,
    };
    if (languages) {
        query['language__code'] = languages.join(',');
    }
    if (isVegan !== undefined) {
        query['is_vegan'] = String(isVegan);
    }
    if (isVegetarian !== undefined) {
        query['is_vegetarian'] = String(isVegetarian);
    }
    if (nutriscoreMax !== undefined) {
        query['nutriscore__lte'] = nutriscoreMax;
    }

    const url = makeUrl(ApiPath.INGREDIENTINFO_PATH, { query });

    const { data } = await axios.get(url, { headers: makeHeader() },);
    return data.results.map((entry: ApiIngredientType) => Ingredient.fromJson(entry));
};


export interface OffSearchResult {
    code: string;
    name: string;
    brand: string | null;
    imageUrl: string | null;
    nutriscore: NutriScoreValue | null;
    energy: number | null;
    existsLocally: boolean;
}

export interface OffSearchResponse {
    results: OffSearchResult[];
    hasMore: boolean;
    page: number;
}

/*
 * Search Open Food Facts by product name (not barcode). Returns lightweight
 * previews used to add ingredients that aren't in the local catalogue yet.
 */
export const searchIngredientOff = async (
    query: string,
    page = 1,
): Promise<OffSearchResponse> => {
    const url = makeUrl(ApiPath.INGREDIENT_PATH, {
        objectMethod: 'off-search',
        query: { q: query, page },
    });
    const { data } = await axios.get(url, { headers: makeHeader() });

    return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        results: (data.results ?? []).map((r: any) => ({
            code: r.code,
            name: r.name,
            brand: r.brand ?? null,
            imageUrl: r.image_url ?? null,
            nutriscore: r.nutriscore ?? null,
            energy: r.energy ?? null,
            existsLocally: r.exists_locally ?? false,
        })),
        hasMore: data.has_more ?? false,
        page: data.page ?? page,
    };
};
