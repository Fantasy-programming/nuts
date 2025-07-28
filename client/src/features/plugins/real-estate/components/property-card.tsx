import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/core/components/ui/card';
import { Button } from '@/core/components/ui/button';
import { Badge } from '@/core/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/core/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/core/components/ui/tabs';
import {
  MapPin,
  Calendar,
  ChevronRight,
  Building,
  Bed,
  Bath,
  Square,
} from 'lucide-react';
import { Property } from '../types';
import { PropertyImage } from '@/core/components/ui/optimized-image';

interface PropertyCardProps {
  property: Property;
}

export const PropertyCard = React.memo(({ property }: PropertyCardProps) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <Card className="overflow-hidden">
      <div className="relative h-48 w-full">
        <PropertyImage
          src={property.image}
          alt={property.address}
          className="h-full w-full"
          aspectRatio="wide"
        />
        <Badge
          className="absolute left-2 top-2"
          variant={property.type === 'rental' ? 'default' : 'secondary'}
        >
          {property.type === 'rental' ? 'Rental' : 'Primary Residence'}
        </Badge>
      </div>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="line-clamp-1">{property.name}</CardTitle>
          <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl">
              <DialogHeader>
                <DialogTitle>{property.name}</DialogTitle>
              </DialogHeader>
              <Tabs defaultValue="details">
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="details">Details</TabsTrigger>
                  <TabsTrigger value="financials">Financials</TabsTrigger>
                  <TabsTrigger value="documents">Documents</TabsTrigger>
                </TabsList>
                <TabsContent value="details" className="space-y-4 pt-4">
                  <div className="aspect-video overflow-hidden rounded-lg">
                    <PropertyImage
                      src={property.image}
                      alt={property.address}
                      aspectRatio="video"
                      className="rounded-lg"
                    />
                  </div>
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h3 className="font-semibold">Property Information</h3>
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4 w-4 text-muted-foreground" />
                          <span>{property.address}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Building className="h-4 w-4 text-muted-foreground" />
                          <span>{property.propertyType}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-muted-foreground" />
                          <span>Purchased: {property.purchaseDate}</span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold">Features</h3>
                      <div className="grid gap-2">
                        <div className="flex items-center gap-2">
                          <Bed className="h-4 w-4 text-muted-foreground" />
                          <span>{property.bedrooms} Bedrooms</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Bath className="h-4 w-4 text-muted-foreground" />
                          <span>{property.bathrooms} Bathrooms</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Square className="h-4 w-4 text-muted-foreground" />
                          <span>{property.squareFeet} sq ft</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                <TabsContent value="financials" className="space-y-4 pt-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <h3 className="font-semibold">Purchase Details</h3>
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Purchase Price:</span>
                          <span className="font-medium">${property.purchasePrice.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Current Value:</span>
                          <span className="font-medium">${property.currentValue.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Appreciation:</span>
                          <span className="font-medium text-green-500">
                            +${(property.currentValue - property.purchasePrice).toLocaleString()}
                            ({((property.currentValue / property.purchasePrice - 1) * 100).toFixed(1)}%)
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <h3 className="font-semibold">Mortgage Details</h3>
                      <div className="grid gap-2">
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Loan Amount:</span>
                          <span className="font-medium">${property.mortgage?.loanAmount.toLocaleString()}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Interest Rate:</span>
                          <span className="font-medium">{property.mortgage?.interestRate}%</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-muted-foreground">Monthly Payment:</span>
                          <span className="font-medium">${property.mortgage?.monthlyPayment.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  {property.type === 'rental' && (
                    <div className="space-y-2 pt-4">
                      <h3 className="font-semibold">Rental Information</h3>
                      <div className="grid gap-4 md:grid-cols-2">
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Monthly Rent:</span>
                            <span className="font-medium">${property.rental?.monthlyRent?.toLocaleString() || 0}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Annual Income:</span>
                            <span className="font-medium">${((property.rental?.monthlyRent || 0) * 12).toLocaleString()}</span>
                          </div>
                        </div>
                        <div className="grid gap-2">
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Occupancy Rate:</span>
                            <span className="font-medium">{property.rental?.occupancyRate}%</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-muted-foreground">Cash Flow:</span>
                            <span className="font-medium text-green-500">
                              ${((property.rental?.monthlyRent || 0) - (property.mortgage?.monthlyPayment || 0)).toLocaleString()}/mo
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </TabsContent>
                <TabsContent value="documents" className="pt-4">
                  <div className="space-y-4">
                    <p className="text-muted-foreground">
                      Access and manage important documents related to this property.
                    </p>
                    <div className="grid gap-2">
                      <Button variant="outline" className="justify-start">
                        <Calendar className="mr-2 h-4 w-4" />
                        Purchase Agreement
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <Calendar className="mr-2 h-4 w-4" />
                        Mortgage Documents
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <Calendar className="mr-2 h-4 w-4" />
                        Insurance Policy
                      </Button>
                      <Button variant="outline" className="justify-start">
                        <Calendar className="mr-2 h-4 w-4" />
                        Property Tax Records
                      </Button>
                      {property.type === 'rental' && (
                        <Button variant="outline" className="justify-start">
                          <Calendar className="mr-2 h-4 w-4" />
                          Lease Agreement
                        </Button>
                      )}
                    </div>
                  </div>
                </TabsContent>
              </Tabs>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <MapPin className="h-4 w-4" />
          <span className="line-clamp-1">{property.address}</span>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <div className="text-sm text-muted-foreground">Value</div>
            <div className="font-semibold">${property.currentValue.toLocaleString()}</div>
          </div>
          {property.type === 'rental' ? (
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Monthly Rent</div>
              <div className="font-semibold">${property.rental?.monthlyRent?.toLocaleString() || 0}</div>
            </div>
          ) : (
            <div className="space-y-1">
              <div className="text-sm text-muted-foreground">Mortgage</div>
              <div className="font-semibold">${property.mortgage?.monthlyPayment.toLocaleString()}/mo</div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
});
