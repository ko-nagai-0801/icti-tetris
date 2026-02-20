import { ImageResponse } from "next/og";

export const size = {
  width: 512,
  height: 512
};

export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f1dcc4 0%, #d7eadf 100%)",
          color: "#1f3f36",
          fontSize: 94,
          fontWeight: 700,
          letterSpacing: 2
        }}
      >
        ICTI
      </div>
    ),
    {
      ...size
    }
  );
}
