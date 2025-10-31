'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, Database, CheckCircle, XCircle } from 'lucide-react';
import { seedAllData } from '@/lib/utils/seedDataHelper';

export default function SeedDataPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ success: boolean; message: string; details?: string[] } | null>(null);

  const handleSeedData = async () => {
    setLoading(true);
    setResult(null);

    try {
      const response = await seedAllData();
      setResult(response);
    } catch (error) {
      setResult({
        success: false,
        message: error instanceof Error ? error.message : 'Failed to seed data',
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-6 w-6" />
            Seed Test Data
          </CardTitle>
          <CardDescription>
            Generate realistic test data for comprehensive testing of all features
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="font-semibold">This will create:</h3>
            <ul className="space-y-2 text-sm">
              <li>✓ Complete Chart of Accounts (~50 accounts)</li>
              <li>✓ 10 Clients</li>
              <li>✓ 5 Services</li>
              <li>✓ 8 Products</li>
              <li>✓ 8 Employees</li>
              <li>✓ 6 Fixed Assets</li>
              <li>✓ ~100 Transactions (6 months)</li>
              <li>✓ ~70 Sales Entries (3 months)</li>
              <li>✓ 24 Payroll Entries (3 months)</li>
            </ul>
          </div>

          <Alert>
            <AlertDescription>
              <strong>Warning:</strong> This will clear existing data and create fresh test data.
              Only use this in development/testing environments.
            </AlertDescription>
          </Alert>

          <Button
            onClick={handleSeedData}
            disabled={loading}
            size="lg"
            className="w-full"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Seeding Data...
              </>
            ) : (
              <>
                <Database className="mr-2 h-4 w-4" />
                Seed Test Data
              </>
            )}
          </Button>

          {result && (
            <Alert variant={result.success ? 'default' : 'destructive'}>
              <div className="flex items-start gap-2">
                {result.success ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <XCircle className="h-5 w-5" />
                )}
                <div className="flex-1">
                  <AlertDescription>
                    <p className="font-semibold">{result.message}</p>
                    {result.details && (
                      <ul className="mt-2 space-y-1 text-sm">
                        {result.details.map((detail, idx) => (
                          <li key={idx}>• {detail}</li>
                        ))}
                      </ul>
                    )}
                  </AlertDescription>
                </div>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
