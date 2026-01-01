import { toast } from "@/hooks/use-toast";
import chalk from "chalk";
import { SubmitHandler } from "react-hook-form";
import { FormValues } from "../types";

export const useBookingForm = (reset: (values?: FormValues) => void) => {
    const onSubmit: SubmitHandler<FormValues> = async (data) => {
        try {
            const formData = new FormData();
            Object.entries(data).forEach(([key, value]) => {
                if (Array.isArray(value)) {
                    value.forEach((item: string) => formData.append(key, item));
                } else if (value !== undefined) {
                    // Use String() to avoid type assertion
                    formData.append(key, String(value));
                }
            });

            const res = await fetch("/api/booking", {
                method: "POST",
                body: formData,
            });

            const resultRaw: unknown = await res.json();
            const isBookingResponse = (
                val: unknown,
            ): val is { success: boolean; message: string } =>
                typeof val === "object" && val !== null && "success" in val;

            if (!isBookingResponse(resultRaw)) {
                throw new Error("Invalid response from server");
            }

            if (resultRaw.success) {
                toast({ title: "Success", description: resultRaw.message });
                reset();
            } else {
                toast({
                    title: "Error",
                    description: resultRaw.message ?? "Error submitting booking request.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error(chalk.red("[BookingForm] Error:"), error);
            toast({
                title: "Error",
                description: "An unexpected error occurred.",
                variant: "destructive",
            });
        }
    };

    return { onSubmit };
};
