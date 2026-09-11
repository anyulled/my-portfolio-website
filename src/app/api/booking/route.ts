import { sendEmailToRecipient } from "@/services/mailer";
import {
  bookingFormSchema,
  type FormValues,
} from "@/app/booking-a-session/types";
import {
  persistBookingSubmission,
  updateBookingEmailState,
} from "@/services/booking/repository";
import chalk from "chalk";
import { NextResponse } from "next/server";

function formatMessage(values: FormValues) {
  const fullName = values.fullName;

  return `
New Booking Request from ${fullName}

Personal Information:
- Full Name: ${fullName}
- Instagram/ModelMayhem: ${values.socialAccount}
- Email: ${values.email}
- Country of Origin: ${values.country}

Physical Characteristics:
- Height: ${values.height} cm
- Body Size: Chest ${values.chest} cm, Waist ${values.waist} cm, Hips ${values.hips} cm
- Tattoos: ${values.tattoos || "None specified"}
- Hair Color: ${values.hairColor}
- Eye Color: ${values.eyeColor}
- Implants: ${values.implants}

Booking Details:
- Available From: ${values.startDate}
- Available Until: ${values.endDate}
- Rates: ${values.rates}
- Willing to Sign Model Release: ${values.modelRelease}
- Preferred Payment Types: ${values.paymentTypes.join(", ")}
`;
}

const getFormValue = (formData: FormData, name: string) =>
  formData.get(name)?.toString() ?? "";

const getBookingValues = (formData: FormData) => ({
  fullName: getFormValue(formData, "fullName"),
  socialAccount: getFormValue(formData, "socialAccount"),
  email: getFormValue(formData, "email"),
  country: getFormValue(formData, "country"),
  height: getFormValue(formData, "height"),
  chest: getFormValue(formData, "chest"),
  waist: getFormValue(formData, "waist"),
  hips: getFormValue(formData, "hips"),
  tattoos: getFormValue(formData, "tattoos"),
  hairColor: getFormValue(formData, "hairColor"),
  eyeColor: getFormValue(formData, "eyeColor"),
  implants: getFormValue(formData, "implants"),
  startDate: getFormValue(formData, "startDate"),
  endDate: getFormValue(formData, "endDate"),
  rates: getFormValue(formData, "rates"),
  modelRelease: getFormValue(formData, "modelRelease"),
  paymentTypes: formData
    .getAll("paymentTypes")
    .map((paymentType) => paymentType.toString()),
});

const sendBookingEmail = async (values: FormValues, submissionId: string) => {
  if (process.env.NODE_ENV !== "production") {
    console.log(chalk.yellow("[Booking] Development mode - email not sent:"));
    console.log(chalk.gray(formatMessage(values)));
    return false;
  }

  const emailSent = await sendEmailToRecipient(
    formatMessage(values),
    "info@boudoir.barcelona",
    `Boudoir Barcelona - New Booking Request from ${values.fullName}`,
  );

  if (!emailSent) {
    await updateBookingEmailState(
      submissionId,
      "failed",
      "Email delivery failed",
    );
    return true;
  }

  await updateBookingEmailState(submissionId, "sent");
  return false;
};

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const result = bookingFormSchema.safeParse(getBookingValues(formData));

    if (!result.success) {
      return NextResponse.json(
        {
          success: false,
          message: "Please fill in all required fields.",
        },
        { status: 400 },
      );
    }

    const values = result.data;
    const leadCorrelationToken = formData.get("lead")?.toString() || null;
    const submissionId = await persistBookingSubmission(
      values,
      leadCorrelationToken,
    );
    const emailPending = await sendBookingEmail(values, submissionId);
    if (emailPending) {
      return NextResponse.json({
        success: true,
        message:
          "Your request was saved. We will send the notification as soon as delivery is available.",
        emailPending: true,
      });
    }

    return NextResponse.json({
      success: true,
      message:
        "Thank you for your booking request. We will review your information and get back to you soon!",
    });
  } catch (error) {
    console.error(chalk.red("[Booking] Booking form error:"), error);
    return NextResponse.json(
      {
        success: false,
        message: "An unexpected error occurred. Please try again later.",
        retryable: true,
      },
      { status: 503 },
    );
  }
}
