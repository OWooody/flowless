import prisma from '../prisma';

// Core personalization types
export interface PersonalizationRule {
  id: string;
  name: string;
  description?: string;
  conditions: PersonalizationCondition[];
  content: DynamicContent;
  priority: number;
  isActive: boolean;
  organizationId: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface PersonalizationCondition {
  field: string; // 'user.behavior', 'user.demographics', 'context'
  operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'in' | 'not_in' | 'exists' | 'not_exists';
  value: any;
  logic: 'AND' | 'OR';
}

export interface DynamicContent {
  type: 'email' | 'sms' | 'push' | 'web' | 'api';
  template: string;
  variables: Record<string, string>;
  fallback?: string;
  metadata?: Record<string, any>;
}

export interface UserProfile {
  id: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  behavior: {
    visitCount: number;
    lastVisit: Date;
    totalSpent: number;
    lastPurchase?: Date;
    cartValue?: number;
    cartAbandoned?: boolean;
    favoriteCategory?: string;
    searchTerms?: string[];
  };
  demographics: {
    age?: number;
    location?: string;
    device?: string;
    platform?: string;
  };
  preferences: {
    emailFrequency?: 'daily' | 'weekly' | 'monthly';
    categories?: string[];
    priceRange?: string;
  };
}

export interface PersonalizationContext {
  user: UserProfile;
  context: {
    currentPage?: string;
    referrer?: string;
    timeOfDay?: 'morning' | 'afternoon' | 'evening' | 'night';
    weather?: string;
    device?: string;
    location?: string;
  };
  session: {
    sessionId: string;
    startTime: Date;
    pageViews: string[];
    interactions: any[];
  };
}

export class PersonalizationEngine {
  private rules: PersonalizationRule[] = [];

  constructor() {}

  // Load personalization rules from database
  async loadRules(organizationId: string): Promise<void> {
    try {
      const rules = await prisma.personalizationRule.findMany({
        where: { 
          organizationId,
          isActive: true 
        },
        orderBy: { priority: 'desc' }
      });
      
      this.rules = rules.map(rule => ({
        ...rule,
        conditions: rule.conditions as PersonalizationCondition[],
        content: rule.content as DynamicContent
      }));
    } catch (error) {
      console.error('Error loading personalization rules:', error);
      this.rules = [];
    }
  }

  // Create a new personalization rule
  async createRule(ruleData: {
    name: string;
    description?: string;
    conditions: PersonalizationCondition[];
    content: DynamicContent;
    priority: number;
    organizationId: string;
  }): Promise<PersonalizationRule> {
    try {
      const rule = await prisma.personalizationRule.create({
        data: {
          name: ruleData.name,
          description: ruleData.description,
          conditions: ruleData.conditions,
          content: ruleData.content,
          priority: ruleData.priority,
          organizationId: ruleData.organizationId
        }
      });

      return {
        ...rule,
        conditions: rule.conditions as PersonalizationCondition[],
        content: rule.content as DynamicContent
      };
    } catch (error) {
      console.error('Error creating personalization rule:', error);
      throw error;
    }
  }

  // Evaluate user against all rules and return matching content
  async evaluateUser(userId: string, context: Partial<PersonalizationContext>): Promise<DynamicContent[]> {
    const user = await this.getUserProfile(userId);
    if (!user) {
      return [];
    }

    const fullContext: PersonalizationContext = {
      user,
      context: context.context || {},
      session: context.session || { sessionId: '', startTime: new Date(), pageViews: [], interactions: [] }
    };

    const matchingRules = this.rules.filter(rule => 
      this.evaluateConditions(rule.conditions, fullContext)
    );

    return matchingRules
      .sort((a, b) => b.priority - a.priority)
      .map(rule => this.generateContent(rule.content, fullContext));
  }

  // Evaluate conditions for a rule
  private evaluateConditions(conditions: PersonalizationCondition[], context: PersonalizationContext): boolean {
    if (conditions.length === 0) return true;

    return conditions.every(condition => {
      const value = this.getNestedValue(context, condition.field);
      return this.evaluateCondition(condition, value);
    });
  }

  // Evaluate a single condition
  private evaluateCondition(condition: PersonalizationCondition, actualValue: any): boolean {
    switch (condition.operator) {
      case 'equals':
        return actualValue === condition.value;
      case 'contains':
        return typeof actualValue === 'string' && actualValue.includes(condition.value);
      case 'greater_than':
        return Number(actualValue) > Number(condition.value);
      case 'less_than':
        return Number(actualValue) < Number(condition.value);
      case 'in':
        return Array.isArray(condition.value) && condition.value.includes(actualValue);
      case 'not_in':
        return Array.isArray(condition.value) && !condition.value.includes(actualValue);
      case 'exists':
        return actualValue !== undefined && actualValue !== null;
      case 'not_exists':
        return actualValue === undefined || actualValue === null;
      default:
        return false;
    }
  }

  // Get nested value from context object
  private getNestedValue(obj: any, path: string): any {
    return path.split('.').reduce((current, key) => {
      return current && current[key] !== undefined ? current[key] : undefined;
    }, obj);
  }

  // Generate personalized content
  private generateContent(content: DynamicContent, context: PersonalizationContext): DynamicContent {
    const personalizedTemplate = this.replaceVariables(content.template, context);
    const personalizedVariables = this.personalizeVariables(content.variables, context);

    return {
      ...content,
      template: personalizedTemplate,
      variables: personalizedVariables
    };
  }

  // Replace variables in template
  private replaceVariables(template: string, context: PersonalizationContext): string {
    return template.replace(/\{([^}]+)\}/g, (match, variable) => {
      const value = this.getNestedValue(context, variable);
      return value !== undefined ? String(value) : match;
    });
  }

  // Personalize variables object
  private personalizeVariables(variables: Record<string, string>, context: PersonalizationContext): Record<string, string> {
    const personalized: Record<string, string> = {};
    
    for (const [key, value] of Object.entries(variables)) {
      personalized[key] = this.replaceVariables(value, context);
    }
    
    return personalized;
  }

  // Get user profile from database
  private async getUserProfile(userId: string): Promise<UserProfile | null> {
    try {
      // Get user events to build behavior profile
      const events = await prisma.event.findMany({
        where: { userId },
        orderBy: { timestamp: 'desc' },
        take: 100
      });

      if (events.length === 0) return null;

      // Build behavior profile from events
      const behavior = this.buildBehaviorProfile(events);
      
      // Get user demographics from events
      const demographics = this.extractDemographics(events);
      
      // Get user preferences
      const preferences = this.extractPreferences(events);

      // Extract user info from event properties
      const lastEvent = events[0];
      const properties = lastEvent?.properties as any || {};
      
      return {
        id: userId,
        email: properties.userEmail || (lastEvent?.userPhone as string),
        firstName: properties.userFirstName,
        lastName: properties.userLastName,
        behavior,
        demographics,
        preferences
      };
    } catch (error) {
      console.error('Error getting user profile:', error);
      return null;
    }
  }

  // Build behavior profile from events
  private buildBehaviorProfile(events: any[]): UserProfile['behavior'] {
    const behavior: UserProfile['behavior'] = {
      visitCount: events.filter(e => e.name === 'page_view').length,
      lastVisit: new Date(events[0]?.timestamp || Date.now()),
      totalSpent: events
        .filter(e => e.name === 'purchase')
        .reduce((sum, e) => sum + (e.value || 0), 0),
      lastPurchase: events.find(e => e.name === 'purchase')?.timestamp,
      cartValue: events.find(e => e.name === 'add_to_cart')?.value,
      cartAbandoned: events.some(e => e.name === 'cart_abandoned'),
      favoriteCategory: this.getMostFrequentValue(events, 'itemCategory'),
      searchTerms: events
        .filter(e => e.name === 'search')
        .map(e => e.itemName)
        .filter(Boolean)
    };

    return behavior;
  }

  // Extract demographics from events
  private extractDemographics(events: any[]): UserProfile['demographics'] {
    const lastEvent = events[0];
    
    return {
      age: lastEvent?.userAge,
      location: lastEvent?.userLocation,
      device: lastEvent?.userDevice,
      platform: lastEvent?.userPlatform
    };
  }

  // Extract preferences from events
  private extractPreferences(events: any[]): UserProfile['preferences'] {
    const categories = events
      .filter(e => e.itemCategory)
      .map(e => e.itemCategory);
    
    const uniqueCategories = [...new Set(categories)];
    
    return {
      emailFrequency: 'weekly', // Default
      categories: uniqueCategories,
      priceRange: this.calculatePriceRange(events)
    };
  }

  // Get most frequent value from events
  private getMostFrequentValue(events: any[], field: string): string | undefined {
    const values = events
      .map(e => e[field])
      .filter(Boolean);
    
    if (values.length === 0) return undefined;
    
    const frequency: Record<string, number> = {};
    values.forEach(value => {
      frequency[value] = (frequency[value] || 0) + 1;
    });
    
    return Object.entries(frequency)
      .sort(([,a], [,b]) => b - a)[0]?.[0];
  }

  // Calculate price range from events
  private calculatePriceRange(events: any[]): string {
    const prices = events
      .filter(e => e.value && e.name === 'purchase')
      .map(e => e.value);
    
    if (prices.length === 0) return 'unknown';
    
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    if (avgPrice < 50) return 'low';
    if (avgPrice < 200) return 'medium';
    return 'high';
  }

  // Create behavioral trigger rules
  async createBehavioralTriggers(organizationId: string): Promise<void> {
    console.log('🔍 Creating behavioral triggers for org:', organizationId);
    
    const defaultTriggers: Omit<PersonalizationRule, 'id' | 'createdAt' | 'updatedAt'>[] = [
      {
        name: 'First-time Visitor Welcome',
        description: 'Welcome message for new visitors',
        conditions: [
          { field: 'user.behavior.visitCount', operator: 'equals', value: 1, logic: 'AND' }
        ],
        content: {
          type: 'email',
          template: 'Welcome to our platform, {user.firstName}! Here\'s your 10% discount: {discountCode}',
          variables: { discountCode: 'WELCOME10' }
        },
        priority: 100,
        isActive: true,
        organizationId
      },
      {
        name: 'Cart Abandonment Recovery',
        description: 'Recover abandoned carts with incentives',
        conditions: [
          { field: 'user.behavior.cartAbandoned', operator: 'equals', value: true, logic: 'AND' },
          { field: 'user.behavior.cartValue', operator: 'greater_than', value: 50, logic: 'AND' }
        ],
        content: {
          type: 'sms',
          template: 'Don\'t forget your cart! Complete your purchase and get free shipping: {cartUrl}',
          variables: { cartUrl: 'user.cartUrl' }
        },
        priority: 90,
        isActive: true,
        organizationId
      },
      {
        name: 'High-Value Customer VIP',
        description: 'VIP treatment for high-spending customers',
        conditions: [
          { field: 'user.behavior.totalSpent', operator: 'greater_than', value: 1000, logic: 'AND' },
          { field: 'user.behavior.lastPurchase', operator: 'exists', value: null, logic: 'AND' }
        ],
        content: {
          type: 'email',
          template: 'VIP Access: Early access to our new collection! {earlyAccessUrl}',
          variables: { earlyAccessUrl: 'user.earlyAccessUrl' }
        },
        priority: 80,
        isActive: true,
        organizationId
      },
      {
        name: 'Re-engagement Campaign',
        description: 'Re-engage inactive customers',
        conditions: [
          { field: 'user.behavior.lastVisit', operator: 'less_than', value: 30, logic: 'AND' },
          { field: 'user.behavior.totalSpent', operator: 'greater_than', value: 0, logic: 'AND' }
        ],
        content: {
          type: 'email',
          template: 'We miss you, {user.firstName}! Here\'s a special offer just for you: {specialOffer}',
          variables: { specialOffer: 'MISSYOU20' }
        },
        priority: 70,
        isActive: true,
        organizationId
      }
    ];

    // Save default triggers to database
    for (const trigger of defaultTriggers) {
      await prisma.personalizationRule.create({
        data: {
          name: trigger.name,
          description: trigger.description,
          conditions: trigger.conditions,
          content: trigger.content,
          priority: trigger.priority,
          isActive: trigger.isActive,
          organizationId: trigger.organizationId
        }
      });
    }
  }
} 