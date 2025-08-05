import { useState } from "react";
import api from "../api";
import { useNavigate } from "react-router-dom";
import { ACCESS_TOKEN, REFRESH_TOKEN } from "../constants";
import LoadingIndicator from "./LoadingIndicator";

function Form(route: string, method: string) {
    const [username, setUsername] = useState("");
    const [password, setPassword] = useState("");
    const [email, setEmail] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const name = method === "login" ? "Login" : "Register";
    const isRegister = method === "register";
    
    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        setLoading(true);
        e.preventDefault();
        
        try { 
            const payload = isRegister 
                ? { username, password, email, phone_number: phoneNumber, first_name: firstName, last_name: lastName }
                : { username, password };
                
            const res = await api.post(route, payload);
            if (method === "login") {
                localStorage.setItem(ACCESS_TOKEN, res.data.access);
                localStorage.setItem(REFRESH_TOKEN, res.data.refresh);
                navigate("/");
            } else {
                navigate("/login");
            }
        }
        catch (error) {
            alert(error);
        }
        finally {
            setLoading(false);
        }
    };

    return (
        <form className="flex flex-col items-center justify-center mx-auto mt-12 p-5 rounded-lg shadow-md max-w-md bg-white dark:bg-neutral-900" onSubmit={handleSubmit}>
            <h1 className="text-2xl font-semibold text-gray-800 dark:text-white mb-4">{name}</h1>
            
            {/* Registration-only fields */}
            {isRegister && (
                <>
                    <input 
                        className="w-full p-2 mb-3 border border-gray-300 rounded box-border text-gray-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        type="text" 
                        placeholder="First Name" 
                        value={firstName} 
                        onChange={(e) => setFirstName(e.target.value)}
                        required />
                    <input 
                        className="w-full p-2 mb-3 border border-gray-300 rounded box-border text-gray-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        type="text" 
                        placeholder="Last Name" 
                        value={lastName} 
                        onChange={(e) => setLastName(e.target.value)}
                        required />
                    <input 
                        className="w-full p-2 mb-3 border border-gray-300 rounded box-border text-gray-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        type="email" 
                        placeholder="Email" 
                        value={email} 
                        onChange={(e) => setEmail(e.target.value)}
                        required />
                    <input 
                        className="w-full p-2 mb-3 border border-gray-300 rounded box-border text-gray-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                        type="tel" 
                        placeholder="Phone Number" 
                        value={phoneNumber} 
                        onChange={(e) => setPhoneNumber(e.target.value)}
                        required />
                </>
            )}
            
            {/* Common fields */}
            <input 
                className="w-full p-2 mb-3 border border-gray-300 rounded box-border text-gray-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="text" 
                placeholder="Username" 
                value={username} 
                onChange={(e) => setUsername(e.target.value)}
                required />
            <input 
                className="w-full p-2 mb-3 border border-gray-300 rounded box-border text-gray-900 dark:text-white bg-white dark:bg-neutral-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
                type="password" 
                placeholder="Password" 
                value={password} 
                onChange={(e) => setPassword(e.target.value)}
                required />
            <button 
                className={`w-full py-2 mt-4 mb-2 rounded text-white transition-colors duration-300 ease-in-out ${loading ? "bg-gray-300 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-800"}`}
                type="submit" 
                disabled={loading}>
                {loading ? "Loading..." : name}
            </button>
            {loading && <LoadingIndicator />}
            <a className="text-blue-500 dark:text-blue-400 hover:underline" href={`/${method === "login" ? "register" : "login"}`}>
                {method === "login" ? "Don't have an account? Register" : "Already have an account? Login"}
            </a>
        </form>
    );
}

export default Form;