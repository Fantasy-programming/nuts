import { useRealEstateStore } from '../store';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Badge } from '@/core/components/ui/badge';
import { MapPin, Home, Building } from 'lucide-react';

export function Map() {
  const { properties } = useRealEstateStore();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-3xl font-bold tracking-tight">Property Map</h2>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Property Locations</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative h-[600px] w-full overflow-hidden rounded-lg border">
            <div className="absolute inset-0 flex items-center justify-center bg-muted">
              <div className="text-center">
                <MapPin className="mx-auto h-12 w-12 text-muted-foreground" />
                <h3 className="mt-4 text-lg font-medium">Map View</h3>
                <p className="mt-2 text-sm text-muted-foreground">
                  In a real implementation, this would display an interactive map with property locations.
                </p>
              </div>
            </div>

            {/* Property markers would be positioned on the map */}
            <div className="absolute bottom-4 left-4 space-y-2">
              {properties.map((property) => (
                <div
                  key={property.id}
                  className="flex items-center gap-2 rounded-lg bg-background p-2 shadow-md"
                >
                  {property.type === 'primary' ? (
                    <Home className="h-4 w-4" />
                  ) : (
                    <Building className="h-4 w-4" />
                  )}
                  <span className="text-sm font-medium">{property.name}</span>
                  <Badge variant={property.type === 'primary' ? 'secondary' : 'default'} className="ml-auto">
                    {property.type === 'primary' ? 'Primary' : 'Rental'}
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default Map;
