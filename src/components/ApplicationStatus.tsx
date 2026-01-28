import "./ApplicationStatus.css";

type AppStatusType = "waiting" | "declined" | "waitlist" | "invited" | "accepted" | "";

interface ApplicationStatusProps {
  message: AppStatusType;
}

// Pastel color palettes with dark to light gradients (darker for better readability)
const colors = {
  green: ["#4aba6f", "#6dca8a", "#8fd9a5"], // dark to light green
  red: ["#e85c5c", "#ed7a7a", "#f29898"],   // dark to light red
  blue: ["#5a9ae8", "#7ab0ed", "#9ac5f2"],  // dark to light blue
  gray: ["#666666", "#888888", "#aaaaaa"],  // dark to light gray
  empty: "#d9d9d9",
};

export default function ApplicationStatus({ message }: ApplicationStatusProps) {
  let statusMessage = "";

  // Determine which segments are filled and their colors
  let segment1Color = colors.empty;
  let segment2Color = colors.empty;
  let segment3Color = colors.empty;

  switch (message) {
    case "waiting":
      statusMessage = "Pending ⏳";
      segment1Color = colors.gray[0];
      break;
    case "declined":
      statusMessage = "Declined ❌";
      segment1Color = colors.red[0];
      segment2Color = colors.red[1];
      segment3Color = colors.red[2];
      break;
    case "waitlist":
      statusMessage = "Waitlisted ⏳";
      segment1Color = colors.blue[0];
      segment2Color = colors.blue[1];
      segment3Color = colors.blue[2];
      break;
    case "invited":
      statusMessage = "Invited 🎉";
      segment1Color = colors.green[0];
      segment2Color = colors.green[1];
      break;
    case "accepted":
      statusMessage = "Accepted 🎉";
      segment1Color = colors.green[0];
      segment2Color = colors.green[1];
      segment3Color = colors.green[2];
      break;
  }

  // Helper to get text color based on segment color
  const getTextColor = (segmentColor: string) => {
    return segmentColor === colors.empty ? "#000000" : segmentColor;
  };

  return (
    <div>
      <h2 style={{ color: "black", fontWeight: "bold", textWrap: "wrap" }}>
        Application Status: <span className={message}>{statusMessage}</span>
      </h2>
      <div className="svg-container">
        <svg
          viewBox="0 0 1000 100"
          height="75%"
          width="100%"
          xmlns="http://www.w3.org/2000/svg"
        >
          <line
            x1="5%"
            y1="50%"
            x2="35%"
            y2="50%"
            style={{ strokeWidth: "3%", stroke: segment1Color }}
          />
          <line
            x1="35%"
            y1="50%"
            x2="65%"
            y2="50%"
            style={{ strokeWidth: "3%", stroke: segment2Color }}
          />
          <line
            x1="65%"
            y1="50%"
            x2="95%"
            y2="50%"
            style={{ strokeWidth: "3%", stroke: segment3Color }}
          />

          <circle
            r="3%"
            cx="5%"
            cy="50%"
            style={{ fill: segment1Color, stroke: segment1Color }}
          />
          <circle
            r="3%"
            cx="35%"
            cy="50%"
            style={{ fill: segment1Color, stroke: segment1Color }}
          />
          <circle
            r="3%"
            cx="65%"
            cy="50%"
            style={{ fill: segment2Color, stroke: segment2Color }}
          />
          <circle
            r="3%"
            cx="95%"
            cy="50%"
            style={{ fill: segment3Color, stroke: segment3Color }}
          />
        </svg>

        <div className="text-container">
          <h3
            style={{ textAlign: "center", color: getTextColor(segment1Color), fontWeight: "bold" }}
          >
            Not Started
          </h3>
          <h3
            style={{ textAlign: "center", color: getTextColor(segment1Color), fontWeight: "bold" }}
          >
            Pending Review
          </h3>
          <h3
            style={{ textAlign: "center", color: getTextColor(segment2Color), fontWeight: "bold" }}
          >
            Invited
          </h3>
          <h3
            style={{ textAlign: "center", color: getTextColor(segment3Color), fontWeight: "bold" }}
          >
            Accepted
          </h3>
        </div>
      </div>
    </div>
  );
}
