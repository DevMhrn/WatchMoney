import {
    MenuButton,
    Menu,
    MenuItem,
    MenuItems,
    Popover,
    PopoverButton,
    PopoverPanel,
  } from "@headlessui/react";
  import { signOut } from "firebase/auth";
  import * as React from "react";
  import { MdOutlineClose, MdOutlineKeyboardArrowDown } from "react-icons/md";
  import { RiCurrencyFill } from "react-icons/ri";
  import { IoIosMenu } from "react-icons/io";
  import { Link, useLocation, useNavigate } from "react-router-dom";
  import { auth } from "../libs/firebaseConfig";
  import { useStore } from '../store';
  import ThemeSwitch from "./switch";
  import TransitionWrapper from "./wrappers/transition-wrapper";
  import { FaUserCircle, FaSignOutAlt } from "react-icons/fa"; // Import new icons
  
  const links = [
    { label: "Dashboard", link: "/dashboard" },
    { label: "Transactions", link: "/transactions" },
    { label: "Accounts", link: "/accounts" },
    { label: "Budgets", link: "/budgets" },
    { label: "Alerts", link: "/alerts" },
    { label: "Settings", link: "/settings" },
  ];
  
  const UserMenu = () => {
    const { user, setCredentials } = useStore((state) => state);
    const navigate = useNavigate();
  
    const handleSignout = async () => {
      try {
        if (user?.provider === "google") {
          await signOut(auth);
        }
        localStorage.removeItem("user");
        setCredentials(null);
        navigate("/login");
      } catch (error) {
        console.error("Error signing out:", error);
      }
    };
  
    return (
      <Menu as="div" className="relative z-50">
        <div>
          <MenuButton className="focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 rounded-lg">
            <div className="flex items-center gap-3 p-1 transition-all duration-200 ease-in-out rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800">
              <div className="flex items-center justify-center w-10 h-10 text-white rounded-full cursor-pointer 2xl:w-11 2xl:h-11 bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 hover:shadow-lg hover:shadow-blue-500/30 transform hover:scale-105 transition-all duration-200">
                <p className="text-lg font-bold 2xl:text-xl">
                  {user?.firstname?.charAt(0)}
                </p>
              </div>
              <div className="hidden text-left lg:block">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-200 leading-tight">
                  {user?.firstname} {user?.lastname}
                </p>
                <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px] block">
                  {user?.email}
                </span>
              </div>
              <MdOutlineKeyboardArrowDown className="hidden lg:block text-lg text-gray-500 dark:text-gray-400 transition-transform duration-200 group-hover:rotate-180" />
            </div>
          </MenuButton>
        </div>
  
        <TransitionWrapper>
          <MenuItems className="absolute right-0 z-50 w-72 mt-3 origin-top-right bg-white divide-y divide-gray-100 rounded-2xl shadow-xl border border-gray-200 dark:bg-gray-800 dark:divide-gray-700 dark:border-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="p-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-12 h-12 text-white rounded-full bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 shadow-lg">
                  <p className="text-xl font-bold">
                    {user?.firstname?.charAt(0)}
                  </p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-gray-800 dark:text-gray-200 text-sm font-semibold truncate">
                    {user?.firstname} {user?.lastname}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {user?.email}
                  </p>
                  <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 mt-1">
                    Active
                  </span>
                </div>
              </div>
            </div>
  
            <div className="py-2">
              <MenuItem>
                {({ active }) => (
                  <Link to="/settings" className="block">
                    <button
                      className={`${
                        active
                          ? "bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          : "text-gray-700 dark:text-gray-300"
                      } flex w-full items-center px-4 py-3 text-sm gap-3 transition-all duration-150 ease-in-out hover:bg-gray-50 dark:hover:bg-gray-700`}
                    >
                      <FaUserCircle className="text-lg text-blue-600 dark:text-blue-400" />
                      <span className="font-medium">Profile Settings</span>
                    </button>
                  </Link>
                )}
              </MenuItem>
  
              <MenuItem>
                {({ active }) => (
                  <button
                    onClick={handleSignout}
                    className={`${
                      active
                        ? "bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400"
                        : "text-red-600 dark:text-red-400"
                    } flex w-full items-center px-4 py-3 text-sm gap-3 transition-all duration-150 ease-in-out hover:bg-red-50 dark:hover:bg-red-900/30`}
                  >
                    <FaSignOutAlt className="text-lg" />
                    <span className="font-medium">Sign Out</span>
                  </button>
                )}
              </MenuItem>
            </div>
          </MenuItems>
        </TransitionWrapper>
      </Menu>
    );
  };
  
  const MobileSidebar = () => {
    const location = useLocation();
    const path = location.pathname;
  
    return (
      <Popover className="relative lg:hidden">
        {({ open }) => (
          <>
            <PopoverButton className="flex items-center justify-center w-10 h-10 rounded-lg font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-900 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-200">
              {open ? (
                <MdOutlineClose size={24} className="text-gray-700 dark:text-gray-300" />
              ) : (
                <IoIosMenu size={24} className="text-gray-700 dark:text-gray-300" />
              )}
            </PopoverButton>
  
            <TransitionWrapper>
              <PopoverPanel className="absolute right-0 z-50 w-80 mt-3 origin-top-right bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 ring-1 ring-black ring-opacity-5">
                <div className="p-4">
                  <div className="flex flex-col space-y-1">
                    <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                      Navigation
                    </h3>
                    {links.map(({ label, link }, index) => (
                      <Link to={link} key={index} className="block">
                        <PopoverButton
                          className={`${
                            path === link
                              ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800"
                              : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700/50 border-transparent"
                          } flex w-full items-center rounded-xl px-4 py-3 text-sm font-medium transition-all duration-200 ease-in-out border`}
                        >
                          <span className="truncate">{label}</span>
                          {path === link && (
                            <div className="ml-auto w-2 h-2 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                          )}
                        </PopoverButton>
                      </Link>
                    ))}
                  </div>
                </div>
              </PopoverPanel>
            </TransitionWrapper>
          </>
        )}
      </Popover>
    );
  };
  
  const Navbar = () => {
    const location = useLocation();
    const path = location.pathname;
  
    return (
      <nav className="sticky top-0 z-40 w-full border-b bg-white/90 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/90 supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-gray-900/60">
        <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12">
          <div className="flex items-center justify-between h-16 lg:h-18">
            {/* Logo Section */}
            <div className="flex items-center gap-3 min-w-0 flex-shrink-0">
              <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 via-blue-600 to-blue-700 shadow-lg">
                <RiCurrencyFill className="text-xl text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-xl lg:text-2xl font-bold bg-gradient-to-r from-gray-900 via-blue-800 to-blue-600 dark:from-white dark:via-blue-400 dark:to-blue-300 bg-clip-text text-transparent">
                  Finance Tracker
                </span>
              </div>
            </div>
  
            {/* Desktop Navigation */}
            <div className="hidden lg:flex lg:items-center lg:space-x-1 xl:space-x-2">
              {links.map(({ label, link }, index) => (
                <Link
                  key={index}
                  to={link}
                  className={`${
                    path === link
                      ? "text-blue-700 bg-blue-50 dark:text-blue-400 dark:bg-blue-900/30"
                      : "text-gray-700 hover:text-blue-600 dark:text-gray-300 dark:hover:text-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  } px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out relative`}
                >
                  {label}
                  {path === link && (
                    <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-blue-600 dark:bg-blue-400 rounded-full"></div>
                  )}
                </Link>
              ))}
            </div>
  
            {/* Right Section */}
            <div className="flex items-center gap-2 lg:gap-4 flex-shrink-0">
              <ThemeSwitch />
              <UserMenu />
              <MobileSidebar />
            </div>
          </div>
        </div>
      </nav>
    );
  };
  
  export default Navbar;