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
import { BiLoader, BiUserPlus, BiUser } from 'react-icons/bi';
import { Button } from '../../components/ui/button';
import AnimatedBackground from '../../components/ui/animated-background';
import FloatingCard from '../../components/ui/floating-card';
import AnimatedInput from '../../components/ui/animated-input';
import AnimatedButton from '../../components/ui/animated-button';

const RegisterSchema = z.object({
    email: z
        .string({ required_error: 'Email is required' })
        .email({ message: 'Invalid email address' }),
    firstName: z.string({ required_error: 'First name is required' })
        .min(3, { message: 'First name must be at least 3 characters' }),
    password: z.string({ required_error: 'Password is required' })
        .min(6, { message: 'Password must be at least 6 characters long' }),
    confirmPassword: z.string({ required_error: 'Confirm Password is required' })
        .min(6)
})
.refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
});

function Register() {
    const { user, setCredentials } = useStore((state) => state);
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const titleRef = useRef(null);
    const formRef = useRef(null);
    
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(RegisterSchema)
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
            
            const response = await api.post('/auth/signup', data);
            
            if (response.data?.status) {
                toast.success('Registration successful!');
                setCredentials({
                    user: response.data.user,
                    token: response.data.token
                });
                
                // Success animation before navigation
                animate('.register-card', {
                    scale: 1.1,
                    opacity: 0,
                    duration: 500,
                    ease: 'outExpo',
                    complete: () => navigate('/dashboard')
                });
            } else {
                toast.error(response.data?.message || 'Registration failed');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Registration failed');
            
            // Error shake animation
            animate('.register-card', {
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
        <div className="relative min-h-screen flex items-center justify-center overflow-hidden py-8">
            <AnimatedBackground />
            
            {/* Theme-aware gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-background/80 via-muted/60 to-background/80" />
            
            <div className="relative z-10 w-full max-w-md px-6">
                <FloatingCard className="group">
                    <Card className="register-card w-full bg-card/90 backdrop-blur-xl border-0 shadow-2xl shadow-secondary/20 overflow-hidden">
                        {/* Animated border using theme colors */}
                        <div className="absolute inset-0 bg-gradient-to-r from-secondary via-primary to-accent opacity-20 animate-pulse" />
                        <div className="absolute inset-[1px] bg-card rounded-lg" />
                        
                        <div className="relative p-8">
                            <CardHeader className="py-0 text-center">
                                <div className="flex justify-center mb-6">
                                    <div className="w-16 h-16 bg-gradient-to-r from-secondary to-primary rounded-2xl flex items-center justify-center shadow-lg">
                                        <BiUserPlus className="w-8 h-8 text-secondary-foreground" />
                                    </div>
                                </div>
                                <CardTitle 
                                    ref={titleRef}
                                    className="text-3xl font-bold bg-gradient-to-r from-secondary to-primary bg-clip-text text-transparent opacity-0"
                                >
                                    Create Account
                                </CardTitle>
                                <p className="text-muted-foreground mt-2 opacity-0 animate-element">
                                    Join us and start your journey
                                </p>
                            </CardHeader>

                            <CardContent className="p-0 mt-8">
                                <form ref={formRef} onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                                    <div className="space-y-4">
                                        <div className="opacity-0 animate-element">
                                            <AnimatedInput
                                                disabled={loading}
                                                id="firstName"
                                                label="First Name"
                                                name="firstName"
                                                type="text"
                                                placeholder="Enter your first name"
                                                error={errors?.firstName?.message}
                                                {...register("firstName")}
                                                className="text-gray-900 dark:text-gray-100"
                                            />
                                        </div>
                                        
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
                                                placeholder="Create a password"
                                                error={errors?.password?.message}
                                                {...register("password")}
                                                className="text-gray-900 dark:text-gray-100"
                                            />
                                        </div>
                                        
                                        <div className="opacity-0 animate-element">
                                            <AnimatedInput
                                                disabled={loading}
                                                id="confirmPassword"
                                                label="Confirm Password"
                                                name="confirmPassword"
                                                type="password"
                                                placeholder="Confirm your password"
                                                error={errors?.confirmPassword?.message}
                                                {...register("confirmPassword")}
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
                                                    <span>Creating Account...</span>
                                                </div>
                                            ) : (
                                                <div className="flex items-center justify-center gap-2">
                                                    <BiUserPlus className="w-5 h-5" />
                                                    <span>Create Account</span>
                                                </div>
                                            )}
                                        </AnimatedButton>
                                    </div>
                                </form>
                            </CardContent>
                            
                            <CardFooter className="justify-center gap-2 mt-6 opacity-0 animate-element">
                                <p className="text-muted-foreground">Already have an account?</p>
                                <Link 
                                    to="/login" 
                                    className="font-semibold text-secondary hover:text-primary transition-colors duration-200 hover:underline"
                                >
                                    Sign In
                                </Link>
                            </CardFooter>
                        </div>
                    </Card>
                </FloatingCard>
            </div>
        </div>
    );
}

export default Register;
