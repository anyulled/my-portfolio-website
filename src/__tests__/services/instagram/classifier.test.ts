import { generateText } from "ai";
import { classifyInstagramMessage } from "@/services/instagram/classifier";

const mockedGenerateText = jest.mocked(generateText);

const classification = {
  route: "manual_review",
  detectedLanguage: "it",
  confidence: 0.91,
  isModel: true,
  mentionsBarcelona: true,
  mentionsPhotographyWork: true,
  isPotentialClient: false,
  reason: "The sender explicitly requests paid modeling work in Barcelona.",
};

describe("classifyInstagramMessage", () => {
  beforeEach(() => {
    mockedGenerateText.mockResolvedValue({ output: classification } as never);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("routes explicit paid model availability to the model form", async () => {
    const result = await classifyInstagramMessage(
      "Sono una modella e sarò a Barcellona per un servizio fotografico pagato.",
    );

    expect(result.route).toBe("model_form");
    expect(result.detectedLanguage).toBe("it");
  });

  it("routes clear client intent to pricing", async () => {
    mockedGenerateText.mockResolvedValue({
      output: {
        ...classification,
        isModel: false,
        mentionsBarcelona: false,
        mentionsPhotographyWork: false,
        isPotentialClient: true,
      },
    } as never);

    const result = await classifyInstagramMessage("I want to book a session.");

    expect(result.route).toBe("pricing");
  });

  it("keeps incomplete model intent in manual review", async () => {
    mockedGenerateText.mockResolvedValue({
      output: { ...classification, mentionsBarcelona: false },
    } as never);

    const result = await classifyInstagramMessage("Sono una modella.");

    expect(result.route).toBe("manual_review");
  });

  it("routes clear model collaboration in Barcelona without requiring a fee", async () => {
    mockedGenerateText.mockResolvedValue({
      output: {
        ...classification,
        mentionsPhotographyWork: true,
      },
    } as never);

    const result = await classifyInstagramMessage(
      "Ciao, sono una modella e sarò in Barcelona il mese prossimo, mi piacerebbe lavorare con te.",
    );

    expect(result.route).toBe("model_form");
  });

  it("recognizes professional collaboration language as a model opportunity", async () => {
    mockedGenerateText.mockResolvedValue({
      output: {
        ...classification,
        isModel: false,
        mentionsPhotographyWork: false,
        isPotentialClient: false,
      },
    } as never);

    const result = await classifyInstagramMessage(
      "Hello! I’ll be in Barcelona tomorrow and after tomorrow. Do you want to work and create with me? Thanks Lola",
    );

    expect(result).toMatchObject({
      route: "model_form",
      isModel: true,
      mentionsBarcelona: true,
    });
  });

  it("does not turn clear client intent into a model opportunity", async () => {
    mockedGenerateText.mockResolvedValue({
      output: {
        ...classification,
        isModel: false,
        mentionsBarcelona: true,
        mentionsPhotographyWork: true,
        isPotentialClient: true,
      },
    } as never);

    const result = await classifyInstagramMessage(
      "I will be in Barcelona tomorrow. Do you want to work and create a session for me?",
    );

    expect(result.route).toBe("pricing");
    expect(result.isModel).toBe(false);
  });

  it("keeps a Barcelona availability message without collaboration intent under review", async () => {
    mockedGenerateText.mockResolvedValue({
      output: {
        ...classification,
        isModel: true,
        mentionsPhotographyWork: false,
        isPotentialClient: false,
      },
    } as never);

    const result = await classifyInstagramMessage(
      "Hello, I will be in Barcelona tomorrow.",
    );

    expect(result.route).toBe("manual_review");
  });

  it("keeps a model without photography or collaboration intent in manual review", async () => {
    mockedGenerateText.mockResolvedValue({
      output: {
        ...classification,
        mentionsPhotographyWork: false,
      },
    } as never);

    const result = await classifyInstagramMessage(
      "Ciao, sono una modella e sarò a Barcelona il mese prossimo.",
    );

    expect(result.route).toBe("manual_review");
  });

  it("ignores unrelated messages", async () => {
    mockedGenerateText.mockResolvedValue({
      output: {
        ...classification,
        isModel: false,
        mentionsBarcelona: false,
        mentionsPhotographyWork: false,
        isPotentialClient: false,
      },
    } as never);

    const result = await classifyInstagramMessage("Love your latest post!");

    expect(result.route).toBe("ignore");
  });
});
