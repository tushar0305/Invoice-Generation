'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, UserPlus, Mail, Shield, Clock, CheckCircle2, XCircle, MoreVertical } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';
import Link from 'next/link';

interface StaffMember {
  id: string;
  user_id: string;
  role: string;
  email: string;
  joined_at: string;
  is_active: boolean;
}

interface Invitation {
  id: string;
  email: string;
  role: string;
  status: string;
  created_at: string;
}

interface MobileStaffListProps {
  shopId: string;
  staff: StaffMember[];
  invitations: Invitation[];
  currentUserId: string;
}

export function MobileStaffList({ shopId, staff, invitations, currentUserId }: MobileStaffListProps) {
  const [activeTab, setActiveTab] = useState<'staff' | 'invites'>('staff');
  const [search, setSearch] = useState('');

  const filteredStaff = staff.filter(s => 
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="md:hidden min-h-screen bg-gray-50/50 dark:bg-black/50 pb-24">
      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 px-4 py-3 space-y-3 shadow-sm">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-gray-600 dark:from-white dark:to-gray-400 bg-clip-text text-transparent">
            Team Members
          </h1>
          <Link href={`/shop/${shopId}/staff/invite`}>
            <Button size="sm" className="rounded-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-lg shadow-indigo-500/20">
              <UserPlus className="w-4 h-4 mr-1" /> Invite
            </Button>
          </Link>
        </div>

        {/* Tabs */}
        <div className="flex p-1 bg-gray-100 dark:bg-gray-800 rounded-xl">
          <button
            onClick={() => setActiveTab('staff')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'staff'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Active Staff
            <span className="bg-gray-200 dark:bg-gray-600 px-1.5 py-0.5 rounded-full text-[10px]">
              {staff.length}
            </span>
          </button>
          <button
            onClick={() => setActiveTab('invites')}
            className={`flex-1 py-2 text-xs font-medium rounded-lg transition-all flex items-center justify-center gap-2 ${
              activeTab === 'invites'
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400'
            }`}
          >
            Pending Invites
            {invitations.length > 0 && (
              <span className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400 px-1.5 py-0.5 rounded-full text-[10px]">
                {invitations.length}
              </span>
            )}
          </button>
        </div>

        {activeTab === 'staff' && (
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input 
              placeholder="Search staff..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-gray-100/50 dark:bg-gray-800/50 border-none focus-visible:ring-1 focus-visible:ring-indigo-500"
            />
          </div>
        )}
      </div>

      {/* List */}
      <div className="p-4 space-y-3">
        <AnimatePresence mode="popLayout">
          {activeTab === 'staff' ? (
            filteredStaff.map((member, index) => (
              <motion.div
                key={member.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold shadow-md shadow-indigo-500/20">
                          {member.email.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                              {member.email}
                            </h3>
                            {member.user_id === currentUserId && (
                              <Badge variant="secondary" className="text-[10px] h-5">You</Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Badge variant="outline" className="text-[10px] border-indigo-200 text-indigo-700 dark:border-indigo-800 dark:text-indigo-400 capitalize">
                              <Shield className="w-3 h-3 mr-1" />
                              {member.role}
                            </Badge>
                            <span className="text-[10px] text-muted-foreground flex items-center">
                              <Clock className="w-3 h-3 mr-1" />
                              Joined {format(new Date(member.joined_at), 'MMM yyyy')}
                            </span>
                          </div>
                        </div>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2">
                        <MoreVertical className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          ) : (
            invitations.map((invite, index) => (
              <motion.div
                key={invite.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ delay: index * 0.05 }}
              >
                <Card className="border-none shadow-sm bg-white dark:bg-gray-900/50 border-l-4 border-l-orange-400">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-orange-500" />
                        <span className="text-sm font-medium">{invite.email}</span>
                      </div>
                      <Badge variant="secondary" className="bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400">
                        Pending
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between text-xs text-muted-foreground">
                      <span className="capitalize">Role: {invite.role}</span>
                      <span>Sent: {format(new Date(invite.created_at), 'dd MMM yyyy')}</span>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))
          )}
        </AnimatePresence>

        {activeTab === 'staff' && filteredStaff.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Shield className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No staff members found</p>
          </div>
        )}

        {activeTab === 'invites' && invitations.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="w-12 h-12 mx-auto mb-3 opacity-20" />
            <p>No pending invitations</p>
          </div>
        )}
      </div>
    </div>
  );
}
