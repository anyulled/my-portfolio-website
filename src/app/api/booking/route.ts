import { NextResponse } from "next/server";
import chalk from "chalk";
import { sendEmailToRecipient } from "@/services/mailer";

export async function POST(req: Request) {
  try {
    const formData = await req.formData();

    const fullName = formData.get("fullName")?.toString();
    const socialAccount = formData.get("socialAccount")?.toString();
    const email = formData.get("email")?.toString();
    const country = formData.get("country")?.toString();
    const height = formData.get("height")?.toString();
    const chest = formData.get("chest")?.toString();
    const waist = formData.get("waist")?.toString();
    const hips = formData.get("hips")?.toString();
    const tattoos = formData.get("tattoos")?.toString() ?? "None specified";
    const hairColor = formData.get("hairColor")?.toString();
    const eyeColor = formData.get("eyeColor")?.toString();
    const implants = formData.get("implants")?.toString();
    const startDate = formData.get("startDate")?.toString();
    const endDate = formData.get("endDate")?.toString();
    const rates = formData.get("rates")?.toString();
    const modelRelease = formData.get("modelRelease")?.toString();
    const paymentTypes = formData
      .getAll("paymentTypes")
      .map((type) => type.toString());

    if (
      !fullName ||
      !socialAccount ||
      !email ||
      !country ||
      !height ||
      !chest ||
      !waist ||
      !hips ||
      !hairColor ||
      !eyeColor ||
      !implants ||
      !startDate ||
      !endDate ||
      !rates ||
      !modelRelease ||
      paymentTypes.length === 0
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "Please fill in all required fields.",
        },
        { status: 400 },
      );
    }

    const message = `
New Booking Request from ${fullName}

Personal Information:
- Full Name: ${fullName}
- Instagram/ModelMayhem: ${socialAccount}
- Email: ${email}
- Country of Origin: ${country}

Physical Characteristics:
- Height: ${height} cm
- Body Size: Chest ${chest} cm, Waist ${waist} cm, Hips ${hips} cm
- Tattoos: ${tattoos}
- Hair Color: ${hairColor}
- Eye Color: ${eyeColor}
- Implants: ${implants}

Booking Details:
- Available From: ${startDate}
- Available Until: ${endDate}
- Rates: ${rates}
- Willing to Sign Model Release: ${modelRelease}
- Preferred Payment Types: ${paymentTypes.join(", ")}
`;
    console.log(chalk.cyan("[Booking] ENV:"), process.env.NODE_ENV);
    if (process.env.NODE_ENV == "production") {
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
