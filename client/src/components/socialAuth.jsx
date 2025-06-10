import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import React, { useState } from "react";  // Remove useEffect and useAuthState
import { FcGoogle } from "react-icons/fc";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "../libs/apiCalls";
import { auth } from "../libs/firebaseConfig";
import { useStore } from "../store";
import { Button } from "./ui/button";
import { BiLoader } from "react-icons/bi";

const SocialAuth = ({ isLoading, setLoading }) => {
    const { setCredentials } = useStore((state) => state);
    const navigate = useNavigate();

    const signInWithGoogle = async () => {
        try {
            setLoading(true);
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);
            
            const userData = {
                firstName: result.user.displayName?.split(' ')[0],
                email: result.user.email,
                provider: 'google',
                uid: result.user.uid,
            };

            // First try to sign in
            const { data } = await api.post("/auth/signin", userData);

            if (data?.status) {
                toast.success('Successfully signed in with Google!');
                const userInfo = { ...data.user, token: data.token };
                localStorage.setItem("user", JSON.stringify(userInfo));
                setCredentials(userInfo);
                navigate("/dashboard");
            } else {
                toast.error(data?.message || 'Something went wrong');
            }
        } catch (error) {
            console.error("Error signing in with Google:", error);
            const errorMessage = error?.response?.data?.message || 'Failed to sign in with Google';
            
            // If user doesn't exist, try to register them
            if (errorMessage.toLowerCase().includes('user with this email does not exist') || 
                errorMessage.toLowerCase().includes('does not exist')) {
                try {
                    // Auto-register the user with Google data
                    const userData = {
                        firstName: result.user.displayName?.split(' ')[0],
                        email: result.user.email,
                        password: result.user.uid, // Use UID as password for Google users
                        provider: 'google',
                        uid: result.user.uid,
                    };
                    
                    const registerResponse = await api.post("/auth/signup", userData);
                    if (registerResponse.data?.status) {
                        toast.success('Account created and signed in successfully!');
                        const userInfo = { ...registerResponse.data.user, token: registerResponse.data.token };
                        localStorage.setItem("user", JSON.stringify(userInfo));
                        setCredentials(userInfo);
                        navigate("/dashboard");
                    }
                } catch (registerError) {
                    console.error("Error registering with Google:", registerError);
                    toast.error("Failed to create account with Google");
                }
            } else {
                toast.error(errorMessage);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <Button
                onClick={signInWithGoogle}
                disabled={isLoading}
                variant="outline"
                className="w-full text-sm font-normal dark:bg-transparent dark:border-gray-800 dark:text-gray-400"
                type="button"
            >
                <FcGoogle className="mr-2 size-5" />
                Continue with Google
            </Button>
        </div>
    );
};

export default SocialAuth;
