import React, { useEffect, useState } from 'react';
import * as z from 'zod';
import { useStore } from '../../store';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate, Link } from 'react-router-dom';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '../../components/ui/card';    
import SocialAuth from '../../components/socialAuth';
import api from '../../libs/apiCalls';
import { toast } from 'sonner'; 
import Separator from '../../components/separator';
import Input from '../../components/ui/input';
import { BiLoader } from 'react-icons/bi';
import { Button } from '../../components/ui/button';

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
    
    const { register, handleSubmit, formState: { errors } } = useForm({
        resolver: zodResolver(LoginSchema)
    });

    const onSubmit = async (data) => {
        try {
            setLoading(true);
            const response = await api.post('/auth/signin', data);
            
            if (response.data.status) {
                toast.success(response.data.message);
                const userInfo = { ...response.data.user, token: response.data.token };
                localStorage.setItem("user", JSON.stringify(userInfo));
                
                setCredentials({
                    user: response.data.user,
                    token: response.data.token
                });

                navigate('/dashboard');
            }
        } catch (error) {
            console.error(error);
            toast.error(error.response?.data?.message || 'Login failed');
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
        <div className="flex items-center justify-center w-full min-h-screen py-10">
            <Card className="w-[400px] bg-white dark:bg-black/20 shadow-md overflow-hidden">
                <div className="p-6 md:p-8">
                    <CardHeader className="py-0">
                        <CardTitle className="mb-8 text-center dark:text-white">
                            Login
                        </CardTitle>
                    </CardHeader>

                    <CardContent className="p-0">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                            <div className="mb-8 space-y-6">
                                <Input
                                    disabled={loading}
                                    id="email"
                                    label="Email"
                                    name="email"
                                    type="email"
                                    placeholder="john@example.com"
                                    error={errors?.email?.message}
                                    {...register("email")}
                                    className="text-sm border dark:border-gray-800 dark:bg-transparent dark:text-gray-400 dark:outline-none dark:placeholder:text-gray-700"
                                />
                                <Input
                                    disabled={loading}
                                    id="password"
                                    label="Password"
                                    name="password"
                                    type="password"
                                    placeholder="password"
                                    error={errors?.password?.message}
                                    {...register("password")}
                                    className="text-sm border dark:border-gray-800 dark:bg-transparent dark:text-gray-400 dark:outline-none dark:placeholder:text-gray-700"
                                />
                                <Separator />
                                <SocialAuth isLoading={loading} setLoading={setLoading} />
                            </div>
                            <Button type="submit" className="w-full bg-black dark:bg-white dark:text-black" disabled={loading}>
                                {loading ? (<BiLoader className="w-4 h-4 animate-spin" />) : ("Login")}
                            </Button>
                        </form>
                    </CardContent>
                </div>
                <CardFooter className="justify-center gap-2">
                    <p>Don't have an account? </p>
                    <Link to="/register" className="font-semibold text-black dark:text-white hover:underline">Register</Link>
                </CardFooter>
            </Card>
        </div>
    );
}

export default Login;
