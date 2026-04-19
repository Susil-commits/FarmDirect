import { useRouter } from '../context/RouterContext';
import Button from '../components/common/Button';

export default function RoutingTest() {
  const { navigate, currentRoute } = useRouter();

  const testRoutes = [
    { name: 'Home', path: '/' },
    { name: 'Marketplace', path: '/marketplace' },
    { name: 'Start Shopping', path: '/start-shopping' },
    { name: 'Join as Farmer', path: '/join-farmer' },
    { name: 'Cart', path: '/cart' },
    { name: 'Wishlist', path: '/wishlist' },
    { name: 'Profile', path: '/profile' },
  ];

  const handleClick = (path) => {
    console.log('Test button clicked:', path);
    navigate(path);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-cyan-50 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">🧪 Routing Test Page</h1>
        <p className="text-lg text-gray-700 mb-8 p-4 bg-white rounded-lg shadow">
          Current Route: <strong className="text-blue-600">{currentRoute}</strong>
        </p>

        <div className="bg-white rounded-lg shadow-lg p-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Test Navigation</h2>
          <p className="text-gray-600 mb-6">Open browser DevTools (F12) and check the console for logs when clicking buttons:</p>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {testRoutes.map((route) => (
              <Button
                key={route.path}
                variant={currentRoute === route.path ? 'primary' : 'outline'}
                size="md"
                onClick={() => handleClick(route.path)}
                className="text-center"
              >
                {route.name}
              </Button>
            ))}
          </div>

          <div className="mt-8 p-4 bg-yellow-50 border-2 border-yellow-200 rounded-lg">
            <h3 className="font-bold text-yellow-900 mb-2">✅ How to Debug:</h3>
            <ol className="list-decimal list-inside space-y-2 text-yellow-900">
              <li>Open DevTools (F12) and go to Console tab</li>
              <li>Click on any button above</li>
              <li>{`You should see: "Navigate called: { from: '...', to: '...' }"`}</li>
              <li>You should also see: "Updating route to: ..." logs</li>
              <li>If the route doesn't change, check for errors in the console</li>
            </ol>
          </div>

          <div className="mt-8 p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
            <h3 className="font-bold text-blue-900 mb-2">📋 Debug Information:</h3>
            <pre className="bg-white p-4 rounded text-sm overflow-auto text-gray-800">
{`Current Route: ${currentRoute}
Navigator Available: ${typeof navigate === 'function'}
Environment: ${import.meta.env.MODE}`}
            </pre>
          </div>
        </div>

        <div className="mt-8 p-4 bg-green-50 border-2 border-green-200 rounded-lg">
          <h3 className="font-bold text-green-900 mb-2">💡 Next Steps:</h3>
          <ul className="list-disc list-inside space-y-2 text-green-900">
            <li>If navigation works here, the issue is elsewhere (e.g., Home page buttons)</li>
            <li>If navigation doesn't work here either, the issue is with RouterContext</li>
            <li>Check that no CSS is blocking clicks (pointer-events: none)</li>
            <li>Verify React DevTools shows state updates</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
