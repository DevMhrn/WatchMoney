import React, { useState, useRef, useEffect } from "react";
import { animate } from 'animejs';
import { IoMoonOutline } from "react-icons/io5";
import { LuSunMoon } from "react-icons/lu";
import { useStore } from "../store";

const ThemeSwitch = () => {
    const { theme, setTheme } = useStore((state) => state);
    const [isDarkMode, setIsDarkMode] = useState(theme === "dark");
    const buttonRef = useRef(null);
    const iconRef = useRef(null);

    useEffect(() => {
        setIsDarkMode(theme === "dark");
    }, [theme]);

    const toggleTheme = () => {
        const newTheme = isDarkMode ? "light" : "dark";
        setIsDarkMode(!isDarkMode);
        setTheme(newTheme);
        localStorage.setItem("theme", newTheme);

        // Animate the switch
        if (buttonRef.current && iconRef.current) {
            animate(buttonRef.current, {
                scale: [1, 0.9, 1.1, 1],
                duration: 400,
                ease: 'outElastic'
            });

            animate(iconRef.current, {
                rotate: '360deg',
                duration: 500,
                ease: 'outExpo'
            });
        }
    };

    return (
        <button 
            ref={buttonRef}
            onClick={toggleTheme} 
            className="outline-none p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-all duration-300 transform hover:scale-105 active:scale-95"
            aria-label="Toggle theme"
        >
            <div ref={iconRef}>
                {isDarkMode ? (
                    <LuSunMoon size={26} className="text-yellow-500 dark:text-yellow-400" />
                ) : (
                    <IoMoonOutline size={26} className="text-blue-600" />
                )}
            </div>
        </button>
    );
};

export default ThemeSwitch;
