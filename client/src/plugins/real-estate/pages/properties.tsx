import { useRealEstateStore } from '../store';
import { PropertyCard } from '../components/property-card';
import { AddPropertyDialog } from '../components/add-property-dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/core/components/ui/select';
import { Input } from '@/core/components/ui/input';
import { Search } from 'lucide-react';
import { useCallback, useMemo, useState } from 'react';

export function Properties() {
  const properties = useRealEstateStore(state => state.properties);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'primary' | 'rental'>('all');

  const filteredProperties = useMemo(() => { 
    return properties.filter((property) => {
    const matchesSearch = property.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      property.address.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === 'all' || property.type === filterType;

    return matchesSearch && matchesType;
  });
}, [properties, searchTerm, filterType]);

const handleFilterTypeChange = useCallback((value: 'all' | 'primary' | 'rental') => {
  setFilterType(value);
}, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Properties</h2>
        <AddPropertyDialog />
      </div>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search properties..."
            className="pl-8"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select
          value={filterType}
          onValueChange={handleFilterTypeChange}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Properties</SelectItem>
            <SelectItem value="primary">Primary Residence</SelectItem>
            <SelectItem value="rental">Rental Properties</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {filteredProperties.length > 0 ? (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredProperties.map((property) => (
            <PropertyCard key={property.id} property={property} />
          ))}
        </div>
      ) : (
        <div className="flex h-[400px] items-center justify-center rounded-lg border border-dashed">
          <div className="text-center">
            <h3 className="text-lg font-medium">No properties found</h3>
            <p className="text-sm text-muted-foreground">
              {searchTerm || filterType !== 'all'
                ? 'Try adjusting your search or filters'
                : 'Add your first property to get started'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

export default Properties;
