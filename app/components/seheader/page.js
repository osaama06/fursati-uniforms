const styles = `
    .header {
        background-color: #333;
        padding: 20px;
        color: white;
    }
    .logo {
        font-size: 24px;
        font-weight: bold;
    }
    .nav ul {
        list-style: none;
        display: flex;
        gap: 20px;
    }
    .nav a {
        color: white;
        text-decoration: none;
    }
    .menu-toggle {
        display: none;
        cursor: pointer;
    }
    .bar {
        display: block;
        width: 25px;
        height: 3px;
        background-color: white;
        margin: 5px 0;
    }
`;
import React from 'react';

const Header = () => {
    return (
        <header className="header">
            <div className="logo">MyLogo</div>
            <nav className="nav">
                <ul>
                    <li><a href="#home">Home</a></li>
                    <li><a href="#about">About</a></li>
                    <li><a href="#services">Services</a></li>
                    <li><a href="#contact">Contact</a></li>
                </ul>
            </nav>
            <div className="menu-toggle" id="mobile-menu">
                <span className="bar"></span>
                <span className="bar"></span>
                <span className="bar"></span>
            </div>
        </header>
    );
};

export default Header;