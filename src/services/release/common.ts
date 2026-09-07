export const PHOTOGRAPHER = {
  name: "Anyul Led Rivas Oropeza",
  documentNumber: "60043650B",
} as const;

export const getMadridDate = (date = new Date()): string => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "Europe/Madrid",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);

  const values = Object.fromEntries(
    parts
      .filter(({ type }) => type !== "literal")
      .map(({ type, value }) => [type, value]),
  );

  return `${values.year}-${values.month}-${values.day}`;
};

export const isValidDate = (value: string): boolean => {
  const [year, month, day] = value.split("-").map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
};

export const calculateAge = (
  birthDate: string,
  referenceDate: string,
): number => {
  const [birthYear, birthMonth, birthDay] = birthDate.split("-").map(Number);
  const [referenceYear, referenceMonth, referenceDay] = referenceDate
    .split("-")
    .map(Number);
  const birthdayPassed =
    referenceMonth > birthMonth ||
    (referenceMonth === birthMonth && referenceDay >= birthDay);

  return referenceYear - birthYear - (birthdayPassed ? 0 : 1);
};

export const isValidPhone = (value: string): boolean => {
  const digits = value.replace(/\D/g, "");
  return (
    digits.length >= 7 && digits.length <= 15 && /^\+?[0-9\s().-]+$/.test(value)
  );
};
