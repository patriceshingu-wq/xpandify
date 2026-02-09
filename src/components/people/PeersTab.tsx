import { useState } from 'react';
import { useTeammates } from '@/hooks/useTeammates';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { EmptyState } from '@/components/ui/empty-state';
import { CardSkeleton, ListSkeleton } from '@/components/ui/mobile-skeletons';
import { UsersRound, Search } from 'lucide-react';
import { TeammateCard } from '@/components/team/TeammateCard';

export function PeersTab() {
  const { data: teammates, isLoading } = useTeammates();
  const [searchQuery, setSearchQuery] = useState('');

  const filteredTeammates = teammates?.filter(t => {
    const fullName = `${t.first_name} ${t.last_name}`.toLowerCase();
    const preferredName = t.preferred_name?.toLowerCase() || '';
    return fullName.includes(searchQuery.toLowerCase()) || preferredName.includes(searchQuery.toLowerCase());
  }) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="p-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search teammates..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <ListSkeleton count={4} ItemComponent={CardSkeleton} className="grid gap-4 md:grid-cols-2" />
      ) : filteredTeammates.length > 0 ? (
        <div className="grid gap-4 md:grid-cols-2">
          {filteredTeammates.map((teammate) => (
            <TeammateCard key={teammate.id} teammate={teammate} />
          ))}
        </div>
      ) : (
        <EmptyState
          icon={<UsersRound className="h-16 w-16" />}
          title="No Teammates"
          description={searchQuery ? "No teammates match your search" : "You don't have any teammates with the same supervisor"}
        />
      )}
    </div>
  );
}
