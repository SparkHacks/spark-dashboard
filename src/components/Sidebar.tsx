import "./Sidebar.css";

export default function Sidebar() {
  return (
      <div id="sidebar">
        <h2 className="sidebar-menu">Menu</h2>
        <ul className="sidebar-menu-list">
          <li>
            <a href="/dashboard" className="">Dashboard</a>
          </li>
          <li>
            <a href="/admin" className="">Applicants</a>
          </li>
          <li>
            <a href="/admin/qr" className="">QR Scanner</a>
          </li>
          <li>
            <a href="/admin/addadmin" className="">Add Admin</a>
          </li>
          {/* <li>
            <a className="">Inquiries</a>
          </li> */}
          <li>
            <a href="/admin/adminapplication">Application</a>
          </li>
          <li>
            <a href="/admin/adminapplication">User View</a>
          </li>
        </ul>
      </div>
  );
}

