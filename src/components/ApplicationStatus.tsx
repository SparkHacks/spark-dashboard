import "./ApplicationStatus.css";

type AppStatusType = "waiting" | "declined" | "waitlist" | "accepted" | "userAccepted" | "fullyAccepted" | "";

interface ApplicationStatusProps {
  message: AppStatusType;
}

export default function ApplicationStatus({ message }: ApplicationStatusProps) {
  let statusMessage = "";
  let one = false;
  let two = false;
  let three = false;

  switch (message) {
    case "waiting":
      statusMessage = "Submitted ✅";
      one = true;
      break;
    case "declined":
      statusMessage = "Declined ❌";
      break;
    case "waitlist":
      statusMessage = "Submitted ✅";
      one = true;
      break;
    case "accepted":
      statusMessage = "Invited 🎉";
      one = true;
      two = true;
      break;
    case "userAccepted":
      statusMessage = "Accepted 🎉";
      one = true;
      two = true;
      three = true;
      break;
    case "fullyAccepted":
      statusMessage = "Accepted 🎉";
      one = true;
      two = true;
      three = true;
      break;
  }

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
            className={`${one ? "waiting" : "emptyStatus"}`}
            style={{ strokeWidth: "3%" }}
          />
          <line
            x1="35%"
            y1="50%"
            x2="65%"
            y2="50%"
            className={`${two ? "accepted" : "emptyStatus"}`}
            style={{ strokeWidth: "3%" }}
          />
          <line
            x1="65%"
            y1="50%"
            x2="95%"
            y2="50%"
            className={`${three ? "fullyAccepted" : "emptyStatus"}`}
            style={{ strokeWidth: "3%" }}
          />

          <circle
            r="3%"
            cx="5%"
            cy="50%"
            className={`${one ? "waiting" : "emptyStatus"}`}
          />
          <circle
            r="3%"
            cx="35%"
            cy="50%"
            className={`${one ? "waiting" : "emptyStatus"}`}
          />
          <circle
            r="3%"
            cx="65%"
            cy="50%"
            className={`${two ? "accepted" : "emptyStatus"}`}
          />
          <circle
            r="3%"
            cx="95%"
            cy="50%"
            className={`${three ? "fullyAccepted" : "emptyStatus"}`}
          />
        </svg>

        <div className="text-container">
          <h3
            className={`${one ? "waiting" : "emptyStatus"}`}
            style={{ textAlign: "center" }}
          >
            Not Started
          </h3>
          <h3
            className={`${one ? "waiting" : "emptyStatus"}`}
            style={{ textAlign: "center" }}
          >
            Pending Review
          </h3>
          <h3
            className={`${two ? "accepted" : "emptyStatus"}`}
            style={{ textAlign: "center" }}
          >
            Receive Decision
          </h3>
          <h3
            className={`${three ? "fullyAccepted" : "emptyStatus"}`}
            style={{ textAlign: "center" }}
          >
            Accept Invitation
          </h3>
        </div>
      </div>
    </div>
  );
}
