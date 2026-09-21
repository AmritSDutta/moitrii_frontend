import React, { useState, useRef, useEffect } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useApp } from "@/lib/AppContext";
import { useBrandAssets } from "@/lib/useBrandAssets";
import { useAuthActions } from "@convex-dev/auth/react";
import { useValidatedAuth } from "@/lib/useValidatedAuth";
import { AuthModal } from "@/components/AuthModal";
import {
  Compass,
  LayoutDashboard,
  Inbox,
  PenTool,
  BookmarkCheck,
  Moon,
  Zap,
  Menu,
  X,
  LogOut,
  LogIn
} from "lucide-react";

export const Navbar: React.FC = () => {
  const location = useLocation();
  const pathname = location.pathname;
  const navigate = useNavigate();
  const { agentState, userInterests, topics } = useApp();
  const { logoUrl } = useBrandAssets();

  const {
    status: authStatus,
    user,
    isAuthenticated,
    authLoading: isAuthLoading,
  } = useValidatedAuth();
  const { signOut } = useAuthActions();

  // Server-validated auth state: signed in only once the viewer query
  // confirms the stored token against the backend.
  const isUserReady = authStatus === "signedIn";
  const isAuthChecking = authStatus === "checking";

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Self-heal ghost sessions (token exists in storage but backend user is null)
  useEffect(() => {
    if (!isAuthLoading && isAuthenticated && user === null) {
      try {
        if (typeof window !== "undefined") {
          const clearKeys = (storage: Storage) => {
            const keysToRemove: string[] = [];
            for (let i = 0; i < storage.length; i++) {
              const key = storage.key(i);
              if (key && (key.includes("convexAuth") || key.includes("ConvexAuth") || key.includes("convex"))) {
                keysToRemove.push(key);
              }
            }
            keysToRemove.forEach((k) => storage.removeItem(k));
          };
          clearKeys(window.localStorage);
          clearKeys(window.sessionStorage);
        }
      } catch {
        // ignore
      }
      void signOut().catch(() => {});
    }
  }, [isAuthLoading, isAuthenticated, user, signOut]);

  // Close user dropdown when clicking outside using click event with stopPropagation check
  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setUserDropdownOpen(false);
      }
    };
    if (userDropdownOpen) {
      document.addEventListener("click", handleDocumentClick);
    }
    return () => {
      document.removeEventListener("click", handleDocumentClick);
    };
  }, [userDropdownOpen]);

  const handleSignOut = async () => {
    setUserDropdownOpen(false);
    setMobileMenuOpen(false);
    try {
      if (typeof window !== "undefined") {
        const clearAuthKeys = (storage: Storage) => {
          const keysToRemove: string[] = [];
          for (let i = 0; i < storage.length; i++) {
            const key = storage.key(i);
            if (key && (key.includes("convexAuth") || key.includes("ConvexAuth") || key.includes("convex"))) {
              keysToRemove.push(key);
            }
          }
          keysToRemove.forEach((k) => storage.removeItem(k));
        };
        clearAuthKeys(window.localStorage);
        clearAuthKeys(window.sessionStorage);
      }
    } catch {
      // ignore
    }
    try {
      await signOut();
    } catch (err) {
      console.error("Sign out error:", err);
    }
    navigate("/");
  };

  const navLinks = [
    { name: "Explore", href: "/", icon: Compass, public: true },
    { name: "My Agent", href: "/dashboard", icon: LayoutDashboard, public: false },
    { name: "Request Center", href: "/requests", icon: Inbox, public: false },
    { name: "Interests", href: "/onboarding", icon: BookmarkCheck, public: false },
    { name: "Publisher Studio", href: "/publisher", icon: PenTool, public: false },
  ];

  return (
    <>
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-petal-200/80 shadow-xs">
        {/* Top Main Navigation */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo & Brand Identity */}
            <Link to="/" className="flex items-center space-x-3 group">
              <div
                className="relative w-9 h-9 rounded-full overflow-hidden ring-2 ring-rosebrand/30 shadow-xs shrink-0 group-hover:ring-forest-700/40 transition-colors"
                style={{ width: 36, height: 36, minWidth: 36, minHeight: 36, maxWidth: 36, maxHeight: 36 }}
              >
                <img
                  src={logoUrl}
                  alt="Moitrii Logo"
                  className="w-full h-full object-cover object-center rounded-full"
                />
              </div>
              <div className="flex flex-col">
                <div className="flex items-center space-x-2">
                  <span className="font-brand-title text-xl sm:text-2xl font-bold tracking-tight text-charcoal-900 group-hover:text-forest-800 transition-colors">
                    Moitrii
                  </span>
                  <span className="text-[11px] bg-rosebrand-soft text-rosebrand px-2 py-0.5 rounded-full font-medium border border-rosebrand/20">
                    মৈত্রী · मैत्री
                  </span>
                </div>
                <span className="text-[10px] text-charcoal-500 tracking-wide">
                  Modern Lifestyle · Calm Companion
                </span>
              </div>
            </Link>

            {/* Desktop Nav Links */}
            <nav className="hidden md:flex items-center space-x-1 lg:space-x-2">
              {navLinks.map((link) => {
                const Icon = link.icon;
                const isActive = pathname === link.href;

                return (
                  <Link
                    key={link.href}
                    to={link.href}
                    className={`flex items-center space-x-2 px-3.5 py-2 rounded-full text-sm font-medium transition-all ${
                      isActive
                        ? "bg-forest-800 text-white shadow-sm"
                        : "text-charcoal-700 hover:text-charcoal-900 hover:bg-petal-100/80"
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? "text-white" : "text-charcoal-500"}`} />
                    <span>{link.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Right Status & Auth/Profile Controls (Persistently Visible) */}
            <div className="flex items-center space-x-2 sm:space-x-3">
              {/* Agent Live Badge (visible on sm+) */}
              {isUserReady ? (
                <Link
                  to="/dashboard"
                  className="hidden sm:flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cream-100 border border-petal-200 shadow-sm hover:border-forest-500/40 transition-colors"
                >
                  <div className="relative flex items-center justify-center">
                    {agentState.status === "SLEEPING" ? (
                      <>
                        <Moon className="w-3.5 h-3.5 text-indigo-500" />
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-indigo-400 rounded-full animate-ping opacity-75" />
                      </>
                    ) : (
                      <>
                        <Zap className="w-3.5 h-3.5 text-emerald-600" />
                        <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping opacity-75" />
                      </>
                    )}
                  </div>
                  <div className="text-left">
                    <span className="text-[11px] font-semibold text-charcoal-800 block leading-tight">
                      {agentState.status === "SLEEPING" ? "Agent Resting" : "Agent Active"}
                    </span>
                    <span className="text-[10px] text-charcoal-500 block leading-tight">
                      Wake: 08:00 AM
                    </span>
                  </div>
                </Link>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="hidden sm:flex items-center space-x-2 px-3.5 py-1.5 rounded-full bg-cream-100/70 hover:bg-cream-100 border border-petal-200 shadow-xs transition-colors cursor-pointer"
                >
                  <Moon className="w-3.5 h-3.5 text-indigo-400" />
                  <div className="text-left">
                    <span className="text-[11px] font-semibold text-charcoal-700 block leading-tight">
                      Agent Resting
                    </span>
                    <span className="text-[10px] text-charcoal-400 block leading-tight">
                      Sign in to wake
                    </span>
                  </div>
                </button>
              )}

              {/* Convex Auth Sign In / User Button */}
              {isAuthChecking ? (
                <div className="w-24 h-9 rounded-full bg-petal-100/80 animate-pulse border border-petal-200" />
              ) : isUserReady && user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setUserDropdownOpen(!userDropdownOpen);
                    }}
                    className="flex items-center space-x-2 bg-petal-100 hover:bg-petal-200 border border-petal-200 px-3 py-1.5 rounded-full text-xs font-semibold text-charcoal-800 transition-colors cursor-pointer"
                  >
                    {user.image ? (
                      <div className="relative w-6 h-6 rounded-full overflow-hidden shrink-0 ring-1 ring-rosebrand/30">
                        <img
                          src={user.image}
                          alt={user.name || "User Avatar"}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ) : (
                      <div className="w-6 h-6 rounded-full bg-forest-800 text-white flex items-center justify-center text-[10px] font-bold shrink-0 uppercase">
                        {user.name?.[0] || user.email?.[0] || "M"}
                      </div>
                    )}
                    <span className="max-w-[110px] truncate">
                      {user.name || user.email?.split("@")[0] || "Account"}
                    </span>
                  </button>

                  {userDropdownOpen && (
                    <div
                      className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl border border-petal-200 p-2 text-xs space-y-1 z-50 animate-fade-in"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="px-3 py-2 border-b border-petal-100">
                        <span className="font-bold text-charcoal-900 block truncate">
                          {user.name || "Moitrii Companion"}
                        </span>
                        <span className="text-[11px] text-charcoal-500 block truncate">
                          {user.email || "Signed in with Google"}
                        </span>
                        <div className="flex items-center space-x-1 text-[10px] text-emerald-700 font-medium mt-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                          <span>Active Google Session</span>
                        </div>
                      </div>
                      <Link
                        to="/dashboard"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-3 py-2 rounded-xl hover:bg-petal-50 text-charcoal-700 font-medium"
                      >
                        Personal Dashboard
                      </Link>
                      <Link
                        to="/onboarding"
                        onClick={() => setUserDropdownOpen(false)}
                        className="block px-3 py-2 rounded-xl hover:bg-petal-50 text-charcoal-700 font-medium"
                      >
                        Topic Interests ({userInterests.length})
                      </Link>
                      <button
                        type="button"
                        onClick={handleSignOut}
                        className="w-full text-left px-3 py-2 rounded-xl hover:bg-red-50 text-red-600 font-medium flex items-center space-x-1.5 transition-colors cursor-pointer"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Sign Out</span>
                      </button>
                    </div>
                  )}
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => setAuthModalOpen(true)}
                  className="flex items-center space-x-1.5 bg-forest-800 hover:bg-forest-900 text-white text-xs font-bold px-4 py-2 rounded-full transition-colors shadow-xs cursor-pointer"
                >
                  <LogIn className="w-3.5 h-3.5" />
                  <span>Sign In</span>
                </button>
              )}

              {/* Mobile menu toggle button */}
              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-lg text-charcoal-700 hover:bg-petal-100 cursor-pointer"
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>
          </div>
        </div>

        {/* Category Sub-Navigation Bar */}
        <div className="border-t border-petal-200/60 bg-white/50 backdrop-blur-xs">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2 overflow-x-auto scrollbar-none flex items-center space-x-6 text-xs text-charcoal-700">
            <span className="font-semibold uppercase tracking-wider text-[10px] text-charcoal-500 shrink-0">
              Editorial Streams:
            </span>
            {topics.map((t) => (
              <a
                key={t.id}
                href={`/?topic=${t.id}#articles-section`}
                className="whitespace-nowrap hover:text-forest-800 hover:font-medium transition-colors"
              >
                {t.name}
              </a>
            ))}
          </div>
        </div>

        {/* Mobile Menu Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-b border-petal-200 bg-petal-50 px-4 pt-2 pb-6 space-y-3">
            {navLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href;

              return (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`flex items-center space-x-3 px-4 py-2.5 rounded-xl text-sm font-medium ${
                    isActive
                      ? "bg-forest-800 text-white"
                      : "text-charcoal-800 hover:bg-petal-100"
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{link.name}</span>
                </Link>
              );
            })}
            <div className="pt-2 border-t border-petal-200 flex items-center justify-between text-xs text-charcoal-600">
              {isUserReady && user ? (
                <div className="flex items-center space-x-2">
                  <div className="w-6 h-6 rounded-full bg-forest-800 text-white flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                    {user.name?.[0] || user.email?.[0] || "M"}
                  </div>
                  <span className="font-semibold text-charcoal-900 truncate max-w-[120px]">
                    {user.name || user.email?.split("@")[0]}
                  </span>
                  <button
                    type="button"
                    onClick={handleSignOut}
                    className="text-red-600 font-bold ml-2 hover:underline cursor-pointer"
                  >
                    Sign Out
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setAuthModalOpen(true);
                  }}
                  className="text-forest-800 font-bold flex items-center space-x-1 cursor-pointer"
                >
                  Sign In with Google
                </button>
              )}
              <Link to="/onboarding" className="text-charcoal-600">
                {userInterests.length} Topics
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Convex Auth Modal Dialog */}
      <AuthModal isOpen={authModalOpen} onClose={() => setAuthModalOpen(false)} />
    </>
  );
};

export default Navbar;
