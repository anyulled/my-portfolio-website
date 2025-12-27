import { act, renderHook } from "@testing-library/react";
import { toast as toastFunction, useToast } from "@/hooks/use-toast";

describe("useToast", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should return an object with toast and dismiss functions", () => {
    const { result } = renderHook(() => useToast());

    expect(result.current).toHaveProperty("toast");
    expect(typeof result.current.toast).toBe("function");

    expect(result.current).toHaveProperty("dismiss");
    expect(typeof result.current.dismiss).toBe("function");

    expect(result.current).toHaveProperty("toasts");
    expect(Array.isArray(result.current.toasts)).toBe(true);
  });

  it("should add a toast when toast function is called", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({
        title: "Test Toast",
        description: "This is a test toast",
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe("Test Toast");
    expect(result.current.toasts[0].description).toBe("This is a test toast");
    expect(result.current.toasts[0].open).toBe(true);
  });

  it("should update a toast when update function is called", () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;

    act(() => {
      const response = result.current.toast({
        title: "Initial Toast",
        description: "Initial description",
      });
      toastId = response.id;
    });

    expect(result.current.toasts[0].title).toBe("Initial Toast");

    act(() => {
      result.current.toast({
        id: toastId,
        title: "Updated Toast",
        description: "Updated description",
      });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe("Updated Toast");
    expect(result.current.toasts[0].description).toBe("Updated description");
  });

  it("should dismiss a toast when dismiss function is called with an id", () => {
    const { result } = renderHook(() => useToast());

    let toastId: string;

    act(() => {
      const response = result.current.toast({
        title: "Test Toast",
      });
      toastId = response.id;
    });

    expect(result.current.toasts[0].open).toBe(true);

    act(() => {
      result.current.dismiss(toastId);
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  it("should dismiss all toasts when dismiss function is called without an id", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: "Toast 1" });
      result.current.toast({ title: "Toast 2" });
    });

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].open).toBe(true);

    act(() => {
      result.current.dismiss();
    });

    expect(result.current.toasts[0].open).toBe(false);
  });

  it("should close a toast when onOpenChange is called with false", () => {
    const { result } = renderHook(() => useToast());

    act(() => {
      result.current.toast({ title: "Test Toast" });
    });

    expect(result.current.toasts[0].open).toBe(true);

    act(() => {
      result.current.toasts[0].onOpenChange?.(false);
    });

    expect(result.current.toasts[0].open).toBe(false);
  });
});

describe("toast function", () => {
  beforeEach(() => {
    jest.resetModules();
  });

  it("should return an object with id, dismiss, and update functions", () => {
    const result = toastFunction({ title: "Test Toast" });

    expect(result).toHaveProperty("id");
    expect(typeof result.id).toBe("string");

    expect(result).toHaveProperty("dismiss");
    expect(typeof result.dismiss).toBe("function");

    expect(result).toHaveProperty("update");
    expect(typeof result.update).toBe("function");
  });

  it("should add a toast to the state", () => {
    toastFunction({ title: "Test Toast" });

    const { result } = renderHook(() => useToast());

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe("Test Toast");
  });

  it("should update a toast when update function is called", () => {
    const toastResult = toastFunction({ title: "Initial Toast" });

    act(() => {
      toastResult.update({ id: "some-id", title: "Updated Toast" });
    });

    const { result } = renderHook(() => useToast());

    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].title).toBe("Updated Toast");
  });

  it("should dismiss a toast when dismiss function is called", () => {
    const toastResult = toastFunction({ title: "Test Toast" });

    act(() => {
      toastResult.dismiss();
    });

    const { result } = renderHook(() => useToast());

    expect(result.current.toasts[0].open).toBe(false);
  });
});
