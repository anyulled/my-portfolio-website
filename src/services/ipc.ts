const IPC_ENDPOINT =
  "https://servicios.ine.es/wstempus/js/ES/DATOS_TABLA/50913?nult=2&tip=A&tv=3:84&tv=762:304092&tv=70:9005";

type IpcResponse = Array<{
  Data?: Array<{
    Valor?: unknown;
  }>;
}>;

function assertIsIpcResponse(payload: unknown): asserts payload is IpcResponse {
  if (!Array.isArray(payload) || payload.length === 0) {
    throw new Error("IPC response payload is not a non-empty array");
  }
}

export const fetchLatestIpc = async (): Promise<number> => {
  const response = await fetch(IPC_ENDPOINT, {
    headers: { Accept: "application/json" },
    next: { revalidate: 3600 },
  });

  if (!response.ok) {
    throw new Error(
      `Failed to retrieve IPC data via fetch (status ${response.status})`,
    );
  }

  const payload: unknown = await response.json();
  assertIsIpcResponse(payload);

  const [firstEntry] = payload;
  const data = firstEntry?.Data;

  if (!Array.isArray(data) || data.length === 0) {
    throw new Error("IPC response does not include any data entries");
  }

  const [latestRecord] = data;
  const { Valor } = latestRecord ?? {};

  if (typeof Valor !== "number" || !Number.isFinite(Valor)) {
    throw new TypeError("IPC response does not include a numeric Valor value");
  }

  return Valor;
};
