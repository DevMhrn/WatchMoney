import React, { useEffect, useState, useRef } from 'react';
import * as z from 'zod';
import { animate } from 'animejs';
import { useStore } from '../../store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';    
import SocialAuth from '../../components/socialAuth';
import api from '../../libs/apiCalls';
import { toast } from 'sonner'; 
import Separator from '../../components/separator';
import { BiLoader, BiUser, BiLock } from 'react-icons/bi';
import { Button } from '../../components/ui/button';
import AnimatedBackground from '../../components/ui/animated-background';
import FloatingCard from '../../components/ui/floating-card';
import AnimatedInput from '../../components/ui/animated-input';
import AnimatedButton from '../../components/ui/animated-button';

const LoginSchema = z.object({
    email: z
        .string({ required_error: 'Email is required' })
        .email({ message: 'Invalid email address' }),
    password: z.string({ required_error: 'Password is required' })
        .min(6, { message: 'Password must be at least 6 characters long' })
});

function Login() {
    const { user, setCredentials } = useStore((state) => state);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const titleRef = useRef(null);
    const formRef = useRef(null);
    
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(LoginSchema)
    });

    useEffect(() => {
        // Animate title
        if (titleRef.current) {
            animate(titleRef.current, {
                opacity: [0, 1],
                y: [-30, 0],
                duration: 800,
                delay: 300,
                ease: 'outExpo'
            });
        }

        // Animate form elements
        if (formRef.current) {
            const elements = formRef.current.querySelectorAll('.animate-element');
            elements.forEach((element, index) => {
                animate(element, {
                    opacity: [0, 1],
                    y: [20, 0],
                    duration: 600,
                    delay: 500 + (index * 100),
                    ease: 'outExpo'
                });
            });
        }
    }, []);

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            
            // Add loading animation
            const submitButton = document.querySelector('.submit-button');
            if (submitButton) {
                animate(submitButton, {
                    scale: [1, 0.95, 1],
                    duration: 300,
                    ease: 'outQuad'
                });
            }
            
            const response = await api.post('/auth/signin', data);
            
            if (response.data.status) {
                toast.success(response.data.message);
                const userInfo = { ...response.data.user, token: response.data.token };
                localStorage.setItem("user", JSON.stringify(userInfo));
                
                setCredentials({
                    user: response.data.user,
                    token: response.data.token
                });

                // Success animation before navigation
                animate('.login-card', {
                    scale: 1.1,
                    opacity: 0,
                    duration: 500,
                    ease: 'outExpo',
                    complete: () => navigate('/dashboard')
                });
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Login failed');
            
            // Error shake animation
            animate('.login-card', {
                x: [-10, 10, -10, 10, 0],
                duration: 500,
                ease: 'outQuad'
            });
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            navigate('/dashboard');
        }
    }, [user, navigate]);

    return (
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden">
            <AnimatedBackground />
            
            {/* Theme-aware gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-background/60 to-muted/80" />
            
            <div className="relative z-10 w-full max-w-md px-6">
                <FloatingCard className="group">
                    <Card className="login-card w-full bg-card/90 backdrop-blur-xl border-0 shadow-2xl shadow-primary/20 overflow-hidden">
                        {/* Animated border using theme colors */}
                        <div className="absolute inset-0 bg-gradient-to-r from-primary via-accent to-secondary opacity-20 animate-pulse" />
                        <div className="absolute inset-[1px] bg-card rounded-lg" />
                        
                        <div className="relative p-8">
                            <CardHeader className="py-0 text-center">
                                <div className="flex justify-center mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-2xl flex items-center justify-center shadow-lg">
                                        <BiUser className="w-8 h-8 text-primary-foreground" />
                                    </div>
                                </div>
                                <CardTitle 
                                    ref={titleRef}
                                    className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent opacity-0"
                                >
                                    Welcome Back
                                </CardTitle>
                                <p className="text-muted-foreground mt-2 opacity-0 animate-element">
                                    Sign in to your account
                                </p>
                            </CardHeader>

                            <CardContent className="p-0 mt-8">
                                <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                                    <div className="space-y-5">
                                        <div className="opacity-0 animate-element">
                                            <AnimatedInput
                                                disabled={loading}
                                                id="email"
                                                label="Email Address"
                                                name="email"
                                                type="email"
                                                placeholder="Enter your email"
                                                error={errors?.email?.message}
                                                {...register("email")}
                                                className="text-gray-900 dark:text-gray-100"
                                            />
                                        </div>
                                        
                                        <div className="opacity-0 animate-element">
                                            <AnimatedInput
                                                disabled={loading}
                                                id="password"
                                                label="Password"
                                                name="password"
                                                type="password"
                                                placeholder="Enter your password"
                                                error={errors?.password?.message}
                                                {...register("password")}
                                                className="text-gray-900 dark:text-gray-100"
                                            />
                                        </div>
                                        
                                        <div className="opacity-0 animate-element">
                                            <Separator />
                                        </div>
                                        
                                        <div className="opacity-0 animate-element">
                                            <SocialAuth isLoading={loading} setLoading={setLoading} />
                                        </div>
                                    </div>
                                    
                                    <div className="opacity-0 animate-element">
                                        <AnimatedButton
                                            type="submit"
                                            className="submit-button w-full h-12 text-lg font-semibold"
                                            disabled={loading}
                                            variant="primary"
                                        >
                                            {loading ? (
                                                <div className="flex items-center justify-center gap-2">
                                                    <BiLoader className="w-5 h-5 animate-spin" />
                                                    <span>Signing In...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2">
                                                    <BiLock className="w-5 h-5" />
                                                    <span>Sign In</span>
                                                </div>
                                            )}
                                        </AnimatedButton>
                                    </div>
                                </form>
                            </CardContent>
                            
                            <CardFooter className="justify-center gap-2 mt-8 opacity-0 animate-element">
                                <p className="text-muted-foreground">Don't have an account?</p>
                                <Link 
                                    to="/register" 
                                    className="font-semibold text-primary hover:text-accent transition-colors duration-200 hover:underline"
                                >
                                    Create Account
                                </Link>
                            </CardFooter>
                        </div>
                    </Card>
                </FloatingCard>
            </div>
        </div>
    );
}

export default Login;
