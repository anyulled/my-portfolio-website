import { Input } from "@/components/ui/input";
import { FieldErrors, UseFormRegister } from "react-hook-form";
import { FormValues } from "../types";

interface Props {
    register: UseFormRegister<FormValues>;
    errors: FieldErrors<FormValues>;
    t: (key: string) => string;
}

export const PersonalInformation = ({ register, errors, t }: Props) => (
    <div className="space-y-4">
        <h2 className="text-xl font-semibold border-b pb-2">
            {t("personal_info")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <label htmlFor="fullName" className="text-sm font-medium">
                    {t("full_name")} *
                </label>
                <Input
                    id="fullName"
                    placeholder={t("full_name_placeholder")}
                    {...register("fullName")}
                />
                {errors.fullName && (
                    <p className="text-xs text-destructive">{errors.fullName.message}</p>
                )}
            </div>
            <div className="space-y-2">
                <label htmlFor="socialAccount" className="text-sm font-medium">
                    {t("social_account")} *
                </label>
                <Input
                    id="socialAccount"
                    placeholder={t("social_account_placeholder")}
                    {...register("socialAccount")}
                />
                {errors.socialAccount && (
                    <p className="text-xs text-destructive">
                        {errors.socialAccount.message}
                    </p>
                )}
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">
                    {t("email")} *
                </label>
                <Input
                    id="email"
                    type="email"
                    placeholder={t("email_placeholder")}
                    {...register("email")}
                />
                {errors.email && (
                    <p className="text-xs text-destructive">{errors.email.message}</p>
                )}
            </div>
            <div className="space-y-2">
                <label htmlFor="country" className="text-sm font-medium">
                    {t("country")} *
                </label>
                <Input
                    id="country"
                    placeholder={t("country_placeholder")}
                    {...register("country")}
                />
                {errors.country && (
                    <p className="text-xs text-destructive">{errors.country.message}</p>
                )}
            </div>
        </div>
    </div>
);
