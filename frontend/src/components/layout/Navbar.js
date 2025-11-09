import React, { useState, useEffect } from "react";
import {
  Menu as MenuIcon,
  AccountCircle,
  Dashboard,
  HowToVote,
  EmojiEvents,
  Person,
  ExitToApp,
  AdminPanelSettings,
  Home,
  Close as CloseIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
} from "@mui/icons-material";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { useTheme } from "../../contexts/ThemeContext";
import { motion, AnimatePresence } from "framer-motion";
import "./Navbar.css";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const [showUserMenu, setShowUserMenu] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/");
    setShowUserMenu(false);
  };

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
  };

  const navigationItems = [
    { path: "/", label: "Home", icon: Home, public: true },
    { path: "/results", label: "Results", icon: EmojiEvents, public: true },
  ];

  const userItems = user
    ? [
        {
          path: user.role === "admin" ? "/admin" : "/dashboard",
          label: user.role === "admin" ? "Admin Panel" : "Dashboard",
          icon: user.role === "admin" ? AdminPanelSettings : Dashboard,
        },
        { path: "/profile", label: "Profile", icon: Person },
      ]
    : [];

  const isActivePath = (path) => {
    if (path === "/" && location.pathname === "/") return true;
    if (path !== "/" && location.pathname.startsWith(path)) return true;
    return false;
  };

  return (
    <>
      <motion.nav
        className={`navbar-modern ${scrolled ? "navbar-scrolled" : ""}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.3 }}
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 1000,
          background: scrolled
            ? (theme === "dark" ? "rgba(17,24,39,0.9)" : "rgba(255, 255, 255, 0.95)")
            : "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          backdropFilter: scrolled ? "blur(10px)" : "none",
          borderBottom: scrolled
            ? (theme === "dark" ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)")
            : "none",
          boxShadow: scrolled
            ? "0 4px 20px rgba(0,0,0,0.1)"
            : "0 2px 10px rgba(0,0,0,0.1)",
          transition: "all 0.3s ease",
          padding: "0 24px",
          height: "64px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        {/* Mobile Menu Button */}
        <div className="mobile-menu-btn" style={{ display: "none" }}>
          <button
            onClick={toggleMobileMenu}
            style={{
              background: "none",
              border: "none",
              color: scrolled ? (theme === "dark" ? "#f8fafc" : "#333") : "white",
              fontSize: "24px",
              cursor: "pointer",
              padding: "8px",
            }}
          >
            <MenuIcon />
          </button>
        </div>

        {/* Logo */}
        <Link
          to="/"
          className={`logo ${scrolled ? "logo-dark" : "logo-gradient"}`}
          style={{
            textDecoration: "none",
            fontSize: "1.5rem",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            transition: "color 0.3s ease",
          }}
        >
          🏆 Sandwich Award
        </Link>

        {/* Desktop Navigation */}
        <div
          className="desktop-nav"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
          }}
        >
          {navigationItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 16px",
                  textDecoration: "none",
                  color: scrolled ? (theme === "dark" ? "#f8fafc" : "#333") : "white",
                  backgroundColor: isActivePath(item.path)
                    ? scrolled
                      ? (theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(102, 126, 234, 0.1)")
                      : "rgba(255, 255, 255, 0.2)"
                    : "transparent",
                  borderRadius: "8px",
                  transition: "all 0.3s ease",
                  fontSize: "0.95rem",
                  fontWeight: "500",
                }}
                onMouseEnter={(e) => {
                  if (!isActivePath(item.path)) {
                    e.target.style.backgroundColor = scrolled
                      ? (theme === "dark" ? "rgba(255,255,255,0.06)" : "rgba(102, 126, 234, 0.05)")
                      : "rgba(255, 255, 255, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isActivePath(item.path)) {
                    e.target.style.backgroundColor = "transparent";
                  }
                }}
              >
                <IconComponent style={{ fontSize: "18px" }} />
                {item.label}
              </Link>
            );
          })}


          {/* Primary CTA */}
          <Link
            to="/vote"
            className={`cta-button ${scrolled ? "cta-outline" : ""}`}
            style={{ marginLeft: "8px", textDecoration: "none" }}
          >
            <HowToVote style={{ fontSize: "18px" }} />
            Vote Now
          </Link>
          {/* Theme Toggle */}
          <button
            onClick={toggleTheme}
            aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            title={theme === "dark" ? "Light mode" : "Dark mode"}
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              padding: "8px 12px",
              background: "none",
              border: scrolled ? "1px solid rgba(102,126,234,0.4)" : "none",
              borderRadius: "8px",
              color: scrolled ? (theme === "dark" ? "#f8fafc" : "#333") : "white",
              cursor: "pointer",
              transition: "all 0.2s ease",
            }}
          >
            {theme === "dark" ? (
              <LightModeIcon style={{ fontSize: "18px" }} />
            ) : (
              <DarkModeIcon style={{ fontSize: "18px" }} />
            )}
            <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>
              {theme === "dark" ? "Light" : "Dark"}
            </span>
          </button>

          {/* User Menu */}
          {user && (
            <div style={{ position: "relative", marginLeft: "16px" }}>
              <button
                onClick={() => setShowUserMenu(!showUserMenu)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  padding: "8px 12px",
                  background: "none",
                  border: "none",
                  color: scrolled ? (theme === "dark" ? "#f8fafc" : "#333") : "white",
                  borderRadius: "8px",
                  cursor: "pointer",
                  transition: "all 0.3s ease",
                  backgroundColor: showUserMenu
                    ? scrolled
                      ? (theme === "dark" ? "rgba(255,255,255,0.08)" : "rgba(102, 126, 234, 0.1)")
                      : "rgba(255, 255, 255, 0.2)"
                    : "transparent",
                }}
              >
                <div
                  style={{
                    width: "32px",
                    height: "32px",
                    borderRadius: "50%",
                    background:
                      "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    color: "white",
                    fontSize: "18px",
                  }}
                >
                  <AccountCircle />
                </div>
                <span style={{ fontSize: "0.9rem", fontWeight: "500" }}>
                  {user.firstName} {user.lastName}
                </span>
              </button>

              <AnimatePresence>
                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      position: "absolute",
                      top: "100%",
                      right: 0,
                      marginTop: "8px",
                      background: "white",
                      borderRadius: "12px",
                      boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
                      border: "1px solid rgba(0,0,0,0.1)",
                      minWidth: "220px",
                      overflow: "hidden",
                      zIndex: 1001,
                    }}
                  >
                    <div
                      style={{
                        padding: "16px",
                        borderBottom: "1px solid rgba(0,0,0,0.1)",
                        background:
                          "linear-gradient(135deg, #f8f9ff 0%, #f0f2ff 100%)",
                      }}
                    >
                      <div
                        style={{
                          fontWeight: "600",
                          color: "#333",
                          marginBottom: "4px",
                        }}
                      >
                        {user.firstName} {user.lastName}
                      </div>
                      <div style={{ fontSize: "0.85rem", color: "#666" }}>
                        {user.email}
                      </div>
                    </div>

                    <div style={{ padding: "8px 0" }}>
                      {userItems.map((item) => {
                        const IconComponent = item.icon;
                        return (
                          <Link
                            key={item.path}
                            to={item.path}
                            onClick={() => setShowUserMenu(false)}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "12px",
                              padding: "12px 16px",
                              textDecoration: "none",
                              color: "#333",
                              transition: "background-color 0.2s ease",
                              fontSize: "0.9rem",
                            }}
                            onMouseEnter={(e) => {
                              e.target.style.backgroundColor = "#f8f9ff";
                            }}
                            onMouseLeave={(e) => {
                              e.target.style.backgroundColor = "transparent";
                            }}
                          >
                            <IconComponent
                              style={{ fontSize: "18px", color: "#667eea" }}
                            />
                            {item.label}
                          </Link>
                        );
                      })}

                      <div
                        onClick={handleLogout}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: "12px",
                          padding: "12px 16px",
                          cursor: "pointer",
                          transition: "background-color 0.2s ease",
                          fontSize: "0.9rem",
                          color: "#dc3545",
                          borderTop: "1px solid rgba(0,0,0,0.1)",
                          marginTop: "4px",
                        }}
                        onMouseEnter={(e) => {
                          e.target.style.backgroundColor = "#fff5f5";
                        }}
                        onMouseLeave={(e) => {
                          e.target.style.backgroundColor = "transparent";
                        }}
                      >
                        <ExitToApp style={{ fontSize: "18px" }} />
                        Logout
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          )}
        </div>
      </motion.nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.5)",
              zIndex: 999,
              backdropFilter: "blur(4px)",
            }}
            onClick={closeMobileMenu}
          >
            <motion.div
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              style={{
                position: "absolute",
                top: 0,
                left: 0,
                bottom: 0,
                width: "280px",
                background: "white",
                boxShadow: "4px 0 20px rgba(0,0,0,0.15)",
              }}
              onClick={(e) => e.stopPropagation()}
            >
              <div
                style={{
                  padding: "20px",
                  borderBottom: "1px solid rgba(0,0,0,0.1)",
                  background:
                    "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
                  color: "white",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "16px",
                  }}
                >
                  <div style={{ fontSize: "1.25rem", fontWeight: "bold" }}>
                    🥪 Sandwich Award
                  </div>
                  <button
                    onClick={closeMobileMenu}
                    style={{
                      background: "none",
                      border: "none",
                      color: "white",
                      fontSize: "24px",
                      cursor: "pointer",
                      padding: "4px",
                    }}
                  >
                    <CloseIcon />
                  </button>
                </div>
                {/* Mobile Theme Toggle */}
                <div style={{ marginTop: "8px" }}>
                  <button
                    onClick={toggleTheme}
                    aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
                    className="mobile-cta"
                    style={{
                      display: "inline-flex",
                      alignItems: "center",
                      gap: "8px",
                    }}
                  >
                    {theme === "dark" ? (
                      <LightModeIcon style={{ fontSize: "20px" }} />
                    ) : (
                      <DarkModeIcon style={{ fontSize: "20px" }} />
                    )}
                    {theme === "dark" ? "Switch to Light Mode" : "Switch to Dark Mode"}
                  </button>
                </div>
                {user && (
                  <div
                    style={{
                      padding: "12px",
                      background: "rgba(255,255,255,0.1)",
                      borderRadius: "8px",
                    }}
                  >
                    <div style={{ fontWeight: "600", marginBottom: "4px" }}>
                      {user.firstName} {user.lastName}
                    </div>
                    <div style={{ fontSize: "0.85rem", opacity: 0.9 }}>
                      {user.email}
                    </div>
                  </div>
                )}
              </div>

              <div style={{ padding: "20px 0" }}>
                {navigationItems.map((item) => {
                  const IconComponent = item.icon;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={closeMobileMenu}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "16px 20px",
                        textDecoration: "none",
                        color: "#333",
                        backgroundColor: isActivePath(item.path)
                          ? "#f8f9ff"
                          : "transparent",
                        borderLeft: isActivePath(item.path)
                          ? "4px solid #667eea"
                          : "4px solid transparent",
                        transition: "all 0.2s ease",
                        fontSize: "1rem",
                        fontWeight: isActivePath(item.path) ? "600" : "400",
                      }}
                    >
                      <IconComponent
                        style={{
                          fontSize: "22px",
                          color: isActivePath(item.path) ? "#667eea" : "#666",
                        }}
                      />
                      {item.label}
                    </Link>
                  );
                })}

                {user && (
                  <>
                    <div
                      style={{
                        height: "1px",
                        background: "rgba(0,0,0,0.1)",
                        margin: "16px 20px",
                      }}
                    />

                    {userItems.map((item) => {
                      const IconComponent = item.icon;
                      return (
                        <Link
                          key={item.path}
                          to={item.path}
                          onClick={closeMobileMenu}
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: "16px",
                            padding: "16px 20px",
                            textDecoration: "none",
                            color: "#333",
                            backgroundColor: isActivePath(item.path)
                              ? "#f8f9ff"
                              : "transparent",
                            borderLeft: isActivePath(item.path)
                              ? "4px solid #667eea"
                              : "4px solid transparent",
                            transition: "all 0.2s ease",
                            fontSize: "1rem",
                            fontWeight: isActivePath(item.path) ? "600" : "400",
                          }}
                        >
                          <IconComponent
                            style={{
                              fontSize: "22px",
                              color: isActivePath(item.path)
                                ? "#667eea"
                                : "#666",
                            }}
                          />
                          {item.label}
                        </Link>
                      );
                    })}

                    <div
                      onClick={handleLogout}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        gap: "16px",
                        padding: "16px 20px",
                        cursor: "pointer",
                        color: "#dc3545",
                        transition: "background-color 0.2s ease",
                        fontSize: "1rem",
                        borderTop: "1px solid rgba(0,0,0,0.1)",
                        marginTop: "16px",
                      }}
                    >
                      <ExitToApp style={{ fontSize: "22px" }} />
                      Logout
                    </div>
                  </>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Spacer for fixed navbar */}
      <div style={{ height: "64px" }} />
    </>
  );
};

export default Navbar;
