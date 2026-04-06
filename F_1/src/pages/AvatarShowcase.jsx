import React from 'react';
import PageTransition from '../components/common/PageTransition.jsx';
import Card from '../components/common/Card';
import Avatar from '../components/common/Avatar';
import { Check } from 'lucide-react';

export default function AvatarShowcase() {
  // Sample users for demo
  const demoUsers = [
    {
      name: 'Rajesh Kumar',
      email: 'rajesh@example.com',
      role: 'farmer',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Rajesh',
      verified: true,
    },
    {
      name: 'Priya Singh',
      email: 'priya@example.com',
      role: 'farmer',
      photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Priya',
      verified: true,
    },
    {
      name: 'Arjun Patel',
      email: 'arjun@example.com',
      role: 'buyer',
      // No photo - will show initial
      verified: false,
    },
    {
      name: 'Maya Reddy',
      email: 'maya@example.com',
      role: 'buyer',
      photo: null,
      verified: false,
    },
  ];

  return (
    <PageTransition>
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-white to-emerald-50 py-12 px-4">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold text-gray-900 mb-4">Profile Photo System</h1>
            <p className="text-lg text-gray-600">
              Farmers and buyers can upload profile photos for identity verification. Photos appear throughout the app.
            </p>
          </div>

          {/* Avatar Sizes Showcase */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Avatar Sizes</h2>
            <div className="flex items-center gap-8">
              <div className="text-center">
                <Avatar size="xs" user={demoUsers[0]} />
                <p className="text-sm text-gray-600 mt-2">Extra Small</p>
              </div>
              <div className="text-center">
                <Avatar size="sm" user={demoUsers[0]} />
                <p className="text-sm text-gray-600 mt-2">Small</p>
              </div>
              <div className="text-center">
                <Avatar size="md" user={demoUsers[0]} />
                <p className="text-sm text-gray-600 mt-2">Medium</p>
              </div>
              <div className="text-center">
                <Avatar size="lg" user={demoUsers[0]} />
                <p className="text-sm text-gray-600 mt-2">Large</p>
              </div>
              <div className="text-center">
                <Avatar size="xl" user={demoUsers[0]} />
                <p className="text-sm text-gray-600 mt-2">Extra Large</p>
              </div>
            </div>
          </Card>

          {/* Demo Users */}
          <Card className="p-8 mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Demo Users</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {demoUsers.map((user, idx) => (
                <div key={idx} className="border border-gray-200 rounded-lg p-6 hover:shadow-lg transition">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar user={user} size="lg" />
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">{user.name}</h3>
                      <p className="text-sm text-gray-600">{user.email}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold text-white ${
                          user.role === 'farmer' ? 'bg-green-500' : 'bg-blue-500'
                        }`}>
                          {user.role?.toUpperCase()}
                        </span>
                        {user.verified && (
                          <span className="flex items-center gap-1 text-xs text-green-600 font-semibold">
                            <Check size={14} /> Verified
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <p className="text-xs text-gray-500">
                    {user.photo ? '📸 Has photo uploaded' : '📝 Using email initial'}
                  </p>
                </div>
              ))}
            </div>
          </Card>

          {/* Features */}
          <Card className="p-8 bg-gradient-to-br from-green-50 to-emerald-50">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Features</h2>
            <ul className="space-y-4">
              <li className="flex gap-3">
                <Check className="text-green-600 shrink-0" />
                <span className="text-gray-700"><strong>Upload Photos:</strong> Farmers and buyers can upload profile photos during registration or edit profile</span>
              </li>
              <li className="flex gap-3">
                <Check className="text-green-600 shrink-0" />
                <span className="text-gray-700"><strong>Automatic Avatars:</strong> If no photo is provided, the first letter of email is used</span>
              </li>
              <li className="flex gap-3">
                <Check className="text-green-600 shrink-0" />
                <span className="text-gray-700"><strong>Identity Verification:</strong> Photos help verify user identity and build trust</span>
              </li>
              <li className="flex gap-3">
                <Check className="text-green-600 shrink-0" />
                <span className="text-gray-700"><strong>Everywhere:</strong> Avatars displayed in navbar, crop details, checkout, and user profiles</span>
              </li>
              <li className="flex gap-3">
                <Check className="text-green-600 shrink-0" />
                <span className="text-gray-700"><strong>Color Consistency:</strong> Photos without uploaded files get consistent colors based on email</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </PageTransition>
  );
}
