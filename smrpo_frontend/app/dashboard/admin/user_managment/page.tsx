"use client"
import {addUser, getUsers, handleAddUser} from "@/lib/actions/user-actions";
import { User, UserRole } from "@/lib/types/user-types";
import UserCard from "@/components/UserCard";
import React, {useCallback, useEffect, useState} from "react";
import {useUser} from "@/lib/hooks/useUser";    
import { ZodError } from "zod";

export default function UserManagment() {
    const [searchValue, setSearchValue] = useState("")
    const [isAdmin, setIsAdmin] = useState(false);
    const [users, setUsers] = useState<User[]>([]);
    const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
    const [isRefetching, setIsRefetching] = useState(false);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [newUser, setNewUser] = useState({
        userName: "",
        firstName: "",
        lastName: "",
        email: "",
        password: "",
        role: "User"
    });
    const [error, setError] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    const { user } = useUser()

    useEffect(() => {
        setIsAdmin(user?.role === "Administrator")
    }, [user]);

    const fetchUsers = useCallback(async () => {
        try {
            setIsRefetching(true);
            const userData = await getUsers();
            setUsers(userData);
            setFilteredUsers(userData.filter((user: User) =>
                user.userName.toLowerCase().includes(searchValue.toLowerCase()) ||
                user.firstName.toLowerCase().includes(searchValue.toLowerCase()) ||
                user.lastName.toLowerCase().includes(searchValue.toLowerCase()) ||
                user.email.toLowerCase().includes(searchValue.toLowerCase())
            ));
        } catch (error) {
            console.error("Error fetching users:", error);
        } finally {
            setIsRefetching(false);
        }
    }, [searchValue]);

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]);

    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchValue(e.target.value);
    }

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        setNewUser({ ...newUser, [e.target.name]: e.target.value });
    };

    useEffect(() => {
        const result = users.filter(user =>
            user.userName.toLowerCase().includes(searchValue.toLowerCase()) ||
            user.firstName.toLowerCase().includes(searchValue.toLowerCase()) ||
            user.lastName.toLowerCase().includes(searchValue.toLowerCase()) ||
            user.email.toLowerCase().includes(searchValue.toLowerCase())
        );
        setFilteredUsers(result);
    }, [searchValue, users]);

    const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
        event.preventDefault();
        setError("");
        setIsSubmitting(true);

        try {
            const formData = new FormData(event.currentTarget);
            await handleAddUser(formData);
            setIsModalOpen(false);
            fetchUsers(); // Refresh the user list
        } catch (error) {
            if (error instanceof Error) {
                try {
                    // Try to parse the error message as JSON
                    const parsedError = JSON.parse(error.message.replace('Validation error: ', ''));
                    if (Array.isArray(parsedError)) {
                        // If it's an array of validation errors, show the first one
                        setError(parsedError[0].message);
                    } else {
                        setError(error.message);
                    }
                } catch {
                    // If parsing fails, show the original error message
                    setError(error.message.replace('Validation error: ', ''));
                }
            } else {
                setError('An unexpected error occurred');
            }
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-gray-100">
            <div className="bg-white shadow">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <h1 className="text-2xl font-bold text-gray-900">User Management</h1>
                        <div className="relative rounded-md shadow-sm w-64">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                                    <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
                                </svg>
                            </div>
                            <input
                                type="text"
                                placeholder="Search users..."
                                value={searchValue}
                                onChange={handleSearch}
                                className="focus:ring-indigo-500 focus:border-indigo-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                            />
                        </div>
                        <div className="relative group">
                            <button
                                onClick={() => isAdmin && setIsModalOpen(true)}
                                disabled={!isAdmin}
                                className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-colors duration-200 ${
                                    isAdmin
                                        ? 'bg-black text-white hover:bg-gray-800 cursor-pointer'
                                        : 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'
                                }`}
                            >
                                Add User
                            </button>
                            {!isAdmin && (
                                <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200 z-10">
                                    <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                        Only admins can add users
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {filteredUsers.length === 0 ? (
                    <div className="bg-white rounded-lg shadow p-6 text-center text-gray-500">
                        No users found matching your search.
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredUsers.map((user: User) => (
                            <UserCard
                                key={user._id}
                                user={user}
                                onUserUpdated={fetchUsers}
                                isAdmin={isAdmin}
                            />
                        ))}
                    </div>
                )}
            </div>
            {isModalOpen && (
                <div className="fixed inset-0 bg-gray-500 bg-opacity-0  flex items-center justify-center z-50">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6 max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold text-gray-900">Add New User</h2>
                            <button
                                onClick={() => setIsModalOpen(false)}
                                className="text-gray-400 hover:text-gray-500 focus:outline-none"
                            >
                                <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                                </svg>
                            </button>
                        </div>

                        {error && (
                            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-red-700 rounded">
                                {error}
                            </div>
                        )}

                        <form onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                <div>
                                    <label htmlFor="userName" className="block text-sm font-medium text-gray-700">
                                        Username
                                    </label>
                                    <input
                                        type="text"
                                        id="userName"
                                        name="userName"
                                        value={newUser.userName}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        value={newUser.firstName}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        value={newUser.lastName}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                        Email
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        name="email"
                                        value={newUser.email}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                                        Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        name="password"
                                        value={newUser.password}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="role" className="block text-sm font-medium text-gray-700">
                                        Role
                                    </label>
                                    <select
                                        id="role"
                                        name="role"
                                        value={newUser.role}
                                        onChange={handleInputChange}
                                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                                    >
                                        <option value={UserRole.DEVELOPER}>{UserRole.DEVELOPER}</option>
                                        <option value={UserRole.ADMINISTRATOR}>{UserRole.ADMINISTRATOR}</option>
                                    </select>
                                </div>
                            </div>

                            <div className="mt-6 flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className={`px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
                                        isSubmitting ? 'opacity-75 cursor-not-allowed' : ''
                                    }`}
                                >
                                    {isSubmitting ? 'Creating...' : 'Create User'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
