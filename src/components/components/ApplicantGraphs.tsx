import { Pie } from "react-chartjs-2";
import type { FormViewData } from "../../env";
import { STATUS_COLORS } from "../AdminBoard";

interface ApplicantGraphsProps {
  datas: FormViewData[];
}

export default function ApplicantGraphs({ datas }: ApplicantGraphsProps) {
  // Gender distribution
  const genderCounts = datas.reduce(
    (acc, item) => {
      const gender = item.gender || "Unknown";
      acc[gender] = (acc[gender] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const genderData = {
    labels: Object.keys(genderCounts),
    datasets: [
      {
        label: "Gender Distribution",
        data: Object.values(genderCounts),
        backgroundColor: [
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
          "rgba(255, 206, 86, 0.6)",
          "rgba(75, 192, 192, 0.6)",
        ],
        borderColor: [
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
          "rgba(255, 206, 86, 1)",
          "rgba(75, 192, 192, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  // Year distribution
  const yearCounts = datas.reduce(
    (acc, item) => {
      const year = item.year || "Unknown";
      acc[year] = (acc[year] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const yearData = {
    labels: Object.keys(yearCounts),
    datasets: [
      {
        label: "Year Distribution",
        data: Object.values(yearCounts),
        backgroundColor: [
          "rgba(153, 102, 255, 0.6)",
          "rgba(255, 159, 64, 0.6)",
          "rgba(75, 192, 192, 0.6)",
          "rgba(255, 99, 132, 0.6)",
          "rgba(54, 162, 235, 0.6)",
        ],
        borderColor: [
          "rgba(153, 102, 255, 1)",
          "rgba(255, 159, 64, 1)",
          "rgba(75, 192, 192, 1)",
          "rgba(255, 99, 132, 1)",
          "rgba(54, 162, 235, 1)",
        ],
        borderWidth: 2,
      },
    ],
  };

  // Status distribution
  const statusCounts = datas.reduce(
    (acc, item) => {
      const status = item.appStatus || "Unknown";
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const statusOrder = ["fullyAccepted", "userAccepted", "accepted", "waitlist", "waiting", "declined"];
  const orderedStatuses = statusOrder.filter(status => statusCounts[status] > 0);

  const statusData = {
    labels: orderedStatuses.map(status => {
      const labels: Record<string, string> = {
        fullyAccepted: "Confirmed",
        userAccepted: "Invited",
        accepted: "Accepted",
        waitlist: "Waitlisted",
        waiting: "Pending",
        declined: "Declined"
      };
      return labels[status] || status;
    }),
    datasets: [
      {
        label: "Status Distribution",
        data: orderedStatuses.map(status => statusCounts[status]),
        backgroundColor: orderedStatuses.map(status => STATUS_COLORS[status]),
        borderColor: "#fff",
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
    },
  };

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "20px",
        marginTop: "20px",
      }}
    >
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h3 style={{ textAlign: "center", marginBottom: "20px" }}>Gender Distribution</h3>
        <Pie data={genderData} options={chartOptions} />
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h3 style={{ textAlign: "center", marginBottom: "20px" }}>Year Distribution</h3>
        <Pie data={yearData} options={chartOptions} />
      </div>

      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <h3 style={{ textAlign: "center", marginBottom: "20px" }}>Status Distribution</h3>
        <Pie data={statusData} options={chartOptions} />
      </div>
    </div>
  );
}
