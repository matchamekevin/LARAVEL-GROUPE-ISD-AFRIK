import React from "react";
import Header from "../components/Header";
import Footer from "../components/Footer";

export default function MainLayout({ children }) {
    return (
        <div className="min-h-screen flex flex-col font-[Corbel]">
            <Header />
            <main className="flex-grow">{children}</main>
            <Footer />
        </div>
    );
}