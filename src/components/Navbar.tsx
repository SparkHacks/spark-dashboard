import "./Navbar.css";
import { useState } from "react";

interface NavbarProps {
  userName?: string;
  userEmail?: string;
  currentPath: string;
}

export default function Navbar({ userName, userEmail, currentPath }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/admin", label: "Applicants" },
    { href: "/admin/qr", label: "QR Code" },
    { href: "/admin/addadmin", label: "Add Admin" },
    { href: "/admin/adminapplication", label: "Application" },
  ];

  const isActive = (href: string) => {
    if (href === "/dashboard") {
      return currentPath === "/dashboard";
    }

    return currentPath === href || (href !== "/dashboard" && currentPath.startsWith(href));
  };

  return (
    <nav className="top-navbar">
      <div className="navbar-left">
        <a href="/dashboard" className="navbar-logo">SparkHacks</a>

        <button
        className="navbar-hamburger"
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </button>

      </div>

      
      <div className={`navbar-center ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <ul className="navbar-links">
          {navLinks.map((link) => (
            <li key={link.href}>
              <a
                href={link.href}
                className={isActive(link.href) ? "active" : ""}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>
      </div>

      <div className={`navbar-right ${isMobileMenuOpen ? "mobile-open" : ""}`}>
        <img
          src={"https://ui-avatars.com/api/?name=" + encodeURIComponent(userName || "User") + "&background=random"}
          alt="Profile"
          className="navbar-profile-pic"
        />
        <div className="navbar-user-info">
          <div className="navbar-user-name">{userName || "User"}</div>
          <div className="navbar-user-email">{userEmail || ""}</div>
        </div>
        <button id="signout-button" className="navbar-signout-btn" title="Sign out">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
        </button>
      </div>
    </nav>
  );
}
