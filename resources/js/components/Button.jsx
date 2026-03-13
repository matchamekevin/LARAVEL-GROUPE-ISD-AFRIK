import React from "react";

export default function Button({ text, onClick }) {
    return (
        <button
            onClick={onClick}
            className="bg-[#fb9c08] text-white px-4 py-2 rounded-r-md hover:bg-[#e68a00] transition"
        >
            {text}
        </button>
    );
} 
