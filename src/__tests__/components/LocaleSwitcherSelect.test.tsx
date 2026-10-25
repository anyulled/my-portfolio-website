import LocaleSwitcherSelect from "@/components/LocaleSwitcherSelect";
import { setUserLocale } from "@/services/locale";
import { fireEvent, render, screen } from "@testing-library/react";
import { usePathname } from "next/navigation";
import { useTransition } from "react";

jest.mock("@/services/locale", () => ({ setUserLocale: jest.fn() }));
jest.mock("next/navigation", () => ({ usePathname: jest.fn() }));
jest.mock("react", () => ({
  ...jest.requireActual("react"),
  useTransition: jest.fn(),
}));
jest.mock("@/components/ui/select", () => ({
  Select: ({
    onValueChange,
    children,
  }: {
    onValueChange: (value: string) => void;
    children: React.ReactNode;
  }) => (
    <div>
      <button onClick={() => onValueChange("es")}>Choose Spanish</button>
      <button onClick={() => onValueChange("invalid")}>Choose invalid</button>
      {children}
    </div>
  ),
  SelectTrigger: (props: React.ComponentProps<"button">) => (
    <button {...props} />
  ),
  SelectContent: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectItem: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));
jest.mock("@radix-ui/react-select", () => ({
  SelectArrow: () => null,
  SelectIcon: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectPortal: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
  SelectViewport: ({ children }: { children: React.ReactNode }) => (
    <div>{children}</div>
  ),
}));

const startTransition = jest.fn();

function renderSwitcher() {
  return render(
    <LocaleSwitcherSelect
      defaultValue="en"
      label="Language"
      items={[
        { value: "en", label: "English" },
        { value: "es", label: "Spanish" },
      ]}
    />,
  );
}

describe("LocaleSwitcherSelect", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.mocked(usePathname).mockReturnValue("/");
    jest.mocked(useTransition).mockReturnValue([false, startTransition]);
  });

  it("keeps the transition pending until locale persistence finishes", async () => {
    let finishPersistence: () => void = () => undefined;
    jest.mocked(setUserLocale).mockReturnValue(
      new Promise<void>((resolve) => {
        finishPersistence = resolve;
      }),
    );
    renderSwitcher();

    fireEvent.click(screen.getByRole("button", { name: "Choose Spanish" }));
    const action: () => Promise<void> = startTransition.mock.calls[0][0];
    const persistence = action();

    expect(persistence).toBeInstanceOf(Promise);
    expect(setUserLocale).toHaveBeenCalledWith("es");
    finishPersistence();
    await expect(persistence).resolves.toBeUndefined();
  });

  it("propagates persistence errors to React's transition", async () => {
    const failure = new Error("Locale persistence failed");
    jest.mocked(setUserLocale).mockRejectedValue(failure);
    renderSwitcher();

    fireEvent.click(screen.getByRole("button", { name: "Choose Spanish" }));
    const action: () => Promise<void> = startTransition.mock.calls[0][0];

    await expect(action()).rejects.toThrow(failure);
  });

  it("ignores unsupported locales", () => {
    renderSwitcher();

    fireEvent.click(screen.getByRole("button", { name: "Choose invalid" }));

    expect(startTransition).not.toHaveBeenCalled();
    expect(setUserLocale).not.toHaveBeenCalled();
  });

  it("styles the trigger while a transition is pending", () => {
    jest.mocked(usePathname).mockReturnValue("/portfolio");
    jest.mocked(useTransition).mockReturnValue([true, startTransition]);

    renderSwitcher();

    expect(screen.getByRole("button", { name: "Language" })).toHaveClass(
      "pointer-events-none",
      "opacity-60",
    );
    expect(screen.getByRole("button", { name: "Language" })).not.toHaveClass(
      "bg-transparent!",
    );
  });
});
