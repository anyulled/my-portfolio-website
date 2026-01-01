import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Control, Controller, FieldErrors, UseFormRegister } from "react-hook-form";
import { FormValues } from "../types";

interface Props {
    register: UseFormRegister<FormValues>;
    errors: FieldErrors<FormValues>;
    control: Control<FormValues>;
    t: (key: string) => string;
}

export const PhysicalCharacteristics = ({
    register,
    errors,
    control,
    t,
}: Props) => (
    <div className="space-y-4 pt-4">
        <h2 className="text-xl font-semibold border-b pb-2">
            {t("physical_characteristics")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <label htmlFor="height" className="text-sm font-medium">
                    {t("height")} (cm) *
                </label>
                <Input id="height" type="number" {...register("height")} />
                {errors.height && (
                    <p className="text-xs text-destructive">{errors.height.message}</p>
                )}
            </div>
            <div className="grid grid-cols-3 gap-2">
                <div className="space-y-2">
                    <label htmlFor="chest" className="text-sm font-medium">
                        {t("chest")}
                    </label>
                    <Input id="chest" type="number" {...register("chest")} />
                    {errors.chest && (
                        <p className="text-xs text-destructive">{errors.chest.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <label htmlFor="waist" className="text-sm font-medium">
                        {t("waist")}
                    </label>
                    <Input id="waist" type="number" {...register("waist")} />
                    {errors.waist && (
                        <p className="text-xs text-destructive">{errors.waist.message}</p>
                    )}
                </div>
                <div className="space-y-2">
                    <label htmlFor="hips" className="text-sm font-medium">
                        {t("hips")}
                    </label>
                    <Input id="hips" type="number" {...register("hips")} />
                    {errors.hips && (
                        <p className="text-xs text-destructive">{errors.hips.message}</p>
                    )}
                </div>
            </div>
        </div>
        <div className="space-y-2">
            <label htmlFor="tattoos" className="text-sm font-medium">
                {t("tattoos")}
            </label>
            <Input
                id="tattoos"
                placeholder={t("tattoos_placeholder")}
                {...register("tattoos")}
            />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">{t("hair_color")} *</label>
                <Controller
                    name="hairColor"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder={t("select_hair_color")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="blonde">{t("hair_blonde")}</SelectItem>
                                <SelectItem value="brown">{t("hair_brown")}</SelectItem>
                                <SelectItem value="black">{t("hair_black")}</SelectItem>
                                <SelectItem value="red">{t("hair_red")}</SelectItem>
                                <SelectItem value="other">{t("other")}</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">{t("eye_color")} *</label>
                <Controller
                    name="eyeColor"
                    control={control}
                    render={({ field }) => (
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <SelectTrigger>
                                <SelectValue placeholder={t("select_eye_color")} />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="blue">{t("eye_blue")}</SelectItem>
                                <SelectItem value="brown">{t("eye_brown")}</SelectItem>
                                <SelectItem value="green">{t("eye_green")}</SelectItem>
                                <SelectItem value="hazel">{t("eye_hazel")}</SelectItem>
                                <SelectItem value="other">{t("other")}</SelectItem>
                            </SelectContent>
                        </Select>
                    )}
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">{t("implants")} *</label>
                <Controller
                    name="implants"
                    control={control}
                    render={({ field }) => (
                        <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex items-center space-x-4 h-10"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="yes" id="implants-yes" />
                                <label htmlFor="implants-yes">{t("yes")}</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no" id="implants-no" />
                                <label htmlFor="implants-no">{t("no")}</label>
                            </div>
                        </RadioGroup>
                    )}
                />
            </div>
        </div>
    </div>
);
