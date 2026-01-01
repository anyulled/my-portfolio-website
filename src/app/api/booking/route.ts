import { sendEmailToRecipient } from "@/services/mailer";
import chalk from "chalk";
import { NextResponse } from "next/server";

const REQUIRED_FIELDS = [
  "fullName",
  "socialAccount",
  "email",
  "country",
  "height",
  "chest",
  "waist",
  "hips",
  "hairColor",
  "eyeColor",
  "implants",
  "startDate",
  "endDate",
  "rates",
  "modelRelease",
] as const;

function validateFields(formData: FormData, paymentTypes: string[]) {
  for (const field of REQUIRED_FIELDS) {
    if (!formData.get(field)?.toString()) return false;
  }
  return paymentTypes.length > 0;
}

function formatMessage(formData: FormData, paymentTypes: string[]) {
  const get = (key: string) => formData.get(key)?.toString() ?? "";
  const fullName = get("fullName");

  return `
New Booking Request from ${fullName}

Personal Information:
- Full Name: ${fullName}
- Instagram/ModelMayhem: ${get("socialAccount")}
- Email: ${get("email")}
- Country of Origin: ${get("country")}

Physical Characteristics:
- Height: ${get("height")} cm
- Body Size: Chest ${get("chest")} cm, Waist ${get("waist")} cm, Hips ${get("hips")} cm
- Tattoos: ${formData.get("tattoos")?.toString() ?? "None specified"}
- Hair Color: ${get("hairColor")}
- Eye Color: ${get("eyeColor")}
- Implants: ${get("implants")}

Booking Details:
- Available From: ${get("startDate")}
- Available Until: ${get("endDate")}
- Rates: ${get("rates")}
- Willing to Sign Model Release: ${get("modelRelease")}
- Preferred Payment Types: ${paymentTypes.join(", ")}
`;
}

export async function POST(req: Request) {
  try {
    const formData = await req.formData();
    const paymentTypes = formData
      .getAll("paymentTypes")
      .map((type) => type.toString());

    if (!validateFields(formData, paymentTypes)) {
      return NextResponse.json(
        {
          success: false,
          message: "Please fill in all required fields.",
        },
        { status: 400 },
      );
    }

    const message = formatMessage(formData, paymentTypes);
    const fullName = formData.get("fullName")?.toString() ?? "Unknown";

    console.log(chalk.cyan("[Booking] ENV:"), process.env.NODE_ENV);
    if (process.env.NODE_ENV === "production") {
      await sendEmailToRecipient(
        message,
        "info@boudoir.barcelona",
        `Boudoir Barcelona - New Booking Request from ${fullName}`,
      );
    } else {
      console.log(chalk.yellow("[Booking] Development mode - email not sent:"));
      console.log(chalk.gray(message));
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
      },
      { status: 500 },
    );
  }
}
