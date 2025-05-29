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
          <MenuButton className="focus:outline-none">
            <div className="flex items-center gap-2 transition duration-150 ease-in-out">
              <div className="flex items-center justify-center w-10 h-10 text-white rounded-full cursor-pointer 2xl:w-12 2xl:h-12 bg-gradient-to-br from-blue-500 to-blue-700 hover:shadow-lg hover:shadow-blue-500/30">
                <p className="text-2xl font-bold">
                  {user?.firstname?.charAt(0)}
                </p>
              </div>
              <div className="hidden text-left md:block">
                <p className="text-base font-medium text-gray-800 dark:text-gray-300">
                  {user?.firstname}
                </p>
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {user?.email}
                </span>
              </div>
              <MdOutlineKeyboardArrowDown className="hidden text-2xl text-gray-600 cursor-pointer md:block dark:text-gray-300 hover:text-gray-800 dark:hover:text-gray-100 transition duration-150 ease-in-out" />
            </div>
          </MenuButton>
        </div>
  
        <TransitionWrapper>
          <MenuItems className="absolute right-0 z-50 w-56 mt-2 origin-top-right bg-white divide-y divide-gray-100 rounded-xl shadow-lg dark:bg-gray-800 dark:divide-gray-700 ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="px-4 py-3">
              <div className="flex w-full gap-3">
                <div className="flex items-center justify-center w-10 h-10 text-white rounded-full bg-gradient-to-br from-blue-500 to-blue-700">
                  <p className="text-2xl font-bold">
                    {user?.firstname?.charAt(0)}
                  </p>
                </div>
                <div className="w-full">
                  <p className="text-gray-800 dark:text-gray-200 text-sm font-semibold">
                    {user?.firstname} {user?.lastname}
                  </p>
                  <span className="text-xs text-gray-500 dark:text-gray-400 block overflow-ellipsis">
                    {user?.email}
                  </span>
                </div>
              </div>
            </div>
  
            <div className="py-2">
              <MenuItem>
                {({ active }) => (
                  <Link to="/settings">
                    <button
                      className={`${
                        active
                          ? "bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                          : "text-gray-700 dark:text-gray-300"
                      } flex w-full items-center rounded-md px-4 py-2 text-sm gap-2 transition duration-150 ease-in-out`}
                    >
                      <FaUserCircle className="text-lg" />
                      Profile
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
                    } flex w-full items-center rounded-md px-4 py-2 text-sm gap-2 transition duration-150 ease-in-out`}
                  >
                    <FaSignOutAlt className="text-lg" />
                    Sign Out
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
      <Popover className="relative">
        {({ open }) => (
          <>
            <PopoverButton className="flex items-center rounded-md font-medium focus:outline-none text-gray-600 dark:text-gray-400 md:hidden">
              {open ? (
                <MdOutlineClose size={26} />
              ) : (
                <IoIosMenu size={26} className="hover:text-gray-800 dark:hover:text-gray-200 transition duration-150 ease-in-out" />
              )}
            </PopoverButton>
  
            <TransitionWrapper>
              <PopoverPanel className="absolute z-50 w-screen max-w-sm px-4 py-6 mt-3 transform -translate-x-1/2 left-1/2 bg-white dark:bg-gray-800 rounded-lg shadow-xl">
                <div className="flex flex-col space-y-2">
                  {links.map(({ label, link }, index) => (
                    <Link to={link} key={index}>
                      <PopoverButton
                        className={`${
                          path === link
                            ? "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400"
                            : "text-gray-700 dark:text-gray-300"
                        } flex w-full items-center rounded-md px-3 py-2 text-base font-medium hover:bg-gray-100 dark:hover:bg-gray-700/50 transition duration-150 ease-in-out`}
                      >
                        {label}
                      </PopoverButton>
                    </Link>
                  ))}
                </div>
              </PopoverPanel>
            </TransitionWrapper>
          </>
        )}
      </Popover>
    );
  };
  
  const Navbar = () => {
    return (
      <nav className="sticky top-0 z-40 w-full border-b bg-white/80 backdrop-blur-xl dark:border-gray-800 dark:bg-gray-900/80">
        <div className="flex items-center justify-between h-16 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
          <div className="flex items-center gap-2">
            <RiCurrencyFill className="text-3xl text-blue-600" />
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              Finance Tracker
            </span>
          </div>
  
          <div className="hidden md:flex md:items-center md:space-x-6">
            {links.map(({ label, link }, index) => (
              <Link
                key={index}
                to={link}
                className="text-gray-700 hover:text-blue-600  dark:text-gray-300 dark:hover:text-blue-400 px-3 py-2 rounded-md text-sm font-medium transition duration-150 ease-in-out"
              >
                {label}
              </Link>
            ))}
          </div>
  
          <div className="flex items-center gap-4">
            <ThemeSwitch />
            <UserMenu />
            <MobileSidebar />
          </div>
        </div>
      </nav>
    );
  };
  
  export default Navbar;