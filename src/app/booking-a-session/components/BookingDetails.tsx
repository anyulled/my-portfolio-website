import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Control, Controller, FieldErrors, UseFormRegister } from "react-hook-form";
import { handleCheckboxChange } from "../formHandlers";
import { FormValues } from "../types";

interface Props {
    register: UseFormRegister<FormValues>;
    errors: FieldErrors<FormValues>;
    control: Control<FormValues>;
    t: (key: string) => string;
}

export const BookingDetails = ({ register, errors, control, t }: Props) => (
    <div className="space-y-4 pt-4">
        <h2 className="text-xl font-semibold border-b pb-2">
            {t("booking_details")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <label htmlFor="startDate" className="text-sm font-medium">
                    {t("start_date")} *
                </label>
                <Input id="startDate" type="date" {...register("startDate")} />
                {errors.startDate && (
                    <p className="text-xs text-destructive">{errors.startDate.message}</p>
                )}
            </div>
            <div className="space-y-2">
                <label htmlFor="endDate" className="text-sm font-medium">
                    {t("end_date")} *
                </label>
                <Input id="endDate" type="date" {...register("endDate")} />
                {errors.endDate && (
                    <p className="text-xs text-destructive">{errors.endDate.message}</p>
                )}
            </div>
        </div>
        <div className="space-y-2">
            <label htmlFor="rates" className="text-sm font-medium">
                {t("rates_expectation")} *
            </label>
            <Input
                id="rates"
                placeholder={t("rates_placeholder")}
                {...register("rates")}
            />
            {errors.rates && (
                <p className="text-xs text-destructive">{errors.rates.message}</p>
            )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <label className="text-sm font-medium">{t("model_release_q")} *</label>
                <Controller
                    name="modelRelease"
                    control={control}
                    render={({ field }) => (
                        <RadioGroup
                            onValueChange={field.onChange}
                            defaultValue={field.value}
                            className="flex items-center space-x-4 h-10"
                        >
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="yes" id="release-yes" />
                                <label htmlFor="release-yes">{t("yes")}</label>
                            </div>
                            <div className="flex items-center space-x-2">
                                <RadioGroupItem value="no" id="release-no" />
                                <label htmlFor="release-no">{t("no")}</label>
                            </div>
                        </RadioGroup>
                    )}
                />
            </div>
            <div className="space-y-2">
                <label className="text-sm font-medium">
                    {t("payment_types_q")} *
                </label>
                <Controller
                    name="paymentTypes"
                    control={control}
                    render={({ field }) => (
                        <div className="flex flex-wrap gap-4 pt-1">
                            {["cash", "paypal", "revolut"].map((type) => (
                                <div key={type} className="flex items-center space-x-2">
                                    <Checkbox
                                        id={`payment-${type}`}
                                        checked={field.value.includes(type as FormValues["paymentTypes"][number])}
                                        onCheckedChange={(checked) =>
                                            handleCheckboxChange(field, type, checked)
                                        }
                                    />
                                    <label
                                        htmlFor={`payment-${type}`}
                                        className="text-sm capitalize"
                                    >
                                        {t(type)}
                                    </label>
                                </div>
                            ))}
                        </div>
                    )}
                />
                {errors.paymentTypes && (
                    <p className="text-xs text-destructive">
                        {errors.paymentTypes.message}
                    </p>
                )}
            </div>
        </div>
    </div>
);
