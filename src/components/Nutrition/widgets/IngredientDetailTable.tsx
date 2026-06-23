import DeleteOutlineIcon from "@mui/icons-material/DeleteOutlined";
import PhotoIcon from "@mui/icons-material/Photo";
import {
    Avatar,
    IconButton,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Tooltip,
} from "@mui/material";
import { NutritionalValues } from "@/components/Nutrition/helpers/nutritionalValues";
import { DiaryEntry } from "@/components/Nutrition/models/diaryEntry";
import { MealItem } from "@/components/Nutrition/models/mealItem";
import { useTranslation } from "react-i18next";
import { numberGramLocale, numberLocale } from "@/core/lib/numbers";

const IngredientTableRow = (props: {
    item: MealItem | DiaryEntry,
    onDelete?: (item: MealItem | DiaryEntry) => void,
}) => {
    const [t, i18n] = useTranslation();

    return <TableRow key={props.item.id}>
        <TableCell sx={{ paddingX: 1 }}>
            <Avatar
                alt={props.item.ingredient?.name}
                src={props.item.ingredient?.image?.url}
                sx={{ width: 45, height: 45 }}
            >
                <PhotoIcon />
            </Avatar>

        </TableCell>
        <TableCell sx={{ paddingX: 1 }}>
            {props.item.amountString} {props.item.ingredient?.name}
        </TableCell>
        <TableCell align={'right'} sx={{ paddingX: 1 }}>
            {t('nutrition.valueEnergyKcalKj', {
                kcal: numberLocale(props.item.nutritionalValues.energy, i18n.language),
                kj: numberLocale(props.item.nutritionalValues.energyKj, i18n.language)
            })}
        </TableCell>
        <TableCell align="right" sx={{ paddingX: 1 }}>
            {numberGramLocale(props.item.nutritionalValues.protein, i18n.language)}
        </TableCell>
        <TableCell align="right" sx={{ paddingX: 1 }}>
            {numberGramLocale(props.item.nutritionalValues.carbohydrates, i18n.language)}
        </TableCell>
        <TableCell align="right" sx={{ paddingX: 1 }}>
            {numberGramLocale(props.item.nutritionalValues.fat, i18n.language)}
        </TableCell>
        {props.onDelete && <TableCell align="right" sx={{ paddingX: 1 }}>
            <Tooltip title={t('delete')}>
                <IconButton
                    size="small"
                    aria-label={t('delete')}
                    onClick={() => props.onDelete!(props.item)}
                >
                    <DeleteOutlineIcon fontSize="small" />
                </IconButton>
            </Tooltip>
        </TableCell>}
    </TableRow>;
};

export const IngredientDetailTable = (props: {
    items: MealItem[] | DiaryEntry[],
    values: NutritionalValues,
    showSum: boolean,
    onDelete?: (item: MealItem | DiaryEntry) => void,
}) => {
    const [t, i18n] = useTranslation();

    return <TableContainer>
        <Table>
            <TableHead>
                <TableRow>
                    <TableCell />
                    <TableCell />
                    <TableCell align={'right'} sx={{ paddingX: 1 }}>{t('nutrition.energy')}</TableCell>
                    <TableCell align={'right'} sx={{ paddingX: 1 }}>{t('nutrition.protein')}</TableCell>
                    <TableCell align={'right'} sx={{ paddingX: 1 }}>{t('nutrition.carbohydrates')}</TableCell>
                    <TableCell align={'right'} sx={{ paddingX: 1 }}>{t('nutrition.fat')}</TableCell>
                    {props.onDelete && <TableCell />}
                </TableRow>
            </TableHead>
            <TableBody>
                {props.items.map((item) => (
                    <IngredientTableRow item={item} key={item.id} onDelete={props.onDelete} />
                ))}
                {props.showSum && <TableRow>
                    <TableCell sx={{ paddingX: 1 }}> </TableCell>
                    <TableCell sx={{ paddingX: 1 }}>
                        {t('total')}
                    </TableCell>
                    <TableCell align={'right'} sx={{ paddingX: 1 }}>
                        {t('nutrition.valueEnergyKcalKj', {
                            kcal: numberLocale(props.values.energy, i18n.language),
                            kj: numberLocale(props.values.energyKj, i18n.language)
                        })}
                    </TableCell>
                    <TableCell align={'right'} sx={{ paddingX: 1 }}>
                        {numberGramLocale(props.values.protein, i18n.language)}
                    </TableCell>
                    <TableCell align={'right'} sx={{ paddingX: 1 }}>
                        {numberGramLocale(props.values.carbohydrates, i18n.language)}
                    </TableCell>
                    <TableCell align={'right'} sx={{ paddingX: 1 }}>
                        {numberGramLocale(props.values.fat, i18n.language)}
                    </TableCell>
                    {props.onDelete && <TableCell />}
                </TableRow>}
            </TableBody>
        </Table>
    </TableContainer>;
};