export default function Sidebar() {

    return ( <>
    <div style={{ width: "220px", 
        minHeight: "70vh", 
        backgroundColor: "#F7F7F7", 
        color: "black",
        display: "flex",
        flexDirection: "column",
        padding: "20px",
        borderRadius: "10px"
      }}>
        <h3>Menu</h3>
        <a href="/dashboard">Dashboard</a>
        <a href="admin">Applicants</a>
        <a href="admin/qr">QR Code</a>
        <a>Inquiries</a>
    </div>
</>);

}

