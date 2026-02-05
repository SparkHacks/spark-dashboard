import { Clock, MapPin, AlertCircle } from "lucide-react";

interface Props {
    eventData: {
        title: string;
        time: string;
        description: string;
        tags: string[];
        utc_start: string;
        utc_end: string;
    };
}

export default function LiveSchedCard({ eventData }: Props) {
    const curr_time = new Date();
    const start_time = new Date(eventData.utc_start);
    const end_time = new Date(eventData.utc_end);
    const isCurr = start_time < curr_time && curr_time < end_time;

    if (!isCurr) return null;

    const isMandatory = eventData.tags.some(tag => tag.includes("Mandatory"));
    const locationTag = eventData.tags.find(tag => tag.includes("Location"));
    const location = locationTag?.replace("Location: ", "") || null;

    return (
        <div style={{
            boxShadow: "0 4px 12px rgba(0, 0, 0, 0.1)",
            display: "flex",
            flexDirection: "column",
            borderRadius: "12px",
            padding: "1.25rem",
            width: "18rem",
            minHeight: "14rem",
            backgroundColor: "#fff",
            border: isMandatory ? "2px solid #4aba6f" : "1px solid #e5e5e5",
            position: "relative",
            transition: "transform 0.2s ease, box-shadow 0.2s ease",
        }}>
            {isMandatory && (
                <div style={{
                    position: "absolute",
                    top: "-8px",
                    right: "12px",
                    backgroundColor: "#4aba6f",
                    color: "white",
                    padding: "4px 10px",
                    borderRadius: "12px",
                    fontSize: "0.75rem",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    gap: "4px",
                }}>
                    <AlertCircle size={12} />
                    Mandatory
                </div>
            )}

            <h3 style={{
                fontSize: "1.25rem",
                fontWeight: 700,
                margin: "0 0 0.5rem 0",
                color: "#1a1a1a",
            }}>
                {eventData.title}
            </h3>

            <div style={{
                display: "flex",
                alignItems: "center",
                gap: "6px",
                color: "#5a9ae8",
                fontSize: "0.95rem",
                fontWeight: 600,
                marginBottom: "0.75rem",
            }}>
                <Clock size={16} />
                {eventData.time}
            </div>

            <p style={{
                fontSize: "0.875rem",
                color: "#555",
                lineHeight: 1.5,
                margin: "0 0 1rem 0",
                flexGrow: 1,
            }}>
                {eventData.description}
            </p>

            {location && (
                <div style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    backgroundColor: "#f5f5f5",
                    padding: "8px 12px",
                    borderRadius: "8px",
                    fontSize: "0.85rem",
                    color: "#333",
                    fontWeight: 500,
                }}>
                    <MapPin size={14} style={{ color: "#e85c5c" }} />
                    {location}
                </div>
            )}
        </div>
    );
}
