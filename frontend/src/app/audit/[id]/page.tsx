'use client';

import { use, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useConnection } from 'wagmi';
import { ArrowLeft, Clock, Activity, FileText, UserCircle, Hash } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useEventById } from '@/lib/apiHooks';

export default function EventDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const { address } = useConnection();

  const { data: event, isLoading, isError } = useEventById(id, address);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-transparent p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
        <Skeleton className="h-8 w-32" />
        <Card>
          <CardContent className="p-8 space-y-6">
            <Skeleton className="h-10 w-2/3" />
            <Skeleton className="h-6 w-1/3" />
            <Skeleton className="h-40 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (isError || !event) {
    return (
      <div className="min-h-screen bg-transparent flex flex-col items-center justify-center p-6 text-center gap-4">
        <Activity className="h-12 w-12 text-muted-foreground mb-2" />
        <h2 className="text-xl font-semibold">Event Not Found</h2>
        <p className="text-muted-foreground">The event you are looking for does not exist or you lack permissions.</p>
        <Button onClick={() => router.push('/audit')} variant="outline" className="mt-4">
          Return to Audit Log
        </Button>
      </div>
    );
  }

  const ts = new Date(event.timestamp);

  return (
    <div className="min-h-screen bg-transparent p-6 lg:p-10 max-w-5xl mx-auto space-y-6">
      <Button
        variant="ghost"
        onClick={() => router.push('/audit')}
        className="gap-2 text-muted-foreground hover:text-foreground -ml-4"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Audit Log
      </Button>

      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Event Details
          </h1>
          <p className="text-muted-foreground font-mono text-xs mt-1">ID: {event.id}</p>
        </div>
        <Badge variant="outline" className="text-sm py-1 border-sky-500/30 text-sky-400 bg-sky-500/10 self-start">
          {event.type}
        </Badge>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4 text-muted-foreground" />
              Timestamp
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="font-mono text-foreground">
              {ts.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
            <p className="font-mono text-sm text-muted-foreground mt-1">
              {ts.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', timeZoneName: 'short' })}
            </p>
          </CardContent>
        </Card>

        <Card className="">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <UserCircle className="h-4 w-4 text-muted-foreground" />
              Initiator
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground text-xs mb-1">Wallet Address</p>
            <p className="font-mono text-foreground break-all bg-muted/50 p-2 rounded border">
              {event.initiatorAddress}
            </p>
          </CardContent>
        </Card>

        <Card className="md:col-span-2">
          <CardHeader className="pb-4">
            <CardTitle className="text-base flex items-center gap-2">
              <FileText className="h-4 w-4 text-muted-foreground" />
              Case Information
            </CardTitle>
          </CardHeader>
          <CardContent className="grid sm:grid-cols-2 gap-6">
            <div>
              <p className="text-muted-foreground text-xs mb-1">Case Title</p>
              <p className="font-medium text-foreground">{event.caseTitle ?? 'Unknown'}</p>
            </div>
            <div>
              <p className="text-muted-foreground text-xs mb-1">Case ID (Contract)</p>
              <p className="font-mono text-muted-foreground break-all text-sm">{event.caseId}</p>
            </div>
          </CardContent>
        </Card>

        {(event.involvedInvestigator || event.documentPath || event.hash || event.cid) && (
          <Card className="md:col-span-2">
            <CardHeader className="pb-4">
              <CardTitle className="text-base flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground" />
                Additional Payload
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {event.involvedInvestigator && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Involved Investigator</p>
                  <p className="font-mono text-foreground text-sm break-all">{event.involvedInvestigator}</p>
                </div>
              )}
              {event.documentPath && (
                <div>
                  <p className="text-muted-foreground text-xs mb-1">Document Path</p>
                  <p className="font-mono text-foreground text-sm break-all">{event.documentPath}</p>
                </div>
              )}
              {event.hash && (
                <>
                  <Separator className="" />
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">Document Hash (SHA-256)</p>
                    <p className="font-mono text-foreground text-sm break-all bg-muted/50 p-2 rounded border">{event.hash}</p>
                  </div>
                </>
              )}
              {event.cid && (
                <>
                  <Separator className="" />
                  <div>
                    <p className="text-muted-foreground text-xs mb-1">IPFS CID</p>
                     <p className="font-mono text-foreground text-sm break-all bg-muted/50 p-2 rounded border">{event.cid}</p>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
