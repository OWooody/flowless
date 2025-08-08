import { notFound } from 'next/navigation';
import prisma from '../../lib/prisma';
import { Event } from '@prisma/client';

interface EventDetailsPageProps {
  params: {
    id: string;
  };
}

async function getEvent(id: string): Promise<Event | null> {
  return prisma.event.findUnique({
    where: { id },
  });
}

export default async function EventDetailsPage({ params }: EventDetailsPageProps) {
  const event = await getEvent(params.id);

  if (!event) {
    notFound();
  }

  return (
    <div className="container mx-auto py-8">
      <div className="grid gap-4">
        <div className="grid gap-2">
          <h3 className="text-sm font-medium">Event Details</h3>
          <div className="grid gap-1">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Name</span>
              <span className="text-sm font-medium">{event.name}</span>
            </div>
           
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">User ID</span>
              <span className="text-sm font-medium">{event.userId || 'N/A'}</span>
            </div>
            {event.userPhone && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">User Phone</span>
                <span className="text-sm font-medium">{event.userPhone}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Organization ID</span>
              <span className="text-sm font-medium">{event.organizationId || 'N/A'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">Timestamp</span>
              <span className="text-sm font-medium">
                {new Date(event.timestamp).toLocaleString()}
              </span>
            </div>
            {event.path && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Path</span>
                <span className="text-sm font-medium">{event.path}</span>
              </div>
            )}
            {event.pageTitle && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Page Title</span>
                <span className="text-sm font-medium">{event.pageTitle}</span>
              </div>
            )}
            {event.action && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Action</span>
                <span className="text-sm font-medium">{event.action}</span>
              </div>
            )}
            {event.value && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Value</span>
                <span className="text-sm font-medium">{event.value}</span>
              </div>
            )}
            {event.itemName && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Item Name</span>
                <span className="text-sm font-medium">{event.itemName}</span>
              </div>
            )}
            {event.itemId && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Item ID</span>
                <span className="text-sm font-medium">{event.itemId}</span>
              </div>
            )}
            {event.itemCategory && (
              <div className="flex justify-between">
                <span className="text-sm text-muted-foreground">Item Category</span>
                <span className="text-sm font-medium">{event.itemCategory}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 