import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Database, Loader2 } from 'lucide-react';
import { testDatabaseConnection, testAllTables, testCoffeeProducts, testDeliveryZones, DatabaseTestResult } from '@/utils/database-test';

const DatabaseTest = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionResult, setConnectionResult] = useState<DatabaseTestResult | null>(null);
  const [tableResults, setTableResults] = useState<Record<string, DatabaseTestResult> | null>(null);
  const [coffeeResult, setCoffeeResult] = useState<DatabaseTestResult | null>(null);
  const [deliveryResult, setDeliveryResult] = useState<DatabaseTestResult | null>(null);

  const runTests = async () => {
    setIsLoading(true);
    setConnectionResult(null);
    setTableResults(null);
    setCoffeeResult(null);
    setDeliveryResult(null);

    try {
      // Test basic connection
      const connResult = await testDatabaseConnection();
      setConnectionResult(connResult);

      // Test all tables
      const tablesResult = await testAllTables();
      setTableResults(tablesResult);

      // Test coffee products
      const coffeeTestResult = await testCoffeeProducts();
      setCoffeeResult(coffeeTestResult);

      // Test delivery zones
      const deliveryTestResult = await testDeliveryZones();
      setDeliveryResult(deliveryTestResult);

    } catch (error) {
      console.error('Database test error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const ResultBadge = ({ result }: { result: DatabaseTestResult }) => (
    <Badge variant={result.success ? "default" : "destructive"} className="ml-2">
      {result.success ? (
        <CheckCircle className="w-3 h-3 mr-1" />
      ) : (
        <AlertCircle className="w-3 h-3 mr-1" />
      )}
      {result.success ? 'PASS' : 'FAIL'}
    </Badge>
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="w-5 h-5" />
            Database Connection Test
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Button 
              onClick={runTests} 
              disabled={isLoading}
              className="w-full"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Running Tests...
                </>
              ) : (
                'Run Database Tests'
              )}
            </Button>

            {/* Connection Test */}
            {connectionResult && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold flex items-center">
                  Database Connection
                  <ResultBadge result={connectionResult} />
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {connectionResult.message}
                </p>
                {connectionResult.error && (
                  <p className="text-sm text-red-600 mt-1">
                    Error: {connectionResult.error}
                  </p>
                )}
              </div>
            )}

            {/* Coffee Products Test */}
            {coffeeResult && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold flex items-center">
                  Coffee Products Table
                  <ResultBadge result={coffeeResult} />
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {coffeeResult.message}
                </p>
                {coffeeResult.error && (
                  <p className="text-sm text-red-600 mt-1">
                    Error: {coffeeResult.error}
                  </p>
                )}
                {coffeeResult.data && Array.isArray(coffeeResult.data) && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">Found coffees:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {coffeeResult.data.map((coffee: any) => (
                        <Badge key={coffee.id} variant="outline" className="text-xs">
                          {coffee.name_en}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Delivery Zones Test */}
            {deliveryResult && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold flex items-center">
                  Delivery Zones Table
                  <ResultBadge result={deliveryResult} />
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  {deliveryResult.message}
                </p>
                {deliveryResult.error && (
                  <p className="text-sm text-red-600 mt-1">
                    Error: {deliveryResult.error}
                  </p>
                )}
                {deliveryResult.data && Array.isArray(deliveryResult.data) && (
                  <div className="mt-2">
                    <p className="text-xs text-muted-foreground">Found zones:</p>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {deliveryResult.data.map((zone: any) => (
                        <Badge key={zone.id} variant="outline" className="text-xs">
                          {zone.name} ({zone.radius_km}km)
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* All Tables Test */}
            {tableResults && (
              <div className="border rounded-lg p-4">
                <h3 className="font-semibold mb-3">All Tables Status</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(tableResults).map(([tableName, result]) => (
                    <div key={tableName} className="flex items-center justify-between p-2 bg-muted rounded">
                      <span className="text-sm font-mono">{tableName}</span>
                      <ResultBadge result={result} />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Instructions */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-semibold text-blue-900 mb-2">Database Setup Instructions</h4>
              <div className="text-sm text-blue-800 space-y-1">
                <p>If tests are failing, you need to set up the database:</p>
                <ol className="list-decimal list-inside space-y-1 ml-2">
                  <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="underline">Supabase Dashboard</a></li>
                  <li>Navigate to your project: <code className="bg-blue-100 px-1 rounded">eticmvmetfpijbavteel</code></li>
                  <li>Go to SQL Editor and run the migration from <code className="bg-blue-100 px-1 rounded">supabase/migrations/001_initial_schema.sql</code></li>
                  <li>Verify tables are created and data is inserted</li>
                  <li>Run this test again to confirm everything works</li>
                </ol>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DatabaseTest;
