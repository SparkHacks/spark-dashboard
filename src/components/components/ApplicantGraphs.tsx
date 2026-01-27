import { Pie } from "react-chartjs-2";
import { useState } from "react";
import type { FormViewData } from "../../env";
import { STATUS_COLORS } from "../constants";

interface ApplicantGraphsProps {
  datas: FormViewData[];
}

const CHART_OPTIONS: { key: keyof FormViewData; label: string; isMulti: boolean }[] = [
  { key: "gender", label: "Gender", isMulti: false },
  { key: "year", label: "Year", isMulti: false },
  { key: "availability", label: "Availability", isMulti: false },
  { key: "crewneckSize", label: "Crewneck Size", isMulti: false },
  { key: "teamPlan", label: "Team Plan", isMulti: false },
  { key: "pastSparkHacks", label: "Past SparkHacks", isMulti: false },
  { key: "pastProjects", label: "Past Projects", isMulti: false },
  { key: "participationType", label: "Participation Type", isMulti: false },
  { key: "jobType", label: "Job Type", isMulti: false },
  { key: "skillGit", label: "Git Experience", isMulti: false },
  { key: "skillFigma", label: "Figma Experience", isMulti: false },
  { key: "skillReact", label: "React Experience", isMulti: false },
  { key: "skillPython", label: "Python Experience", isMulti: false },
  { key: "skillDatabase", label: "Database Experience", isMulti: false },
  { key: "skillCICD", label: "CI/CD Experience", isMulti: false },
  { key: "skillAPIs", label: "APIs Experience", isMulti: false },
  { key: "dietaryRestriction", label: "Dietary Restrictions", isMulti: true },
  { key: "preWorkshops", label: "Pre-Workshops Interest", isMulti: true },
  { key: "hearAbout", label: "How They Heard About Us", isMulti: true },
  { key: "projectInterest", label: "Project Interest", isMulti: true },
  { key: "mainGoals", label: "Main Goals", isMulti: true },
];

const CHART_COLORS = [
  "rgba(255, 99, 132, 0.6)",
  "rgba(54, 162, 235, 0.6)",
  "rgba(255, 206, 86, 0.6)",
  "rgba(75, 192, 192, 0.6)",
  "rgba(153, 102, 255, 0.6)",
  "rgba(255, 159, 64, 0.6)",
  "rgba(199, 199, 199, 0.6)",
  "rgba(83, 102, 255, 0.6)",
  "rgba(255, 99, 255, 0.6)",
  "rgba(99, 255, 132, 0.6)",
];

const CHART_BORDER_COLORS = [
  "rgba(255, 99, 132, 1)",
  "rgba(54, 162, 235, 1)",
  "rgba(255, 206, 86, 1)",
  "rgba(75, 192, 192, 1)",
  "rgba(153, 102, 255, 1)",
  "rgba(255, 159, 64, 1)",
  "rgba(199, 199, 199, 1)",
  "rgba(83, 102, 255, 1)",
  "rgba(255, 99, 255, 1)",
  "rgba(99, 255, 132, 1)",
];

export default function ApplicantGraphs({ datas }: ApplicantGraphsProps) {
  const [selectedChart, setSelectedChart] = useState<keyof FormViewData>("dietaryRestriction");

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

  const selectedOption = CHART_OPTIONS.find(opt => opt.key === selectedChart);
  const customCounts = datas.reduce(
    (acc, item) => {
      const value = item[selectedChart];
      if (selectedOption?.isMulti && Array.isArray(value)) {
        value.forEach(v => {
          const key = v || "Unknown";
          acc[key] = (acc[key] || 0) + 1;
        });
      } else {
        const key = (value as string) || "Unknown";
        acc[key] = (acc[key] || 0) + 1;
      }
      return acc;
    },
    {} as Record<string, number>
  );

  const customLabels = Object.keys(customCounts);
  const customData = {
    labels: customLabels,
    datasets: [
      {
        label: selectedOption?.label || "Distribution",
        data: Object.values(customCounts),
        backgroundColor: customLabels.map((_, i) => CHART_COLORS[i % CHART_COLORS.length]),
        borderColor: customLabels.map((_, i) => CHART_BORDER_COLORS[i % CHART_BORDER_COLORS.length]),
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

  const sortedCustomCounts = Object.entries(customCounts).sort((a, b) => b[1] - a[1]);
  const totalCustomCount = sortedCustomCounts.reduce((sum, [, count]) => sum + count, 0);

  return (
    <div style={{ marginTop: "20px" }}>
      {/* First row: 3 charts */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: "20px",
          marginBottom: "20px",
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

      {/* Second row: Custom chart on left, table on right */}
      <div
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.1)",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: "20px",
            alignItems: "start",
          }}
        >
          {/* LEFT: Custom Chart */}
          <div>
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: "10px",
                marginBottom: "20px",
              }}
            >
              <h3 style={{ margin: 0 }}>Custom Chart:</h3>
              <select
                value={selectedChart}
                onChange={(e) =>
                  setSelectedChart(e.target.value as keyof FormViewData)
                }
                style={{
                  padding: "8px 12px",
                  borderRadius: "6px",
                  border: "2px solid #ddd",
                  fontSize: "14px",
                  cursor: "pointer",
                  outline: "none",
                }}
              >
                {CHART_OPTIONS.map(option => (
                  <option key={option.key} value={option.key}>
                    {option.label}
                  </option>
                ))}
              </select>
            </div>

            <Pie data={customData} options={chartOptions} />
          </div>

          {/* RIGHT: Breakdown Table */}
          <div>
            <h3 style={{ textAlign: "center", marginBottom: "20px" }}>
              {selectedOption?.label} Breakdown
            </h3>

            <div style={{ maxHeight: "400px", overflowY: "auto" }}>
              <table style={{ width: "100%", borderCollapse: "collapse" }}>
                <thead>
                  <tr style={{ borderBottom: "2px solid #e9ecef" }}>
                    <th style={{ textAlign: "left", padding: "10px 8px" }}>Answer</th>
                    <th style={{ textAlign: "right", padding: "10px 8px" }}>Count</th>
                    <th style={{ textAlign: "right", padding: "10px 8px" }}>%</th>
                  </tr>
                </thead>
                <tbody>
                  {sortedCustomCounts.map(([label, count]) => {
                    // Use the original index from customLabels to match chart colors
                    const colorIndex = customLabels.indexOf(label);
                    return (
                      <tr key={label} style={{ borderBottom: "1px solid #e9ecef" }}>
                        <td style={{ padding: "10px 8px", display: "flex", gap: "8px" }}>
                          <span
                            style={{
                              width: "12px",
                              height: "12px",
                              backgroundColor:
                                CHART_COLORS[colorIndex % CHART_COLORS.length],
                              border: `1px solid ${
                                CHART_BORDER_COLORS[colorIndex % CHART_BORDER_COLORS.length]
                              }`,
                            }}
                          />
                          {label}
                        </td>
                        <td style={{ textAlign: "right", padding: "10px 8px" }}>
                          {count}
                        </td>
                        <td style={{ textAlign: "right", padding: "10px 8px" }}>
                          {((count / totalCustomCount) * 100).toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

    </div>
  );
}
