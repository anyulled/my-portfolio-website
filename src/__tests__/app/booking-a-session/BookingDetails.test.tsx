import { BookingDetails } from "@/app/booking-a-session/components/BookingDetails";
import { PhysicalCharacteristics } from "@/app/booking-a-session/components/PhysicalCharacteristics";
import { FormValues, initialValues } from "@/app/booking-a-session/types";
import { fireEvent, render, screen } from "@testing-library/react";
import { useForm } from "react-hook-form";

const t = (key: string) =>
  key === "error_date_range" ? "End date must be after start date" : key;

const BookingDetailsForm = () => {
  const {
    control,
    register,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: initialValues });

  return (
    <>
      <button
        type="button"
        onClick={() => reset({ ...initialValues, modelRelease: "no" })}
      >
        Reset model release
      </button>
      <BookingDetails
        control={control}
        errors={errors}
        register={register}
        t={t}
      />
    </>
  );
};

const PhysicalCharacteristicsForm = () => {
  const {
    control,
    register,
    reset,
    formState: { errors },
  } = useForm<FormValues>({ defaultValues: initialValues });

  return (
    <>
      <button
        type="button"
        onClick={() => reset({ ...initialValues, implants: "yes" })}
      >
        Reset implants
      </button>
      <PhysicalCharacteristics
        control={control}
        errors={errors}
        register={register}
        t={t}
      />
    </>
  );
};

const BookingDetailsWithEndDateError = ({ message }: { message?: string }) => {
  const { control, register } = useForm<FormValues>({
    defaultValues: initialValues,
  });

  return (
    <BookingDetails
      control={control}
      errors={{ endDate: { message, type: "custom" } }}
      register={register}
      t={t}
    />
  );
};

describe("Booking form controls", () => {
  it("renders the translated date range validation message", () => {
    render(<BookingDetailsWithEndDateError message="error_date_range" />);

    expect(
      screen.getByText("End date must be after start date"),
    ).toBeInTheDocument();
    expect(screen.queryByText("error_date_range")).not.toBeInTheDocument();
  });

  it("uses the end-date error translation when a validation message is absent", () => {
    render(<BookingDetailsWithEndDateError />);

    expect(screen.getByText("error_endDate")).toBeInTheDocument();
  });

  it("keeps the model release radio group synchronized after a form reset", () => {
    render(<BookingDetailsForm />);

    fireEvent.click(
      screen.getByRole("button", { name: "Reset model release" }),
    );

    expect(screen.getByRole("radio", { name: "no" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "yes" })).not.toBeChecked();
  });

  it("keeps the implants radio group synchronized after a form reset", () => {
    render(<PhysicalCharacteristicsForm />);

    fireEvent.click(screen.getByRole("button", { name: "Reset implants" }));

    expect(screen.getByRole("radio", { name: "yes" })).toBeChecked();
    expect(screen.getByRole("radio", { name: "no" })).not.toBeChecked();
  });
});
