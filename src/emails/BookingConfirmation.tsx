import React from "react";
import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Text
} from "@react-email/components";

interface BookingConfirmationProps {
  fullName: string;
  socialAccount: string;
  email: string;
  country: string;
  height: string;
  chest: string;
  waist: string;
  hips: string;
  tattoos: string;
  hairColor: string;
  eyeColor: string;
  implants: string;
  startDate: string;
  endDate: string;
  rates: string;
  modelRelease: string;
  paymentTypes: string[];
}

export const BookingConfirmation: React.FC<BookingConfirmationProps> = ({
                                                                          fullName,
                                                                          socialAccount,
                                                                          email,
                                                                          country,
                                                                          height,
                                                                          chest,
                                                                          waist,
                                                                          hips,
                                                                          tattoos = "None specified",
                                                                          hairColor,
                                                                          eyeColor,
                                                                          implants,
                                                                          startDate,
                                                                          endDate,
                                                                          rates,
                                                                          modelRelease,
                                                                          paymentTypes
                                                                        }) => {
  return (
    <Html>
      <Head />
      <Preview>New Booking Request from {fullName}</Preview>
      <Body style={bodyStyle}>
        <Container style={containerStyle}>
          <Heading style={headingStyle}>New Booking Request
            from {fullName}</Heading>

          <Section style={sectionStyle}>
            <Heading as="h2" style={subHeadingStyle}>Personal
              Information</Heading>
            <Text style={textStyle}>Full Name: {fullName}</Text>
            <Text
              style={textStyle}>Instagram/ModelMayhem: {socialAccount}</Text>
            <Text style={textStyle}>Email: {email}</Text>
            <Text style={textStyle}>Country of Origin: {country}</Text>
          </Section>

          <Hr style={hrStyle} />

          <Section style={sectionStyle}>
            <Heading as="h2" style={subHeadingStyle}>Physical
              Characteristics</Heading>
            <Text style={textStyle}>Height: {height} cm</Text>
            <Text style={textStyle}>Body Size: Chest {chest} cm,
              Waist {waist} cm, Hips {hips} cm</Text>
            <Text style={textStyle}>Tattoos: {tattoos}</Text>
            <Text style={textStyle}>Hair Color: {hairColor}</Text>
            <Text style={textStyle}>Eye Color: {eyeColor}</Text>
            <Text style={textStyle}>Implants: {implants}</Text>
          </Section>

          <Hr style={hrStyle} />

          <Section style={sectionStyle}>
            <Heading as="h2" style={subHeadingStyle}>Booking Details</Heading>
            <Text style={textStyle}>Available From: {startDate}</Text>
            <Text style={textStyle}>Available Until: {endDate}</Text>
            <Text style={textStyle}>Rates: {rates}</Text>
            <Text style={textStyle}>Willing to Sign Model
              Release: {modelRelease}</Text>
            <Text style={textStyle}>Preferred Payment
              Types: {paymentTypes.join(", ")}</Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
};

// Styles
const bodyStyle = {
  backgroundColor: "#f6f6f6",
  fontFamily: "Arial, sans-serif",
  margin: 0,
  padding: 0
};

const containerStyle = {
  backgroundColor: "#ffffff",
  margin: "0 auto",
  padding: "20px",
  maxWidth: "600px",
  borderRadius: "5px",
  boxShadow: "0 0 10px rgba(0, 0, 0, 0.1)"
};

const headingStyle = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "bold",
  marginBottom: "20px",
  textAlign: "center" as const
};

const subHeadingStyle = {
  color: "#555",
  fontSize: "18px",
  fontWeight: "bold",
  marginBottom: "10px"
};

const sectionStyle = {
  marginBottom: "20px"
};

const textStyle = {
  color: "#666",
  fontSize: "14px",
  lineHeight: "1.5",
  margin: "5px 0"
};

const hrStyle = {
  borderColor: "#eee",
  margin: "20px 0"
};

export default BookingConfirmation;