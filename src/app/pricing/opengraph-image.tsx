import { ImageResponse } from "next/og";
/*eslint-disable @next/next/no-img-element */

export const runtime = "edge";

export default function PricingImage() {
  return new ImageResponse(
    (
      <div tw="flex flex-col md:flex-row w-full py-1 px-1 md:items-center justify-between p-1">
        <img
          width="33%"
          src="https://live.staticflickr.com/65535/53232949297_8eb88c70b6_c_d.jpg"
          alt={"nonsense"}
        />
        <img
          width="33%"
          alt={"nonsense"}
          src="https://live.staticflickr.com/65535/54154502487_981fb48243_c_d.jpg"
        />
        <img
          width="33%"
          alt={"nonsense"}
          src="https://live.staticflickr.com/65535/53307099860_93b77dd6dc_k_d.jpg"
        />
      </div>
    ),
  );
}
