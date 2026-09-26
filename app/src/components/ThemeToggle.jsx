import React, { useState } from 'react';
import '../App.css';

const STORAGE_KEY = 'cdr_qol_theme';
const THEME_COLORS = { light: '#ebe7df', dark: '#161614' };

// index.html applies the initial theme class before first paint; read it back here.
const currentTheme = () =>
    document.documentElement.classList.contains('cdr-theme-light') ? 'light' : 'dark';

export default function ThemeToggle() {
    const [theme, setTheme] = useState(currentTheme);

    const toggleTheme = () => {
        const next = theme === 'light' ? 'dark' : 'light';
        const root = document.documentElement;
        root.classList.add(`cdr-theme-${next}`);
        root.classList.remove(`cdr-theme-${theme}`);
        const themeMeta = document.querySelector('meta[name="theme-color"]');
        if (themeMeta) themeMeta.content = THEME_COLORS[next];
        try {
            localStorage.setItem(STORAGE_KEY, next);
        } catch (e) {}
        setTheme(next);
    };

    const label = `Switch to ${theme === 'light' ? 'Dark' : 'Light'} Theme`;
    return (
        <button
            type="button"
            className="Theme-Toggle-Button"
            onClick={toggleTheme}
            aria-label={label}
            title={label}
        >
            <i className={theme === 'light' ? 'fa fa-moon-o' : 'fa fa-sun-o'} aria-hidden="true"></i>
        </button>
    );
}
