'use client';

import { useState, useEffect } from 'react';

interface PersonalizationRule {
  id: string;
  name: string;
  description?: string;
  conditions: any[];
  content: any;
  priority: number;
  isActive: boolean;
}

export default function PersonalizationPage() {
  const [rules, setRules] = useState<PersonalizationRule[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showQuickRule, setShowQuickRule] = useState(false);
  const [quickRule, setQuickRule] = useState({
    name: '',
    trigger: 'first_visit',
    message: '',
    type: 'email' as const
  });

  useEffect(() => {
    loadRules();
  }, []);

  const loadRules = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/personalization/rules', {
        credentials: 'include'
      });
      
      if (!response.ok) {
        throw new Error('Failed to load rules');
      }
      const data = await response.json();
      setRules(data.rules || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load rules');
    } finally {
      setLoading(false);
    }
  };

  const createDefaultTriggers = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Check if default triggers already exist
      const hasDefaultTriggers = rules.some(rule => 
        rule.name.includes('First-time Visitor') ||
        rule.name.includes('Cart Abandonment') ||
        rule.name.includes('High-Value Customer') ||
        rule.name.includes('Re-engagement')
      );
      
      if (hasDefaultTriggers) {
        setError('Default examples already exist! You can create custom campaigns instead.');
        return;
      }
      
      const response = await fetch('/api/personalization/triggers', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create triggers');
      }
      
      await loadRules();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create triggers');
    } finally {
      setLoading(false);
    }
  };

  const createQuickRule = async () => {
    try {
      setLoading(true);
      
      const conditions = getConditionsFromTrigger(quickRule.trigger);
      
      const ruleData = {
        name: quickRule.name,
        description: `Auto-generated rule for ${quickRule.trigger.replace('_', ' ')}`,
        conditions,
        content: {
          type: quickRule.type,
          template: quickRule.message,
          variables: {}
        },
        priority: 50
      };

      const response = await fetch('/api/personalization/rules', {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(ruleData)
      });

      if (response.ok) {
        setShowQuickRule(false);
        setQuickRule({
          name: '',
          trigger: 'first_visit',
          message: '',
          type: 'email'
        });
        await loadRules();
      }
    } catch (error) {
      setError('Failed to create rule');
    } finally {
      setLoading(false);
    }
  };

  const getConditionsFromTrigger = (trigger: string) => {
    switch (trigger) {
      case 'first_visit':
        return [{ field: 'user.behavior.visitCount', operator: 'equals', value: 1, logic: 'AND' }];
      case 'high_spender':
        return [{ field: 'user.behavior.totalSpent', operator: 'greater_than', value: 1000, logic: 'AND' }];
      case 'cart_abandoner':
        return [
          { field: 'user.behavior.cartAbandoned', operator: 'equals', value: true, logic: 'AND' },
          { field: 'user.behavior.cartValue', operator: 'greater_than', value: 50, logic: 'AND' }
        ];
      case 'inactive_user':
        return [{ field: 'user.behavior.lastVisit', operator: 'less_than', value: 30, logic: 'AND' }];
      default:
        return [];
    }
  };

  const getTriggerDescription = (trigger: string) => {
    switch (trigger) {
      case 'first_visit': return 'New visitors to your site';
      case 'high_spender': return 'Customers who spent over $1000';
      case 'cart_abandoner': return 'Users who abandoned cart over $50';
      case 'inactive_user': return 'Users inactive for 30+ days';
      default: return '';
    }
  };

  const getTriggerExample = (trigger: string) => {
    switch (trigger) {
      case 'first_visit': return 'Welcome {user.firstName}! Get 10% off your first order with code WELCOME10';
      case 'high_spender': return 'VIP Access: Early access to our new collection, {user.firstName}!';
      case 'cart_abandoner': return 'Don\'t forget your cart, {user.firstName}! Complete your purchase and get free shipping';
      case 'inactive_user': return 'We miss you, {user.firstName}! Here\'s a special 20% discount just for you';
      default: return '';
    }
  };

  const hasDefaultExamples = () => {
    return rules.some(rule => 
      rule.name.includes('First-time Visitor') ||
      rule.name.includes('Cart Abandonment') ||
      rule.name.includes('High-Value Customer') ||
      rule.name.includes('Re-engagement')
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading personalization...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Smart Customer Experiences
              </h1>
              <p className="text-sm text-gray-600">
                Automatically send personalized messages to boost sales and engagement
              </p>
            </div>
            <div className="flex items-center space-x-3">
              {!hasDefaultExamples() && (
                <button
                  onClick={createDefaultTriggers}
                  className="px-4 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-md transition-colors"
                >
                  Create Examples
                </button>
              )}
              <button
                onClick={() => setShowQuickRule(true)}
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Create Campaign
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-800">{error}</p>
          </div>
        )}

        {/* Value Proposition */}
        <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg shadow-lg p-8 mb-8 text-white">
          <div className="max-w-3xl">
            <h2 className="text-2xl font-bold mb-4">
              Turn Every Customer Interaction Into Revenue
            </h2>
            <p className="text-lg mb-6 opacity-90">
              Automatically send the right message to the right customer at the right time. 
              No manual work, just smart automation that converts.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">📈</div>
                <h3 className="font-semibold mb-1">Boost Sales</h3>
                <p className="text-sm opacity-75">Recover abandoned carts, welcome new customers</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">🎯</div>
                <h3 className="font-semibold mb-1">Personal Touch</h3>
                <p className="text-sm opacity-75">Use customer names, preferences, and behavior</p>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold mb-2">⚡</div>
                <h3 className="font-semibold mb-1">Instant Setup</h3>
                <p className="text-sm opacity-75">Create campaigns in 30 seconds, no coding needed</p>
              </div>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Active Campaigns</h3>
            <p className="text-3xl font-bold text-blue-600">{rules.length}</p>
            <p className="text-sm text-gray-500 mt-1">Running automatically</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Revenue Impact</h3>
            <p className="text-3xl font-bold text-green-600">
              ${rules.filter(r => r.isActive).length * 250}
            </p>
            <p className="text-sm text-gray-500 mt-1">Estimated monthly increase</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-semibold text-gray-900">Customers Reached</h3>
            <p className="text-3xl font-bold text-purple-600">
              {rules.filter(r => r.isActive).length * 150}
            </p>
            <p className="text-sm text-gray-500 mt-1">This month</p>
          </div>
        </div>

        {/* Campaign Examples */}
        <div className="bg-white rounded-lg shadow mb-8">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Popular Campaign Examples</h2>
            <p className="text-sm text-gray-600 mt-1">These campaigns work for most businesses</p>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-green-600 text-sm font-bold">1</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Welcome New Customers</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Send a personalized welcome message with a discount code to first-time visitors
                </p>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <strong>Example:</strong> "Welcome Sarah! Get 10% off your first order with code WELCOME10"
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  <span className="bg-green-100 text-green-800 px-2 py-1 rounded">+15% conversion</span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-blue-600 text-sm font-bold">2</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Recover Abandoned Carts</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Remind customers about items they left in their cart with an incentive
                </p>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <strong>Example:</strong> "Don't forget your cart! Complete your purchase and get free shipping"
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">+25% recovery</span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-purple-600 text-sm font-bold">3</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">VIP Customer Rewards</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Give special treatment to high-value customers with exclusive offers
                </p>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <strong>Example:</strong> "VIP Access: Early access to our new collection, Sarah!"
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded">+40% loyalty</span>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center mb-3">
                  <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center mr-3">
                    <span className="text-orange-600 text-sm font-bold">4</span>
                  </div>
                  <h3 className="font-semibold text-gray-900">Re-engage Inactive Users</h3>
                </div>
                <p className="text-sm text-gray-600 mb-3">
                  Bring back customers who haven't visited in a while with special offers
                </p>
                <div className="bg-gray-50 p-3 rounded text-sm">
                  <strong>Example:</strong> "We miss you, Sarah! Here's a special 20% discount just for you"
                </div>
                <div className="mt-3 text-xs text-gray-500">
                  <span className="bg-orange-100 text-orange-800 px-2 py-1 rounded">+30% re-engagement</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Your Campaigns */}
        <div className="bg-white rounded-lg shadow">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">Your Active Campaigns</h2>
          </div>
          
          {rules.length === 0 ? (
            <div className="px-6 py-12 text-center">
              <div className="text-gray-400 text-6xl mb-4">🚀</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No campaigns yet</h3>
              <p className="text-gray-600 mb-4">
                Create your first campaign to start automatically engaging customers and boosting sales.
              </p>
              <button
                onClick={() => setShowQuickRule(true)}
                className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
              >
                Create Your First Campaign
              </button>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {rules.map((rule) => (
                <div key={rule.id} className="px-6 py-4 hover:bg-gray-50">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-medium text-gray-900">{rule.name}</h3>
                      {rule.description && (
                        <p className="text-sm text-gray-600 mt-1">{rule.description}</p>
                      )}
                      <div className="mt-2 flex items-center space-x-4 text-xs text-gray-500">
                        <span>Type: {rule.content.type}</span>
                        <span className={`px-2 py-1 rounded-full ${
                          rule.isActive 
                            ? 'bg-green-100 text-green-800' 
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {rule.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Simple Quick Rule Modal */}
      {showQuickRule && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-10 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Create Smart Campaign</h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Campaign Name
                  </label>
                  <input
                    type="text"
                    value={quickRule.name}
                    onChange={(e) => setQuickRule({...quickRule, name: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Welcome New Customers"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    When to Send
                  </label>
                  <select
                    value={quickRule.trigger}
                    onChange={(e) => setQuickRule({...quickRule, trigger: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="first_visit">First-time visitors</option>
                    <option value="high_spender">High-value customers</option>
                    <option value="cart_abandoner">Cart abandoners</option>
                    <option value="inactive_user">Inactive users</option>
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    {getTriggerDescription(quickRule.trigger)}
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Message Type
                  </label>
                  <select
                    value={quickRule.type}
                    onChange={(e) => setQuickRule({...quickRule, type: e.target.value as any})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="email">Email</option>
                    <option value="sms">SMS</option>
                    <option value="push">Push Notification</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Your Message
                  </label>
                  <textarea
                    value={quickRule.message}
                    onChange={(e) => setQuickRule({...quickRule, message: e.target.value})}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder={getTriggerExample(quickRule.trigger)}
                    rows={3}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Use {'{user.firstName}'} for personalization
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowQuickRule(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={createQuickRule}
                  disabled={!quickRule.name || !quickRule.message}
                  className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Create Campaign
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 