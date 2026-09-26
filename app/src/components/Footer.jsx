import React from 'react';
import '../App.css';

export default function Footer() {
    return (
        <div className="Footer-Container">
            <div className="Footer center">
                <p>&copy; Copyright Cody Uhi {new Date().getFullYear()}</p>
            </div>
        </div>
    );
}