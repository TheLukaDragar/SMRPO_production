'use client';

import React, {useState} from 'react';
import {deleteUser, updateUser, User} from '@/lib/actions/user-actions';

interface UserCardProps {
    user: User;
    onUserUpdated: () => Promise<void>;
    isAdmin: boolean;
}

const UserCard: React.FC<UserCardProps> = ({ user, onUserUpdated, isAdmin }) => {
    const {userName, firstName, lastName, email, role, createdAt } = user;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editedUser, setEditedUser] = useState(user);

    const initials = `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();

    const formattedDate = createdAt
        ? new Date(createdAt).toISOString().split('T')[0].replace(/-/g, '/')
        : '';

    const getRoleBadgeColor = (role: string) => {
        switch(role.toLowerCase()) {
            case 'Administrator':
                return 'bg-red-100 text-red-800';
            case 'Developer':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    const openModal = () => {
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditedUser(user);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setEditedUser((prev: any) => ({
            ...prev,
            [name]: value
        }));
    };

    //TODO: toasti, validation
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        try {
            const result = await updateUser(user._id, editedUser);

            if (result && result.modifiedCount > 0) {
                const updatedUser = { ...user, ...editedUser };

                setEditedUser(updatedUser);
                await onUserUpdated();

                closeModal();
            } else {
                console.warn('Update operation completed but no documents were modified');
            }
        } catch (error) {
            console.error('Error updating user:', error);
        }
        };

    const handleDelete = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!confirm('Are you sure you want to delete this user?')) {
            return;
        }

        try {
            const result = await deleteUser(user._id);
            console.log(result)
        } catch (error) {
            console.error('Error updating user:', error);
        }
    }


    return (
    <div className="w-full max-w-md bg-white rounded-lg border border-gray-200 shadow-md hover:shadow-lg transition-shadow duration-300">
            <div className="p-5">
                <div className="flex items-center gap-4 mb-4">
                    <div className="relative h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium overflow-hidden">
                        {initials}
                    </div>
                    <div>
                        <h5 className="text-xl font-bold text-gray-900">{firstName} {lastName}</h5>
                        <p className="text-sm text-gray-500">@{userName}</p>
                    </div>
                </div>

                <div className="space-y-3 mb-4">
                    <div className="flex items-center">
                        <span className="text-gray-500 w-24">Email:</span>
                        <span className="text-gray-700">{email}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="text-gray-500 w-24">User ID:</span>
                        <span className="text-gray-700">{user._id}</span>
                    </div>
                    <div className="flex items-center">
                        <span className="text-gray-500 w-24">Role:</span>
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(role)}`}>
              {role}
            </span>
                    </div>
                    {createdAt && (
                        <div className="flex items-center">
                            <span className="text-gray-500 w-24">Created:</span>
                            <span className="text-gray-700">{formattedDate}</span>
                        </div>
                    )}
                </div>
            </div>
            <div className="flex gap-2 mt-6 justify-center w-full pb-4">
                <div className="relative group">
                    <button
                        onClick={openModal}
                        disabled={!isAdmin}
                        className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200 ${
                            isAdmin
                                ? 'bg-black text-white hover:bg-gray-800 cursor-pointer'
                                : 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'
                        }`}
                    >
                        Edit User
                    </button>
                    {!isAdmin && (
                        <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                Only admins can edit users
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                            </div>
                        </div>
                    )}
                </div>
                <div className="relative group">
                <button
                    onClick={handleDelete}
                    disabled={!isAdmin}
                    className={`px-4 py-2 text-sm font-medium rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 transition-colors duration-200 ${
                        isAdmin
                            ? 'bg-black text-white hover:bg-gray-800 cursor-pointer'
                            : 'bg-gray-300 text-gray-500 cursor-not-allowed hover:bg-gray-300'
                    }`}
                >
                    Delete User
                </button>
                    {!isAdmin && (
                        <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 invisible group-hover:visible opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                            <div className="bg-gray-800 text-white text-xs rounded py-1 px-2 whitespace-nowrap">
                                Only admins can delete users
                                <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
            <div
                className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${isModalOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
            >
                <div
                    className="absolute inset-0 bg-black bg-opacity-40 backdrop-blur-sm"
                    onClick={closeModal}
                ></div>

                <div
                    className="bg-white rounded-lg shadow-xl w-full max-w-md p-6 relative transform transition-all duration-300 scale-100 opacity-100 z-10"
                >
                    <button
                        onClick={closeModal}
                        className="absolute top-3 right-3 text-gray-500 hover:text-gray-700 transition-colors"
                        aria-label="Close modal"
                    >
                        <span className="text-2xl">&times;</span>
                    </button>

                    <h3 className="text-xl font-bold mb-4">Edit User</h3>

                    <form onSubmit={handleSubmit}>
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                                        First Name
                                    </label>
                                    <input
                                        type="text"
                                        id="firstName"
                                        name="firstName"
                                        value={editedUser.firstName}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                                        Last Name
                                    </label>
                                    <input
                                        type="text"
                                        id="lastName"
                                        name="lastName"
                                        value={editedUser.lastName}
                                        onChange={handleInputChange}
                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        required
                                    />
                                </div>
                            </div>

                            <div>
                                <label htmlFor="userName" className="block text-sm font-medium text-gray-700 mb-1">
                                    Username
                                </label>
                                <input
                                    type="text"
                                    id="userName"
                                    name="userName"
                                    value={editedUser.userName}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                                    Email
                                </label>
                                <input
                                    type="email"
                                    id="email"
                                    name="email"
                                    value={editedUser.email}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                            </div>

                            <div>
                                <label htmlFor="role" className="block text-sm font-medium text-gray-700 mb-1">
                                    Role
                                </label>
                                <select
                                    id="role"
                                    name="role"
                                    value={editedUser.role}
                                    onChange={handleInputChange}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                >
                                    <option value="User">User</option>
                                    <option value="Developer">Developer</option>
                                    <option value="Administrator">Administrator</option>
                                </select>
                            </div>
                        </div>

                        <div className="flex justify-end gap-3 mt-6">
                            <button
                                type="button"
                                onClick={closeModal}
                                className="px-4 py-2 bg-gray-200 text-gray-800 text-sm font-medium rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-500 text-white text-sm font-medium rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50 transition-colors"
                            >
                                Save Changes
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

export default UserCard;